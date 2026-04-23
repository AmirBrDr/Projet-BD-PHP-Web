<?php
// Fichier: api/modules/challenges/index.php
// Gère les endpoints liés aux défis (animateur)

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');
$pdo = gp_pdo($config);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {

    // GET /api/modules/challenges/?action=list_month
    // Retourne les défis du mois en cours avec leur thématique
    case 'list_month':
        if ($method !== 'GET') { http_response_code(405); exit; }

        $stmt = $pdo->prepare("
            SELECT 
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
            WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY d.Id_defi, d.nomDefi, d.descriptionDefi, 
                     d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
                     t.nomTheme, r.ordre, r.mois
            ORDER BY r.ordre ASC
        ");
        $stmt->execute();
        $defis = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'data' => $defis]);
        break;

    // GET /api/modules/challenges/?action=detail&id=X
    // Retourne le détail d'un défi + ses actions + son forum
    case 'detail':
        if ($method !== 'GET') { http_response_code(405); exit; }

        $id = (int)($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID manquant']); exit; }

        // Infos du défi
        $stmt = $pdo->prepare("
            SELECT d.*, t.nomTheme, r.ordre, r.mois
            FROM Defi d
            JOIN Regroupe r ON r.Id_defi = d.Id_defi
            JOIN Thematique t ON t.Id_thematique = r.Id_thematique
            WHERE d.Id_defi = ?
        ");
        $stmt->execute([$id]);
        $defi = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$defi) { http_response_code(404); echo json_encode(['error' => 'Défi introuvable']); exit; }

        // Actions du défi
        $stmt2 = $pdo->prepare("
            SELECT a.Id_actions, a.nomAction, a.descriptionAction
            FROM Actions a
            JOIN Faire_partie fp ON fp.Id_actions = a.Id_actions
            WHERE fp.Id_defi = ?
        ");
        $stmt2->execute([$id]);
        $actions = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Forum + messages
        $stmt3 = $pdo->prepare("
            SELECT f.Id_forum, f.nomForum
            FROM Forum f
            WHERE f.Id_defi = ?
        ");
        $stmt3->execute([$id]);
        $forum = $stmt3->fetch(PDO::FETCH_ASSOC);

        $messages = [];
        if ($forum) {
            $stmt4 = $pdo->prepare("
                SELECT m.contenuMessage, m.dateMessage,
                       u.nomUser, u.prenomUser
                FROM Message m
                JOIN Utilisateur u ON u.Id_User = m.Id_Employe
                WHERE m.Id_forum = ?
                ORDER BY m.dateMessage DESC
                LIMIT 20
            ");
            $stmt4->execute([$forum['id_forum']]);
            $messages = $stmt4->fetchAll(PDO::FETCH_ASSOC);
        }

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => [
                'defi'     => $defi,
                'actions'  => $actions,
                'forum'    => $forum,
                'messages' => $messages
            ]
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Action inconnue']);
}