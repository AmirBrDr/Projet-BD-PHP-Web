<?php

// Fichier: api/modules/users/user-management.php - API et logique serveur.

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

/**
 * Vérifie que la requête provient d'un administrateur via un token JWT valide.
 * Envoie une réponse JSON en cas d'erreur (401 non autorisé, 403 accès refusé).
 * 
 * @param array $config Configuration contenant les paramètres JWT
 * @return array Payload du token JWT vérifié
 */
function users_require_admin(array $config): array
{
    // Extrait le token Bearer du header Authorization
    $token = gp_get_bearer_token();
    if ($token === '') {
        gp_send_json(401, ['message' => 'Token manquant']);
    }

    try {
        // Valide et décode le token JWT
        $payload = gp_jwt_verify($token, $config['jwt']);
    } catch (Throwable $e) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }

    // Normalise et valide que le rôle est admin
    $role = gp_normalize_role((string)($payload['role'] ?? ''));
    if ($role !== 'admin') {
        gp_send_json(403, ['message' => 'Accès réservé aux administrateurs']);
    }

    return $payload;
}

/**
 * Génère la requête SQL DELETE appropriée en fonction du rôle de l'utilisateur.
 * Différencie entre employé, admin et animateur.
 * 
 * @param string $role Le rôle de l'utilisateur (employe, admin, animateur)
 * @return string Requête SQL DELETE paramétrée
 * @throws InvalidArgumentException Si le rôle est inconnu
 */
function users_role_delete_sql(string $role): string
{
    // Normalise le rôle en minuscules et sans accents
    $normalized = gp_normalize_role($role);
    
    // Retourne la requête DELETE appropriée selon le rôle
    if ($normalized === 'employe') {
        return 'DELETE FROM Employe WHERE Id_Employe = :id';
    }
    if ($normalized === 'admin') {
        return 'DELETE FROM Admin WHERE Id_Admin = :id';
    }
    if ($normalized === 'animateur') {
        return 'DELETE FROM Animateur WHERE Id_Animateur = :id';
    }

    // Erreur si le rôle ne correspond à aucune table
    throw new InvalidArgumentException('Rôle inconnu');
}

/**
 * Résout l'ID d'une équipe à partir d'un ID numérique ou d'un nom d'équipe.
 * Retourne null si la valeur est vide ou invalide.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @param mixed $value ID numérique ou nom de l'équipe
 * @return int|null ID de l'équipe ou null si non trouvée
 * @throws InvalidArgumentException Si l'équipe n'existe pas
 */
function users_resolve_team_id(PDO $pdo, mixed $value): ?int
{
    // Retourne null si la valeur est vide ou nulle (cas où aucune équipe n'est spécifiée)
    if ($value === null || $value === '') {
        return null;
    }

    // Traite les valeurs numériques comme des IDs directs
    if (is_numeric($value)) {
        $id = (int)$value;
        // Ignore les IDs négatives ou nulles
        if ($id <= 0) {
            return null;
        }

        // Vérifie que l'équipe existe avec cet ID
        $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE id_equipe = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Équipe inconnue');
        }

        return (int)$row['id_equipe'];
    }

    // Traite les valeurs textuelles comme des noms d'équipe (recherche insensible à la casse)
    $name = trim((string)$value);
    if ($name === '') {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE LOWER(nomequipe) = LOWER(:nom) LIMIT 1');
    $stmt->execute([':nom' => $name]);
    $row = $stmt->fetch();

    // Lève une erreur si l'équipe n'existe pas
    if (!$row) {
        throw new InvalidArgumentException('Équipe inconnue: ' . $name);
    }

    return (int)$row['id_equipe'];
}

/**
 * Résout l'ID d'une entreprise à partir d'un ID ou d'un nom.
 * Crée l'entreprise automatiquement si elle n'existe pas et qu'un nom est fourni.
 * Sinon, retourne la première entreprise disponible ou en crée une par défaut.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @param mixed $idEntreprise ID numérique de l'entreprise
 * @param mixed $nomEntreprise Nom de l'entreprise
 * @return int ID de l'entreprise
 * @throws RuntimeException Si impossible de créer l'entreprise par défaut
 */
function users_resolve_enterprise_id(PDO $pdo, mixed $idEntreprise, mixed $nomEntreprise): int
{
    // Cas 1: Un ID d'entreprise valide est fourni
    if (is_numeric($idEntreprise) && (int)$idEntreprise > 0) {
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE id_entreprise = :id LIMIT 1');
        $stmt->execute([':id' => (int)$idEntreprise]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Entreprise inconnue');
        }
        return (int)$row['id_entreprise'];
    }

    // Cas 2: Un nom d'entreprise est fourni
    $name = trim((string)$nomEntreprise);
    if ($name !== '') {
        // Cherche une entreprise existante avec ce nom (insensible à la casse)
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE LOWER(nomentreprise) = LOWER(:nom) LIMIT 1');
        $stmt->execute([':nom' => $name]);
        $row = $stmt->fetch();
        if ($row) {
            return (int)$row['id_entreprise'];
        }

        // Créé l'entreprise si elle n'existe pas
        $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, NULL) RETURNING id_entreprise');
        $stmt->execute([':nom' => $name]);
        $created = $stmt->fetch();
        return (int)($created['id_entreprise'] ?? 0);
    }

    // Cas 3: Aucun identifiant fourni, utilise la première entreprise ou en crée une par défaut
    $stmt = $pdo->query('SELECT id_entreprise FROM entreprise ORDER BY id_entreprise ASC LIMIT 1');
    $row = $stmt->fetch();
    if ($row) {
        return (int)$row['id_entreprise'];
    }

    // Créé l'entreprise par défaut si aucune n'existe
    $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, NULL) RETURNING id_entreprise');
    $stmt->execute([':nom' => 'Entreprise par défaut']);
    $created = $stmt->fetch();
    $id = (int)($created['id_entreprise'] ?? 0);
    if ($id <= 0) {
        throw new RuntimeException('Impossible de créer l\'entreprise par défaut');
    }

    return $id;
}

/**
 * Génère un mot de passe aléatoire de 12 caractères.
 * Contient majuscules, minuscules, chiffres et caractères spéciaux.
 * 
 * @return string Mot de passe aléatoire
 */
function users_random_password(): string
{
    // Ensemble de caractères autorisés (exclut les caractères ambigus: I, O, l, 1, 0)
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    $len = strlen($chars);
    $value = '';
    
    // Génère 12 caractères aléatoires
    for ($i = 0; $i < 12; $i++) {
        $value .= $chars[random_int(0, $len - 1)];
    }
    
    return $value;
}

/**
 * Récupère la liste complète des utilisateurs avec leurs informations.
 * Inclut les données de rôle, équipe et entreprise associées.
 * Envoie une réponse JSON avec les données triées par ID décroissant.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @return void Envoie une réponse JSON
 */
function users_list(PDO $pdo): void
{
    // Requête JOIN complexe pour récupérer les données utilisateur avec rôles et équipes
    $sql = "
        SELECT
            u.id_user,
            u.nomuser,
            u.prenomuser,
            u.email,
            u.statutuser,
            u.inscriptionuser,
            u.id_entreprise,
            ent.nomentreprise,
            -- Détermine le rôle de l'utilisateur (employe, admin, animateur)
            CASE
                WHEN emp.id_employe IS NOT NULL THEN 'employe'
                WHEN adm.id_admin IS NOT NULL THEN 'admin'
                WHEN anm.id_animateur IS NOT NULL THEN 'animateur'
                ELSE NULL
            END AS role,
            emp.id_equipe,
            eq.nomequipe,
            emp.departementemploye AS departement
        FROM utilisateur u
        LEFT JOIN employe emp ON emp.id_employe = u.id_user
        LEFT JOIN admin adm ON adm.id_admin = u.id_user
        LEFT JOIN animateur anm ON anm.id_animateur = u.id_user
        LEFT JOIN equipe eq ON eq.id_equipe = emp.id_equipe
        LEFT JOIN entreprise ent ON ent.id_entreprise = u.id_entreprise
        ORDER BY u.id_user DESC
    ";

    // Exécute la requête et récupère tous les résultats
    $rows = $pdo->query($sql)->fetchAll();
    
    // Envoie la réponse JSON avec la liste des utilisateurs
    gp_send_json(200, ['items' => $rows]);
}

/**
 * Crée un nouvel utilisateur avec son rôle et autres attributs.
 * Valide les données d'entrée et utilise une transaction pour garantir la cohérence.
 * Génère un mot de passe aléatoire si aucun n'est fourni.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @return void Envoie une réponse JSON (201 succès, 400/409 erreur)
 */
function users_create(PDO $pdo): void
{
    // Lit le corps JSON de la requête
    $body = gp_read_json_body();

    // Extrait et nettoie les paramètres utilisateur du corps JSON
    $nomUser = trim((string)($body['nomUser'] ?? ''));
    $prenomUser = trim((string)($body['prenomUser'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $statutUser = trim((string)($body['statutUser'] ?? 'actif'));
    $role = gp_normalize_role((string)($body['role'] ?? 'employe'));
    $teamInput = $body['idEquipe'] ?? $body['team'] ?? null;
    $password = (string)($body['mdp'] ?? '');
    $idEntreprise = $body['idEntreprise'] ?? null;
    $nomEntreprise = $body['nomEntreprise'] ?? null;

    // Validation des champs obligatoires
    if ($nomUser === '' || $prenomUser === '' || $email === '') {
        gp_send_json(400, ['message' => 'Nom, prénom et email sont requis']);
    }
    // Validation du format email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        gp_send_json(400, ['message' => 'Email invalide']);
    }
    // Validation du rôle utilisateur
    if (!gp_is_valid_role($role)) {
        gp_send_json(400, ['message' => 'Rôle invalide']);
    }
    // Validation du statut (doit être parmi les valeurs autorisées)
    if (!in_array($statutUser, ['actif', 'inactif', 'suspendu'], true)) {
        gp_send_json(400, ['message' => 'Statut invalide']);
    }
    // Génère un mot de passe aléatoire si aucun n'est fourni
    if ($password === '') {
        $password = users_random_password();
    }
    // Valide la longeur minimale du mot de passe
    if (strlen($password) < 6) {
        gp_send_json(400, ['message' => 'Mot de passe trop court']);
    }

    try {
        // Résout l'ID d'équipe et d'entreprise à partir des identifiants fournis
        $teamId = users_resolve_team_id($pdo, $teamInput);
        $enterpriseId = users_resolve_enterprise_id($pdo, $idEntreprise, $nomEntreprise);

        // Vérifie si l'email n'est pas déjà utilisé
        $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            gp_send_json(409, ['message' => 'Email déjà utilisé']);
        }

        // Début de la transaction pour garantir la cohérence des données
        $pdo->beginTransaction();
        try {
            // Insère l'utilisateur principal avec email et mot de passe hashé
            $stmt = $pdo->prepare('INSERT INTO utilisateur (nomuser, prenomuser, email, statutuser, mdp, id_entreprise) VALUES (:nom, :prenom, :email, :statut, :mdp, :entreprise) RETURNING id_user');
            $stmt->execute([
                ':nom' => $nomUser,
                ':prenom' => $prenomUser,
                ':email' => $email,
                ':statut' => $statutUser,
                ':mdp' => password_hash($password, PASSWORD_DEFAULT),
                ':entreprise' => $enterpriseId,
            ]);
            $row = $stmt->fetch();
            $userId = (int)($row['id_user'] ?? 0);
            if ($userId <= 0) {
                throw new RuntimeException('Création utilisateur impossible');
            }

            // Insère le rôle spécifique (employe, admin ou animateur)
            gp_insert_user_role($pdo, $userId, $role);

            // Assigne l'équipe si c'est un employé
            if ($role === 'employe') {
                $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId WHERE id_employe = :id');
                $stmt->execute([
                    ':teamId' => $teamId,
                    ':id' => $userId,
                ]);
            }

            // Valide la transaction
            $pdo->commit();
        } catch (Throwable $inner) {
            // Annule les changements en cas d'erreur
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        // Envoie une réponse de succès
        gp_send_json(201, ['message' => 'Utilisateur créé']);
    } catch (InvalidArgumentException $e) {
        // Erreurs de validation (équipe inconnue, etc.)
        gp_send_json(400, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        // Autres erreurs serveur
        gp_send_json(500, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Erreur serveur']);
    }
}

/**
 * Met à jour les informations d'un utilisateur existant.
 * Peut modifier le rôle, les données personnelles, le mot de passe et l'équipe.
 * Utilise une transaction pour garantir la cohérence des données de rôle.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @param int $id ID de l'utilisateur à mettre à jour
 * @return void Envoie une réponse JSON (200 succès, 400/404/409 erreur)
 */
function users_update(PDO $pdo, int $id): void
{
    // Valide que l'ID est positif
    if ($id <= 0) {
        gp_send_json(400, ['message' => 'ID invalide']);
    }

    // Lit le corpus JSON de la requête
    $body = gp_read_json_body();
    // Extrait les paramètres de mise à jour
    $nomUser = trim((string)($body['nomUser'] ?? ''));
    $prenomUser = trim((string)($body['prenomUser'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $statutUser = trim((string)($body['statutUser'] ?? 'actif'));
    $newRole = gp_normalize_role((string)($body['role'] ?? 'employe'));
    $teamInput = $body['idEquipe'] ?? $body['team'] ?? null;
    $password = (string)($body['mdp'] ?? '');

    // Validation des champs obligatoires
    if ($nomUser === '' || $prenomUser === '' || $email === '') {
        gp_send_json(400, ['message' => 'Nom, prénom et email sont requis']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        gp_send_json(400, ['message' => 'Email invalide']);
    }
    if (!gp_is_valid_role($newRole)) {
        gp_send_json(400, ['message' => 'Rôle invalide']);
    }
    if (!in_array($statutUser, ['actif', 'inactif', 'suspendu'], true)) {
        gp_send_json(400, ['message' => 'Statut invalide']);
    }
    // Valide le mot de passe s'il est fourni
    if ($password !== '' && strlen($password) < 6) {
        gp_send_json(400, ['message' => 'Mot de passe trop court']);
    }

    // Vérifie que l'utilisateur existe
    $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    try {
        // Résout les ID d'équipe et récupère le rôle actuel
        $teamId = users_resolve_team_id($pdo, $teamInput);
        $currentRole = gp_resolve_user_role($pdo, $id);
        if ($currentRole === null) {
            gp_send_json(400, ['message' => 'Rôle actuel introuvable']);
        }

        // Vérifie que le nouvel email n'est pas utilisé par un autre utilisateur
        $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email AND id_user <> :id LIMIT 1');
        $stmt->execute([':email' => $email, ':id' => $id]);
        if ($stmt->fetch()) {
            gp_send_json(409, ['message' => 'Email déjà utilisé']);
        }

        // Début de la transaction pour mettre à jour l'utilisateur
        $pdo->beginTransaction();
        try {
            // Construit la requête UPDATE dynamiquement selon les champs fournis
            $sql = 'UPDATE utilisateur SET nomuser = :nom, prenomuser = :prenom, email = :email, statutuser = :statut';
            $params = [
                ':nom' => $nomUser,
                ':prenom' => $prenomUser,
                ':email' => $email,
                ':statut' => $statutUser,
                ':id' => $id,
            ];
            // Ajoute la mise à jour du mot de passe si fourni
            if ($password !== '') {
                $sql .= ', mdp = :mdp';
                $params[':mdp'] = password_hash($password, PASSWORD_DEFAULT);
            }
            $sql .= ' WHERE id_user = :id';

            // Exécute la mise à jour utilisateur
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Met à jour le rôle si changement détecté
            if ($currentRole !== $newRole) {
                $stmt = $pdo->prepare(users_role_delete_sql($currentRole));
                $stmt->execute([':id' => $id]);
                gp_insert_user_role($pdo, $id, $newRole);
            }

            // Met à jour l'équipe et le département si c'est un employé
            if ($newRole === 'employe') {
                $dept = substr(trim((string)($body['departement'] ?? '')), 0, 100);
                $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId, departementemploye = :dept WHERE id_employe = :id');
                $stmt->execute([':teamId' => $teamId, ':dept' => $dept !== '' ? $dept : null, ':id' => $id]);
            }

            // Valide la transaction
            $pdo->commit();
        } catch (Throwable $inner) {
            // Annule les changements en cas d'erreur
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        // Envoie la réponse de succès
        gp_send_json(200, ['message' => 'Utilisateur mis à jour']);
    } catch (InvalidArgumentException $e) {
        gp_send_json(400, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        gp_send_json(500, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Erreur serveur']);
    }
}

/**
 * Supprime complètement un utilisateur et ses données de rôle.
 * Utilise une transaction pour garantir la suppression cohérente.
 * Supprime d'abord les rôles spécifiques, puis l'enregistrement utilisateur principal.
 * 
 * @param PDO $pdo Connexion à la base de données
 * @param int $id ID de l'utilisateur à supprimer
 * @return void Envoie une réponse JSON (200 succès, 404/409 erreur)
 */
function users_delete(PDO $pdo, int $id): void
{
    // Valide que l'ID est positif
    if ($id <= 0) {
        gp_send_json(400, ['message' => 'ID invalide']);
    }

    // Vérifie que l'utilisateur existe avant suppression
    $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    try {
        // Début de la transaction pour supprimer l'utilisateur et ses rôles
        $pdo->beginTransaction();
        try {
            // Supprime tous les rôles associés (employe, admin, animateur)
            foreach (['DELETE FROM employe WHERE id_employe = :id', 'DELETE FROM admin WHERE id_admin = :id', 'DELETE FROM animateur WHERE id_animateur = :id'] as $sql) {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':id' => $id]);
            }

            // Supprime l'enregistrement utilisateur principal
            $stmt = $pdo->prepare('DELETE FROM utilisateur WHERE id_user = :id');
            $stmt->execute([':id' => $id]);

            // Valide la transaction
            $pdo->commit();
        } catch (Throwable $inner) {
            // Annule les changements en cas d'erreur
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        // Envoie la réponse de succès
        gp_send_json(200, ['message' => 'Utilisateur supprimé']);
    } catch (Throwable $e) {
        // Retourne 409 si la suppression échoue (probablement des données liées)
        gp_send_json(409, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Suppression impossible (données liées)']);
    }
}

/**
 * Importe plusieurs utilisateurs en masse à partir d'un tableau JSON.
 * Traite chaque ligne indépendamment et collecte les erreurs sans interrompre.
 * Supporte plusieurs formats de noms de colonnes (flexibilité).
 * 
 * @param PDO $pdo Connexion à la base de données
 * @return void Envoie une réponse JSON avec le nombre créé et la liste des erreurs
 */
function users_import(PDO $pdo): void
{
    // Lit le corpus JSON de la requête
    $body = gp_read_json_body();
    // Récupère le tableau des lignes à importer
    $rows = $body['rows'] ?? null;
    
    // Valide que nous avons des lignes à importer
    if (!is_array($rows) || count($rows) === 0) {
        gp_send_json(400, ['message' => 'Aucune ligne à importer']);
    }

    // Compteurs pour le suivi de l'import
    $created = 0;
    $errors = [];

    // Traite chaque ligne indépendamment pour permettre les erreurs partielles
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            $errors[] = ['line' => $index + 1, 'error' => 'Ligne invalide'];
            continue;
        }

        try {
            // Extrait et parse le nom complet si fourni (flexible : plusieurs formats)
            $nomComplet = trim((string)($row['nom_complet'] ?? $row['nomComplet'] ?? $row['nom'] ?? ''));
            $nom = trim((string)($row['nom'] ?? ''));
            $prenom = trim((string)($row['prenom'] ?? ''));

            // Divise le nom complet en prénom et nom si nécessaire
            if ($nom === '' && $prenom === '' && $nomComplet !== '') {
                $parts = preg_split('/\s+/', $nomComplet) ?: [];
                $prenom = trim((string)array_shift($parts));
                $nom = trim(implode(' ', $parts));
                if ($nom === '') {
                    $nom = $prenom;
                }
            }

            // Extrait les autres paramètres (flexible: supporte plusieurs noms de colonnes)
            $email = trim((string)($row['email'] ?? ''));
            $role = gp_normalize_role((string)($row['role'] ?? 'employe'));
            $statut = trim((string)($row['statut'] ?? 'actif'));
            $team = $row['id_equipe'] ?? $row['idEquipe'] ?? $row['equipe'] ?? '';
            $enterprise = $row['id_entreprise'] ?? $row['idEntreprise'] ?? null;
            $nomEntreprise = $row['entreprise'] ?? $row['nom_entreprise'] ?? '';
            $password = trim((string)($row['mdp'] ?? $row['mot_de_passe'] ?? ''));

            // Génère un mot de passe aléatoire si aucun n'est fourni
            if ($password === '') {
                $password = users_random_password();
            }

            // Construit le payload pour la création d'utilisateur
            $payload = [
                'nomUser' => $nom,
                'prenomUser' => $prenom,
                'email' => $email,
                'statutUser' => $statut,
                'role' => $role,
                'idEquipe' => $team,
                'idEntreprise' => $enterprise,
                'nomEntreprise' => $nomEntreprise,
                'mdp' => $password,
            ];

            // Prépare la requête POST simulée
            $_SERVER['REQUEST_METHOD'] = 'POST';
            $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                throw new RuntimeException('Encodage JSON impossible');
            }

            // Valide les champs obligatoires
            $nomUser = trim((string)($payload['nomUser'] ?? ''));
            $prenomUser = trim((string)($payload['prenomUser'] ?? ''));
            if ($nomUser === '' || $prenomUser === '' || $email === '') {
                throw new InvalidArgumentException('Nom, prénom et email requis');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Email invalide');
            }
            if (!gp_is_valid_role($role)) {
                throw new InvalidArgumentException('Rôle invalide');
            }

            // Résout les IDs d'équipe et d'entreprise
            $teamId = users_resolve_team_id($pdo, $team);
            $enterpriseId = users_resolve_enterprise_id($pdo, $enterprise, $nomEntreprise);

            // Vérifie que l'email n'existe pas déjà
            $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            if ($stmt->fetch()) {
                throw new InvalidArgumentException('Email déjà utilisé');
            }

            // Commence la transaction pour créer l'utilisateur
            $pdo->beginTransaction();
            try {
                // Insère l'utilisateur avec le mot de passe hashé
                $stmt = $pdo->prepare('INSERT INTO utilisateur (nomuser, prenomuser, email, statutuser, mdp, id_entreprise) VALUES (:nom, :prenom, :email, :statut, :mdp, :entreprise) RETURNING id_user');
                $stmt->execute([
                    ':nom' => $nomUser,
                    ':prenom' => $prenomUser,
                    ':email' => $email,
                    ':statut' => $statut,
                    ':mdp' => password_hash($password, PASSWORD_DEFAULT),
                    ':entreprise' => $enterpriseId,
                ]);
                $createdUser = $stmt->fetch();
                $userId = (int)($createdUser['id_user'] ?? 0);
                if ($userId <= 0) {
                    throw new RuntimeException('Création utilisateur impossible');
                }

                // Insère le rôle et l'équipe si applicable
                gp_insert_user_role($pdo, $userId, $role);
                if ($role === 'employe') {
                    $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId WHERE id_employe = :id');
                    $stmt->execute([':teamId' => $teamId, ':id' => $userId]);
                }

                // Valide la transaction
                $pdo->commit();
                $created++;
            } catch (Throwable $inner) {
                // Annule en cas d'erreur
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $inner;
            }
        } catch (Throwable $e) {
            // Enregistre l'erreur sans interrompre l'import
            $errors[] = [
                'line' => $index + 1,
                'error' => $e->getMessage(),
            ];
        }
    }

    // Envoie le rapport d'import avec le nombre créé et la liste des erreurs
    gp_send_json(200, [
        'message' => 'Import traité',
        'created' => $created,
        'errors' => $errors,
    ]);
}

/**
 * ============= POINT D'ENTRÉE PRINCIPAL =============
 * Route HTTP pour la gestion des utilisateurs (CRUD + import en masse)
 * Requiert authentification administrateur.
 * 
 * Méthodes supportées:
 * - GET:    Récupère la liste des utilisateurs
 * - POST:   Crée un utilisateur OU importe en masse (?action=import)
 * - PUT:    Met à jour un utilisateur (?id=123)
 * - DELETE: Supprime un utilisateur (?id=123)
 */
users_require_admin($config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
// Récupère l'action optionnelle pour les opérations spéciales (import, etc.)
$action = strtolower(trim((string)($_GET['action'] ?? '')));
// Récupère l'ID utilisateur pour les opérations PUT et DELETE
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    // Établit la connexion à la base de données PostgreSQL
    $pdo = gp_pdo($config);

    // GET: Liste tous les utilisateurs avec leurs informations
    if ($method === 'GET') {
        users_list($pdo);
    }

    // POST import: Importe plusieurs utilisateurs en masse
    if ($method === 'POST' && $action === 'import') {
        users_import($pdo);
    }

    // POST: Crée un nouvel utilisateur
    if ($method === 'POST') {
        users_create($pdo);
    }

    // PUT: Met à jour un utilisateur existant
    if ($method === 'PUT') {
        users_update($pdo, $id);
    }

    // DELETE: Supprime un utilisateur et toutes ses données
    if ($method === 'DELETE') {
        users_delete($pdo, $id);
    }

    // Si aucune route ne correspond, retourner 405 - Méthode non autorisée
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
} catch (Throwable $e) {
    // Gestion globale des erreurs non attrapées
    gp_send_json(500, ['message' => !empty($config['debug']) ? $e->getMessage() : 'Erreur serveur']);
}
