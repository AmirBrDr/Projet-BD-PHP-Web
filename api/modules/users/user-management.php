<?php

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

function users_require_admin(array $config): array
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

    $role = gp_normalize_role((string)($payload['role'] ?? ''));
    if ($role !== 'admin') {
        gp_send_json(403, ['message' => 'Accès réservé aux administrateurs']);
    }

    return $payload;
}

function users_role_delete_sql(string $role): string
{
    $normalized = gp_normalize_role($role);
    if ($normalized === 'employe') {
        return 'DELETE FROM Employe WHERE Id_Employe = :id';
    }
    if ($normalized === 'admin') {
        return 'DELETE FROM Admin WHERE Id_Admin = :id';
    }
    if ($normalized === 'animateur') {
        return 'DELETE FROM Animateur WHERE Id_Animateur = :id';
    }

    throw new InvalidArgumentException('Rôle inconnu');
}

function users_resolve_team_id(PDO $pdo, mixed $value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    if (is_numeric($value)) {
        $id = (int)$value;
        if ($id <= 0) {
            return null;
        }

        $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE id_equipe = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Équipe inconnue');
        }

        return (int)$row['id_equipe'];
    }

    $name = trim((string)$value);
    if ($name === '') {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE LOWER(nomequipe) = LOWER(:nom) LIMIT 1');
    $stmt->execute([':nom' => $name]);
    $row = $stmt->fetch();

    if (!$row) {
        throw new InvalidArgumentException('Équipe inconnue: ' . $name);
    }

    return (int)$row['id_equipe'];
}

function users_resolve_enterprise_id(PDO $pdo, mixed $idEntreprise, mixed $nomEntreprise): int
{
    if (is_numeric($idEntreprise) && (int)$idEntreprise > 0) {
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE id_entreprise = :id LIMIT 1');
        $stmt->execute([':id' => (int)$idEntreprise]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new InvalidArgumentException('Entreprise inconnue');
        }
        return (int)$row['id_entreprise'];
    }

    $name = trim((string)$nomEntreprise);
    if ($name !== '') {
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE LOWER(nomentreprise) = LOWER(:nom) LIMIT 1');
        $stmt->execute([':nom' => $name]);
        $row = $stmt->fetch();
        if ($row) {
            return (int)$row['id_entreprise'];
        }

        $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, NULL) RETURNING id_entreprise');
        $stmt->execute([':nom' => $name]);
        $created = $stmt->fetch();
        return (int)($created['id_entreprise'] ?? 0);
    }

    $stmt = $pdo->query('SELECT id_entreprise FROM entreprise ORDER BY id_entreprise ASC LIMIT 1');
    $row = $stmt->fetch();
    if ($row) {
        return (int)$row['id_entreprise'];
    }

    $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, NULL) RETURNING id_entreprise');
    $stmt->execute([':nom' => 'Entreprise par défaut']);
    $created = $stmt->fetch();
    $id = (int)($created['id_entreprise'] ?? 0);
    if ($id <= 0) {
        throw new RuntimeException('Impossible de créer l\'entreprise par défaut');
    }

    return $id;
}

function users_random_password(): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    $len = strlen($chars);
    $value = '';
    for ($i = 0; $i < 12; $i++) {
        $value .= $chars[random_int(0, $len - 1)];
    }
    return $value;
}

function users_list(PDO $pdo): void
{
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
            CASE
                WHEN emp.id_employe IS NOT NULL THEN 'employe'
                WHEN adm.id_admin IS NOT NULL THEN 'admin'
                WHEN anm.id_animateur IS NOT NULL THEN 'animateur'
                ELSE NULL
            END AS role,
            emp.id_equipe,
            eq.nomequipe
        FROM utilisateur u
        LEFT JOIN employe emp ON emp.id_employe = u.id_user
        LEFT JOIN admin adm ON adm.id_admin = u.id_user
        LEFT JOIN animateur anm ON anm.id_animateur = u.id_user
        LEFT JOIN equipe eq ON eq.id_equipe = emp.id_equipe
        LEFT JOIN entreprise ent ON ent.id_entreprise = u.id_entreprise
        ORDER BY u.id_user DESC
    ";

    $rows = $pdo->query($sql)->fetchAll();
    gp_send_json(200, ['items' => $rows]);
}

function users_create(PDO $pdo): void
{
    $body = gp_read_json_body();

    $nomUser = trim((string)($body['nomUser'] ?? ''));
    $prenomUser = trim((string)($body['prenomUser'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $statutUser = trim((string)($body['statutUser'] ?? 'actif'));
    $role = gp_normalize_role((string)($body['role'] ?? 'employe'));
    $teamInput = $body['idEquipe'] ?? $body['team'] ?? null;
    $password = (string)($body['mdp'] ?? '');
    $idEntreprise = $body['idEntreprise'] ?? null;
    $nomEntreprise = $body['nomEntreprise'] ?? null;

    if ($nomUser === '' || $prenomUser === '' || $email === '') {
        gp_send_json(400, ['message' => 'Nom, prénom et email sont requis']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        gp_send_json(400, ['message' => 'Email invalide']);
    }
    if (!gp_is_valid_role($role)) {
        gp_send_json(400, ['message' => 'Rôle invalide']);
    }
    if (!in_array($statutUser, ['actif', 'inactif', 'suspendu'], true)) {
        gp_send_json(400, ['message' => 'Statut invalide']);
    }
    if ($password === '') {
        $password = users_random_password();
    }
    if (strlen($password) < 6) {
        gp_send_json(400, ['message' => 'Mot de passe trop court']);
    }

    try {
        $teamId = users_resolve_team_id($pdo, $teamInput);
        $enterpriseId = users_resolve_enterprise_id($pdo, $idEntreprise, $nomEntreprise);

        $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        if ($stmt->fetch()) {
            gp_send_json(409, ['message' => 'Email déjà utilisé']);
        }

        $pdo->beginTransaction();
        try {
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

            gp_insert_user_role($pdo, $userId, $role);

            if ($role === 'employe') {
                $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId WHERE id_employe = :id');
                $stmt->execute([
                    ':teamId' => $teamId,
                    ':id' => $userId,
                ]);
            }

            $pdo->commit();
        } catch (Throwable $inner) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        gp_send_json(201, ['message' => 'Utilisateur créé']);
    } catch (InvalidArgumentException $e) {
        gp_send_json(400, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        gp_send_json(500, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Erreur serveur']);
    }
}

function users_update(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        gp_send_json(400, ['message' => 'ID invalide']);
    }

    $body = gp_read_json_body();
    $nomUser = trim((string)($body['nomUser'] ?? ''));
    $prenomUser = trim((string)($body['prenomUser'] ?? ''));
    $email = trim((string)($body['email'] ?? ''));
    $statutUser = trim((string)($body['statutUser'] ?? 'actif'));
    $newRole = gp_normalize_role((string)($body['role'] ?? 'employe'));
    $teamInput = $body['idEquipe'] ?? $body['team'] ?? null;
    $password = (string)($body['mdp'] ?? '');

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
    if ($password !== '' && strlen($password) < 6) {
        gp_send_json(400, ['message' => 'Mot de passe trop court']);
    }

    $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    try {
        $teamId = users_resolve_team_id($pdo, $teamInput);
        $currentRole = gp_resolve_user_role($pdo, $id);
        if ($currentRole === null) {
            gp_send_json(400, ['message' => 'Rôle actuel introuvable']);
        }

        $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email AND id_user <> :id LIMIT 1');
        $stmt->execute([':email' => $email, ':id' => $id]);
        if ($stmt->fetch()) {
            gp_send_json(409, ['message' => 'Email déjà utilisé']);
        }

        $pdo->beginTransaction();
        try {
            $sql = 'UPDATE utilisateur SET nomuser = :nom, prenomuser = :prenom, email = :email, statutuser = :statut';
            $params = [
                ':nom' => $nomUser,
                ':prenom' => $prenomUser,
                ':email' => $email,
                ':statut' => $statutUser,
                ':id' => $id,
            ];
            if ($password !== '') {
                $sql .= ', mdp = :mdp';
                $params[':mdp'] = password_hash($password, PASSWORD_DEFAULT);
            }
            $sql .= ' WHERE id_user = :id';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            if ($currentRole !== $newRole) {
                $stmt = $pdo->prepare(users_role_delete_sql($currentRole));
                $stmt->execute([':id' => $id]);
                gp_insert_user_role($pdo, $id, $newRole);
            }

            if ($newRole === 'employe') {
                $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId WHERE id_employe = :id');
                $stmt->execute([':teamId' => $teamId, ':id' => $id]);
            }

            $pdo->commit();
        } catch (Throwable $inner) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        gp_send_json(200, ['message' => 'Utilisateur mis à jour']);
    } catch (InvalidArgumentException $e) {
        gp_send_json(400, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        gp_send_json(500, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Erreur serveur']);
    }
}

function users_delete(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        gp_send_json(400, ['message' => 'ID invalide']);
    }

    $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE id_user = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        gp_send_json(404, ['message' => 'Utilisateur introuvable']);
    }

    try {
        $pdo->beginTransaction();
        try {
            foreach (['DELETE FROM employe WHERE id_employe = :id', 'DELETE FROM admin WHERE id_admin = :id', 'DELETE FROM animateur WHERE id_animateur = :id'] as $sql) {
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':id' => $id]);
            }

            $stmt = $pdo->prepare('DELETE FROM utilisateur WHERE id_user = :id');
            $stmt->execute([':id' => $id]);

            $pdo->commit();
        } catch (Throwable $inner) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $inner;
        }

        gp_send_json(200, ['message' => 'Utilisateur supprimé']);
    } catch (Throwable $e) {
        gp_send_json(409, ['message' => !empty($GLOBALS['config']['debug']) ? $e->getMessage() : 'Suppression impossible (données liées)']);
    }
}

function users_import(PDO $pdo): void
{
    $body = gp_read_json_body();
    $rows = $body['rows'] ?? null;
    if (!is_array($rows) || count($rows) === 0) {
        gp_send_json(400, ['message' => 'Aucune ligne à importer']);
    }

    $created = 0;
    $errors = [];

    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            $errors[] = ['line' => $index + 1, 'error' => 'Ligne invalide'];
            continue;
        }

        try {
            $nomComplet = trim((string)($row['nom_complet'] ?? $row['nomComplet'] ?? $row['nom'] ?? ''));
            $nom = trim((string)($row['nom'] ?? ''));
            $prenom = trim((string)($row['prenom'] ?? ''));

            if ($nom === '' && $prenom === '' && $nomComplet !== '') {
                $parts = preg_split('/\s+/', $nomComplet) ?: [];
                $prenom = trim((string)array_shift($parts));
                $nom = trim(implode(' ', $parts));
                if ($nom === '') {
                    $nom = $prenom;
                }
            }

            $email = trim((string)($row['email'] ?? ''));
            $role = gp_normalize_role((string)($row['role'] ?? 'employe'));
            $statut = trim((string)($row['statut'] ?? 'actif'));
            $team = $row['id_equipe'] ?? $row['idEquipe'] ?? $row['equipe'] ?? '';
            $enterprise = $row['id_entreprise'] ?? $row['idEntreprise'] ?? null;
            $nomEntreprise = $row['entreprise'] ?? $row['nom_entreprise'] ?? '';
            $password = trim((string)($row['mdp'] ?? $row['mot_de_passe'] ?? ''));

            if ($password === '') {
                $password = users_random_password();
            }

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

            $_SERVER['REQUEST_METHOD'] = 'POST';
            $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                throw new RuntimeException('Encodage JSON impossible');
            }

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

            $teamId = users_resolve_team_id($pdo, $team);
            $enterpriseId = users_resolve_enterprise_id($pdo, $enterprise, $nomEntreprise);

            $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            if ($stmt->fetch()) {
                throw new InvalidArgumentException('Email déjà utilisé');
            }

            $pdo->beginTransaction();
            try {
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

                gp_insert_user_role($pdo, $userId, $role);
                if ($role === 'employe') {
                    $stmt = $pdo->prepare('UPDATE employe SET id_equipe = :teamId WHERE id_employe = :id');
                    $stmt->execute([':teamId' => $teamId, ':id' => $userId]);
                }

                $pdo->commit();
                $created++;
            } catch (Throwable $inner) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $inner;
            }
        } catch (Throwable $e) {
            $errors[] = [
                'line' => $index + 1,
                'error' => $e->getMessage(),
            ];
        }
    }

    gp_send_json(200, [
        'message' => 'Import traité',
        'created' => $created,
        'errors' => $errors,
    ]);
}

users_require_admin($config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = strtolower(trim((string)($_GET['action'] ?? '')));
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    $pdo = gp_pdo($config);

    if ($method === 'GET') {
        users_list($pdo);
    }

    if ($method === 'POST' && $action === 'import') {
        users_import($pdo);
    }

    if ($method === 'POST') {
        users_create($pdo);
    }

    if ($method === 'PUT') {
        users_update($pdo, $id);
    }

    if ($method === 'DELETE') {
        users_delete($pdo, $id);
    }

    gp_send_json(405, ['message' => 'Méthode non autorisée']);
} catch (Throwable $e) {
    gp_send_json(500, ['message' => !empty($config['debug']) ? $e->getMessage() : 'Erreur serveur']);
}
