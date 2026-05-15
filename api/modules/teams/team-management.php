<?php

// Fichier: api/modules/teams/team-management.php - API et logique serveur.

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

/**
 * Exige un administrateur via JWT.
 */
function teams_require_admin(array $config): void
{
    // Récupère et valide le token Bearer
    $token = gp_get_bearer_token();
    if ($token === '') {
        gp_send_json(401, ['message' => 'Token manquant']);
    }

    try {
        // Décode et valide le token JWT
        $payload = gp_jwt_verify($token, $config['jwt']);
    } catch (Throwable $e) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }

    // Vérifie que l'utilisateur est administrateur
    if (gp_normalize_role((string)($payload['role'] ?? '')) !== 'admin') {
        gp_send_json(403, ['message' => 'Accès réservé aux administrateurs']);
    }
}

/**
 * Liste les equipes avec effectifs.
 */
function teams_list(PDO $pdo): void
{
    // Récupère la liste des équipes avec leur statut et nombre de membres
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

    // Exécute et retourne la liste
    $rows = $pdo->query($sql)->fetchAll();
    gp_send_json(200, ['items' => $rows]);
}

/**
 * Cree une equipe si le nom est unique.
 */
function teams_create(PDO $pdo): void
{
    // Lit le corps JSON et extrait le nom d'équipe
    $body = gp_read_json_body();
    $name = trim((string)($body['nomEquipe'] ?? $body['name'] ?? ''));

    // Valide que le nom n'est pas vide
    if ($name === '') {
        gp_send_json(400, ['message' => 'Nom d\'équipe requis']);
    }

    // Verifie que l'equipe n'existe pas deja (insensible a la casse)
    $stmt = $pdo->prepare('SELECT id_equipe FROM equipe WHERE LOWER(nomequipe) = LOWER(:nom) LIMIT 1');
    $stmt->execute([':nom' => $name]);
    if ($stmt->fetch()) {
        gp_send_json(409, ['message' => 'Cette équipe existe déjà']);
    }

    // Insère la nouvelle équipe
    $stmt = $pdo->prepare('INSERT INTO equipe (nomequipe) VALUES (:nom) RETURNING id_equipe, nomequipe');
    $stmt->execute([':nom' => $name]);
    $created = $stmt->fetch();

    // Retourne l'équipe créée
    gp_send_json(201, [
        'message' => 'Équipe créée',
        'team' => $created,
    ]);
}

// Authentification: vérifie que c'est un administrateur
teams_require_admin($config);

// Récupère la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    // Établit la connexion à la base de données
    $pdo = gp_pdo($config);

    // GET: Liste toutes les équipes
    if ($method === 'GET') {
        teams_list($pdo);
    }

    // POST: Crée une nouvelle équipe
    if ($method === 'POST') {
        teams_create($pdo);
    }

    // Erreur si la méthode n'est pas supportée
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
} catch (Throwable $e) {
    // Gestion des erreurs non attrapées
    gp_send_json(500, ['message' => !empty($config['debug']) ? $e->getMessage() : 'Erreur serveur']);
}
