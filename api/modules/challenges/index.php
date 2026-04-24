<?php
// Fichier: api/modules/challenges/index.php - API et logique serveur.
/**
 * Challenges Module
 * Handles challenge endpoints for listing, detail, and thematic filtering.
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

try {
    $pdo = gp_pdo($config);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method !== 'GET') {
        gp_send_json(405, ['message' => 'Methode non autorisee']);
    }

    $thematiqueId = $_GET['thematique_id'] ?? null;
    if ($thematiqueId !== null && $thematiqueId !== '') {
        $defis = challenges_get_by_thematique($pdo, (int)$thematiqueId);
        gp_send_json(200, ['defis' => $defis]);
    }

    $action = trim((string)($_GET['action'] ?? ''));
    switch ($action) {
        case 'list_month':
            $stmt = $pdo->prepare(
                'SELECT
                    d.Id_defi,
                    d.nomDefi,
                    d.descriptionDefi,
                    d.nbPointsDefi,
                    d.nbCO2Defi,
                    d.niveauDefi,
                    t.nomTheme,
                    r.ordre,
                    r.mois,
                    COUNT(DISTINCT v.Id_Employe) AS nb_participants
                 FROM Defi d
                 JOIN Regroupe r ON r.Id_defi = d.Id_defi
                 JOIN Thematique t ON t.Id_thematique = r.Id_thematique
                 LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
                 WHERE DATE_TRUNC(\'month\', r.mois) = DATE_TRUNC(\'month\', CURRENT_DATE)
                 GROUP BY d.Id_defi, d.nomDefi, d.descriptionDefi,
                          d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
                          t.nomTheme, r.ordre, r.mois
                 ORDER BY r.ordre ASC'
            );
            $stmt->execute();
            gp_send_json(200, ['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);

        case 'detail':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                gp_send_json(400, ['error' => 'ID manquant']);
            }

            $stmt = $pdo->prepare(
                'SELECT d.*, t.nomTheme, r.ordre, r.mois
                 FROM Defi d
                 JOIN Regroupe r ON r.Id_defi = d.Id_defi
                 JOIN Thematique t ON t.Id_thematique = r.Id_thematique
                 WHERE d.Id_defi = ?'
            );
            $stmt->execute([$id]);
            $defi = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$defi) {
                gp_send_json(404, ['error' => 'Defi introuvable']);
            }

            $stmt2 = $pdo->prepare(
                'SELECT a.Id_actions, a.nomAction, a.descriptionAction
                 FROM Actions a
                 JOIN Faire_partie fp ON fp.Id_actions = a.Id_actions
                 WHERE fp.Id_defi = ?'
            );
            $stmt2->execute([$id]);
            $actions = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            $stmt3 = $pdo->prepare(
                'SELECT f.Id_forum, f.nomForum
                 FROM Forum f
                 WHERE f.Id_defi = ?'
            );
            $stmt3->execute([$id]);
            $forum = $stmt3->fetch(PDO::FETCH_ASSOC);

            $messages = [];
            if ($forum && isset($forum['id_forum'])) {
                $stmt4 = $pdo->prepare(
                    'SELECT m.contenuMessage, m.dateMessage,
                            u.nomUser, u.prenomUser
                     FROM Message m
                     JOIN Utilisateur u ON u.Id_User = m.Id_Employe
                     WHERE m.Id_forum = ?
                     ORDER BY m.dateMessage DESC
                     LIMIT 20'
                );
                $stmt4->execute([$forum['id_forum']]);
                $messages = $stmt4->fetchAll(PDO::FETCH_ASSOC);
            }

            gp_send_json(200, [
                'status' => 'success',
                'data' => [
                    'defi' => $defi,
                    'actions' => $actions,
                    'forum' => $forum,
                    'messages' => $messages,
                ],
            ]);

        default:
            gp_send_json(404, ['error' => 'Action inconnue']);
    }

} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
