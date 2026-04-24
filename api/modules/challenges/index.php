<?php

// Fichier: api/modules/challenges/index.php - API et logique serveur.
/**
 * Challenges Module
 * Handles challenges related operations
 */

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

/**
 * Récupère les défis associés à une thématique
 */
function challenges_get_by_thematique(PDO $pdo, int $thematique_id): array
{
    $stmt = $pdo->prepare(
        'SELECT d.Id_defi, d.nomDefi, d.descriptionDefi
         FROM Defi d
         JOIN Regroupe r ON r.Id_defi = d.Id_defi
         WHERE r.Id_thematique = ?
         ORDER BY r.ordre'
    );
    $stmt->execute([$thematique_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Routage
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$query = $_GET['thematique_id'] ?? null;

try {
    $pdo = gp_pdo($config);

    if ($method === 'GET' && $query) {
        $defis = challenges_get_by_thematique($pdo, (int)$query);
        gp_send_json(200, ['defis' => $defis]);
    } else {
        gp_send_json(405, ['message' => 'Méthode non autorisée ou paramètre manquant']);
    }
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
?>
