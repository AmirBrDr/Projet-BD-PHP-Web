<?php

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

function teams_require_admin(array $config): void
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

    if (gp_normalize_role((string)($payload['role'] ?? '')) !== 'admin') {
        gp_send_json(403, ['message' => 'Accès réservé aux administrateurs']);
    }
}

function teams_list(PDO $pdo): void
{
    $sql = '
        SELECT
            e.id_equipe,
            e.nomequipe,
            e.nbpointsequipe,
            e.nbco2equipe,
            COUNT(emp.id_employe) AS members
        FROM equipe e
        LEFT JOIN employe emp ON emp.id_equipe = e.id_equipe
        GROUP BY e.id_equipe, e.nomequipe, e.nbpointsequipe, e.nbco2equipe
        ORDER BY e.nomequipe ASC
    ';

    $rows = $pdo->query($sql)->fetchAll();
    gp_send_json(200, ['items' => $rows]);
}

function teams_create(PDO $pdo): void
{
    $body = gp_read_json_body();
    $name = trim((string)($body['nomEquipe'] ?? $body['name'] ?? ''));

    if ($name === '') {
        gp_send_json(400, ['message' => 'Nom d\'équipe requis']);
    }

    $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE LOWER(nomequipe) = LOWER(:nom) LIMIT 1');
    $stmt->execute([':nom' => $name]);
    if ($stmt->fetch()) {
        gp_send_json(409, ['message' => 'Cette équipe existe déjà']);
    }

    $stmt = $pdo->prepare('INSERT INTO equipe (nomequipe) VALUES (:nom) RETURNING id_equipe, nomequipe');
    $stmt->execute([':nom' => $name]);
    $created = $stmt->fetch();

    gp_send_json(201, [
        'message' => 'Équipe créée',
        'team' => $created,
    ]);
}

teams_require_admin($config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = gp_pdo($config);

    if ($method === 'GET') {
        teams_list($pdo);
    }

    if ($method === 'POST') {
        teams_create($pdo);
    }

    gp_send_json(405, ['message' => 'Méthode non autorisée']);
} catch (Throwable $e) {
    gp_send_json(500, ['message' => !empty($config['debug']) ? $e->getMessage() : 'Erreur serveur']);
}
