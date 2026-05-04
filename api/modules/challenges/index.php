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
                'SELECT d.Id_defi AS idDefi,
                        d.nomDefi AS nomDefi,
                        d.descriptionDefi AS descriptionDefi,
                        d.nbPointsDefi AS nbPointsDefi,
                        d.nbCO2Defi AS nbCO2Defi,
                        d.niveauDefi AS niveauDefi,
                        t.nomTheme AS nomTheme,
                        r.ordre AS ordre,
                        r.mois AS mois,
                        COUNT(DISTINCT v.Id_Employe) AS nbParticipants
                 FROM Defi d
                 JOIN Regroupe r ON r.Id_defi = d.Id_defi
                 JOIN Thematique t ON t.Id_thematique = r.Id_thematique
                 LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
                 WHERE d.Id_defi = ?
                 GROUP BY d.Id_defi, d.nomDefi, d.descriptionDefi,
                          d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
                          t.nomTheme, r.ordre, r.mois'
            );
            $stmt->execute([$id]);
            $defi = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$defi) {
                gp_send_json(404, ['error' => 'Defi introuvable']);
            }

            $stmt2 = $pdo->prepare(
                'SELECT a.Id_actions AS idAction, a.nomAction AS nomAction, a.descriptionAction AS descriptionAction
                 FROM Actions a
                 JOIN Faire_partie fp ON fp.Id_actions = a.Id_actions
                 WHERE fp.Id_defi = ?'
            );
            $stmt2->execute([$id]);
            $actions = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            $stmt3 = $pdo->prepare(
                'SELECT f.Id_forum AS idForum, f.nomForum AS nomForum, f.descriptionForum AS descriptionForum
                 FROM Forum f
                 WHERE f.Id_defi = ?'
            );
            $stmt3->execute([$id]);
            $forum = $stmt3->fetch(PDO::FETCH_ASSOC);

            $messages = [];
            $forumId = $forum['idforum'] ?? $forum['idForum'] ?? $forum['id_forum'] ?? null;
            if ($forum && $forumId) {
                $stmt4 = $pdo->prepare(
                    "SELECT m.Id_Employe AS idEmploye,
                            m.contenuMessage, m.dateMessage,
                            u.nomUser, u.prenomUser, u.pdpUser,
                            CASE
                                WHEN EXISTS (SELECT 1 FROM Animateur an WHERE an.Id_Animateur = u.Id_User) THEN 'animateur'
                                WHEN EXISTS (SELECT 1 FROM Admin ad WHERE ad.Id_Admin = u.Id_User) THEN 'admin'
                                ELSE 'employe'
                            END AS roleUtilisateur
                     FROM Message m
                     JOIN Utilisateur u ON u.Id_User = m.Id_Employe
                     WHERE m.Id_forum = ?
                     ORDER BY m.dateMessage ASC, m.Id_Message ASC"
                );
                $stmt4->execute([$forumId]);
                $messages = $stmt4->fetchAll(PDO::FETCH_ASSOC);
            }

            $defiPayload = [
                'idDefi' => (int) ($defi['iddefi'] ?? 0),
                'nomDefi' => $defi['nomdefi'] ?? '',
                'descriptionDefi' => $defi['descriptiondefi'] ?? '',
                'nbPointsDefi' => (int) ($defi['nbpointsdefi'] ?? 0),
                'nbCO2Defi' => (int) ($defi['nbco2defi'] ?? 0),
                'niveauDefi' => (int) ($defi['niveaudefi'] ?? 0),
                'nomTheme' => $defi['nomtheme'] ?? '',
                'ordre' => $defi['ordre'] ?? null,
                'mois' => $defi['mois'] ?? null,
                'nbParticipants' => (int) ($defi['nbparticipants'] ?? 0),
            ];

            $actionsPayload = array_map(static fn(array $action): array => [
                'idAction' => (int) ($action['idaction'] ?? $action['id_actions'] ?? 0),
                'nomAction' => $action['nomaction'] ?? '',
                'descriptionAction' => $action['descriptionaction'] ?? '',
            ], $actions);

            $forumPayload = null;
            if ($forum) {
                $forumPayload = [
                    'idForum' => (int) ($forum['idforum'] ?? $forum['idForum'] ?? 0),
                    'nomForum' => $forum['nomforum'] ?? ($forum['nomForum'] ?? ''),
                    'descriptionForum' => $forum['descriptionforum'] ?? ($forum['descriptionForum'] ?? null),
                ];
            }

            $messagesPayload = array_map(static fn(array $message): array => [
                'idEmploye' => (int) ($message['idemploye'] ?? 0),
                'contenuMessage' => $message['contenumessage'] ?? '',
                'dateMessage' => $message['datemessage'] ?? null,
                'prenomUser' => $message['prenomuser'] ?? '',
                'nomUser' => $message['nomuser'] ?? '',
                'pdpUser' => $message['pdpuser'] ?? null,
                'roleUtilisateur' => $message['roleutilisateur'] ?? 'employe',
            ], $messages);

            gp_send_json(200, [
                'status' => 'success',
                'data' => [
                    'defi' => $defiPayload,
                    'actions' => $actionsPayload,
                    'forum' => $forumPayload,
                    'messages' => $messagesPayload,
                ],
            ]);

        default:
            gp_send_json(404, ['error' => 'Action inconnue']);
    }

} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
