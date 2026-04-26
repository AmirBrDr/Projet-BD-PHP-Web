<?php

// Fichier: api/modules/profile/index.php - API et logique serveur.
/**
 * Profile Module
 * Handles user profile operations (view and update own profile)
 */

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

/**
 * Vérifie que la requête provient d'un utilisateur authentifié via un token JWT valide.
 * Envoie une réponse JSON en cas d'erreur (401 non autorisé).
 * 
 * @param array $config Configuration contenant les paramètres JWT
 * @return array Payload du token JWT vérifié
 */
function profile_require_auth(array $config): array
{
    $token = gp_get_bearer_token();
    if ($token === '') {
        gp_send_json(401, ['message' => 'Token manquant']);
    }

    try {
        $payload = gp_jwt_verify($token, $config['jwt']);
    } catch (Throwable $e) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }

    return $payload;
}

/**
 * Récupère le profil de l'utilisateur connecté
 */
function profile_get(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('
        SELECT u.id_user, u.nomuser, u.prenomuser, u.email, u.statutuser, u.pdpuser, u.inscriptionuser,
               e.departementemploye, e.nbpointsemploye, e.nbco2, eq.nomequipe
        FROM utilisateur u
        LEFT JOIN employe e ON u.id_user = e.id_employe
        LEFT JOIN equipe eq ON e.id_equipe = eq.id_equipe
        WHERE u.id_user = :id
    ');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur non trouvé']);
    }

    $role = gp_resolve_user_role($pdo, $userId);

    return [
        'idUser' => (int)$user['id_user'],
        'nomUser' => $user['nomuser'],
        'prenomUser' => $user['prenomuser'],
        'email' => $user['email'],
        'statutUser' => $user['statutuser'],
        'pdpUser' => $user['pdpuser'],
        'inscriptionUser' => $user['inscriptionuser'],
        'role' => $role,
        'departementEmploye' => $user['departementemploye'] ?? null,
        'nbPointsEmploye' => (int)($user['nbpointsemploye'] ?? 0),
        'nbCO2' => (int)($user['nbco2'] ?? 0),
        'nomEquipe' => $user['nomequipe'] ?? null,
    ];
}

/**
 * Met à jour le profil de l'utilisateur connecté
 */
function profile_update(PDO $pdo, int $userId, array $data): void
{
    $updates = [];
    $params = [':id' => $userId];

    if (isset($data['nomUser'])) {
        $updates[] = 'nomuser = :nom';
        $params[':nom'] = trim($data['nomUser']);
    }
    if (isset($data['prenomUser'])) {
        $updates[] = 'prenomuser = :prenom';
        $params[':prenom'] = trim($data['prenomUser']);
    }
    if (isset($data['email'])) {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            gp_send_json(400, ['message' => 'Email invalide']);
        }
        // Vérifier unicité email
        $stmt = $pdo->prepare('SELECT 1 FROM utilisateur WHERE email = :email AND id_user != :id LIMIT 1');
        $stmt->execute([':email' => $data['email'], ':id' => $userId]);
        if ($stmt->fetch()) {
            gp_send_json(400, ['message' => 'Email déjà utilisé']);
        }
        $updates[] = 'email = :email';
        $params[':email'] = $data['email'];
    }
    if (isset($data['pdpUser'])) {
        $updates[] = 'pdpuser = :pdp';
        $params[':pdp'] = $data['pdpUser'];
    }

    if (empty($updates)) {
        gp_send_json(400, ['message' => 'Aucune donnée à mettre à jour']);
    }

    $sql = 'UPDATE utilisateur SET ' . implode(', ', $updates) . ' WHERE id_user = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Si employé, mettre à jour département si fourni
    if (isset($data['departementEmploye'])) {
        $stmt = $pdo->prepare('UPDATE employe SET departementemploye = :dept WHERE id_employe = :id');
        $stmt->execute([':dept' => $data['departementEmploye'], ':id' => $userId]);
    }
}

/**
 * Traite l'upload de photo de profil
 */
function profile_handle_avatar_upload(PDO $pdo, int $userId): string
{
    if (!isset($_FILES['avatar'])) {
        gp_send_json(400, ['message' => 'Aucun fichier fourni']);
    }

    $file = $_FILES['avatar'];

    // Vérifier les erreurs d'upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'Fichier trop volumineux (limite serveur)',
            UPLOAD_ERR_FORM_SIZE => 'Fichier trop volumineux',
            UPLOAD_ERR_PARTIAL => 'Upload incomplet',
            UPLOAD_ERR_NO_FILE => 'Aucun fichier',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Impossible d\'écrire le fichier',
            UPLOAD_ERR_EXTENSION => 'Extension non autorisée',
        ];
        $msg = $errors[$file['error']] ?? 'Erreur d\'upload';
        gp_send_json(400, ['message' => $msg]);
    }

    // Vérifier type MIME
    $allowed_mimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowed_mimes)) {
        gp_send_json(400, ['message' => 'Type de fichier non autorisé']);
    }

    // Vérifier taille (5MB max)
    if ($file['size'] > 5 * 1024 * 1024) {
        gp_send_json(400, ['message' => 'Fichier trop volumineux (max 5MB)']);
    }

    // Créer dossier s'il n'existe pas - le dossier public est le document root web
    $public_dir = dirname(__DIR__, 3) . '/public';
    $upload_dir = $public_dir . '/uploads/avatars';
    
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            error_log("Impossible de créer le dossier: $upload_dir");
            gp_send_json(500, ['message' => 'Impossible de créer le dossier d\'upload']);
        }
    }

    // Générer nom de fichier unique
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'avatar_' . $userId . '_' . time() . '.' . $ext;
    $filepath = $upload_dir . '/' . $filename;
    $relative_path = '/uploads/avatars/' . $filename;

    // Déplacer le fichier
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        error_log("Erreur move_uploaded_file: from={$file['tmp_name']} to=$filepath");
        gp_send_json(500, ['message' => 'Impossible de sauvegarder le fichier']);
    }

    // Supprimer l'ancienne photo si elle existe
    $stmt = $pdo->prepare('SELECT pdpuser FROM utilisateur WHERE id_user = :id');
    $stmt->execute([':id' => $userId]);
    $old_pdp = $stmt->fetchColumn();

    if ($old_pdp && strpos($old_pdp, '/uploads/avatars/') !== false) {
        $old_file = $public_dir . $old_pdp;
        if (file_exists($old_file)) {
            unlink($old_file);
        }
    }

    // Mettre à jour la base de données
    $stmt = $pdo->prepare('UPDATE utilisateur SET pdpuser = :pdp WHERE id_user = :id');
    $stmt->execute([':pdp' => $relative_path, ':id' => $userId]);

    return $relative_path;
}

// Routage des requêtes
$method = $_SERVER['REQUEST_METHOD'] ?? '';

try {
    $pdo = gp_pdo($config);
    $payload = profile_require_auth($config);
    $userId = (int)$payload['sub'];

    if ($method === 'GET') {
        $profile = profile_get($pdo, $userId);
        gp_send_json(200, ['profile' => $profile]);
    } elseif ($method === 'POST') {
        // Vérifier si c'est un upload de fichier
        if (isset($_FILES['avatar'])) {
            $avatar_path = profile_handle_avatar_upload($pdo, $userId);
            gp_send_json(200, ['message' => 'Photo mise à jour', 'avatar' => $avatar_path]);
        } else {
            // Sinon traiter comme du JSON (données textuelles)
            $body = gp_read_json_body();
            profile_update($pdo, $userId, $body);
            gp_send_json(200, ['message' => 'Profil mis à jour']);
        }
    } else {
        gp_send_json(405, ['message' => 'Méthode non autorisée']);
    }
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
?>