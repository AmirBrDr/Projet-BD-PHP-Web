<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

$pdo = gp_pdo($config);
gp_ensure_replies_table($pdo);

$auth = gp_require_authenticated_user($config, 'employe');
$employeId = $auth['id_user'];
gp_assert_employe_exists($pdo, $employeId);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = trim((string)($_GET['action'] ?? ''));

try {
    if ($method === 'GET' && $action === 'dashboard_summary') {
        // Resume de moderation personnelle (reponses)
        $stmt = $pdo->prepare(
            'SELECT
                COUNT(*) AS total_replies,
                COALESCE(SUM(CASE WHEN statut_reponse = \'pending\' THEN 1 ELSE 0 END), 0) AS pending_count,
                COALESCE(SUM(CASE WHEN statut_reponse = \'approved\' THEN 1 ELSE 0 END), 0) AS approved_count,
                COALESCE(SUM(CASE WHEN statut_reponse = \'rejected\' THEN 1 ELSE 0 END), 0) AS rejected_count
             FROM Reponse_Defi
             WHERE Id_Employe = :employe_id'
        );
        $stmt->execute([':employe_id' => $employeId]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $stmt2 = $pdo->prepare(
            'SELECT
                rd.Id_reponse,
                rd.Id_defi,
                d.nomDefi,
                rd.Id_actions,
                                t.nomTheme,
                a.nomAction,
                rd.reponse_text,
                rd.commentaire_animateur,
                                to_char(rd.date_reponse, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_reponse,
                                to_char(rd.date_traitement, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_traitement
             FROM Reponse_Defi rd
             JOIN Defi d ON d.Id_defi = rd.Id_defi
                         LEFT JOIN Actions a ON a.Id_actions = rd.Id_actions
                         LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
                         LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
             WHERE rd.Id_Employe = :employe_id
                             AND rd.statut_reponse = \'approved\'
             ORDER BY rd.date_traitement DESC NULLS LAST, rd.date_reponse DESC
             LIMIT 6'
        );
        $stmt2->execute([':employe_id' => $employeId]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => [
                'summary' => $summary,
                'approved' => $stmt2->fetchAll(PDO::FETCH_ASSOC),
            ],
        ]);
    }

    if ($method === 'GET' && $action === 'challenges') {
        // Liste des defis du mois + derniere reponse
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
                     to_char(r.mois, \'YYYY-MM\') AS mois,
                lr.Id_reponse AS latest_reply_id,
                lr.statut_reponse AS latest_status,
                     to_char(lr.date_reponse, \'YYYY-MM-DD"T"HH24:MI:SS\') AS latest_date
             FROM Defi d
             JOIN Regroupe r ON r.Id_defi = d.Id_defi
             JOIN Thematique t ON t.Id_thematique = r.Id_thematique
             JOIN Utilisateur u_anim ON u_anim.Id_User = d.Id_Animateur
             JOIN Utilisateur u_emp ON u_emp.Id_User = :employe_id
             LEFT JOIN LATERAL (
                 SELECT
                    rd.Id_reponse,
                    rd.statut_reponse,
                    rd.date_reponse
                 FROM Reponse_Defi rd
                 WHERE rd.Id_defi = d.Id_defi
                   AND rd.Id_Employe = :employe_id_sub
                 ORDER BY rd.date_reponse DESC
                 LIMIT 1
             ) lr ON TRUE
             WHERE u_anim.Id_Entreprise = u_emp.Id_Entreprise
                             AND DATE_TRUNC(\'month\', r.mois) = DATE_TRUNC(\'month\', CURRENT_DATE)
             ORDER BY r.ordre ASC, d.Id_defi ASC'
        );
        $stmt->execute([
            ':employe_id' => $employeId,
            ':employe_id_sub' => $employeId,
        ]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'GET' && $action === 'my_replies') {
        // Historique des reponses filtre par statut
        $status = strtolower(trim((string)($_GET['status'] ?? 'all')));
        $params = [':employe_id' => $employeId];

        $where = 'WHERE rd.Id_Employe = :employe_id';
        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $where .= ' AND rd.statut_reponse = :status_filter';
            $params[':status_filter'] = $status;
        }

        $sql =
            'SELECT
                rd.Id_reponse,
                rd.Id_defi,
                d.nomDefi,
                rd.Id_actions,
                t.nomTheme,
                a.nomAction,
                rd.reponse_text,
                rd.statut_reponse,
                rd.commentaire_animateur,
                     to_char(rd.date_reponse, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_reponse,
                     to_char(rd.date_traitement, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_traitement
             FROM Reponse_Defi rd
             JOIN Defi d ON d.Id_defi = rd.Id_defi
             LEFT JOIN Actions a ON a.Id_actions = rd.Id_actions
             LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
             LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
             ' . $where . '
             ORDER BY rd.date_reponse DESC';

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            if (is_int($value)) {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, (string)$value, PDO::PARAM_STR);
            }
        }
        $stmt->execute();

        gp_send_json(200, [
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'POST' && $action === 'reply_create') {
        // Creer une reponse a moderer par l'animateur
        $body = gp_read_json_body();
        $challengeId = (int)($body['idDefi'] ?? $body['id_defi'] ?? 0);
        $replyText = trim((string)($body['reponse'] ?? $body['reponse_text'] ?? ''));

        if ($challengeId <= 0) {
            gp_send_json(400, ['message' => 'Defis invalide']);
        }
        if ($replyText === '') {
            gp_send_json(400, ['message' => 'La reponse est obligatoire']);
        }

        $stmt = $pdo->prepare(
            'SELECT 1
             FROM Defi d
             JOIN Utilisateur u_anim ON u_anim.Id_User = d.Id_Animateur
             JOIN Utilisateur u_emp ON u_emp.Id_User = :employe_id
             WHERE d.Id_defi = :challenge_id
               AND u_anim.Id_Entreprise = u_emp.Id_Entreprise
             LIMIT 1'
        );
        $stmt->execute([
            ':employe_id' => $employeId,
            ':challenge_id' => $challengeId,
        ]);

        if (!$stmt->fetch()) {
            gp_send_json(404, ['message' => 'Defis introuvable']);
        }

        $insert = $pdo->prepare(
            'INSERT INTO Reponse_Defi (Id_defi, Id_Employe, reponse_text)
             VALUES (:challenge_id, :employe_id, :reponse_text)
             RETURNING Id_reponse'
        );
        $insert->execute([
            ':challenge_id' => $challengeId,
            ':employe_id' => $employeId,
            ':reponse_text' => $replyText,
        ]);

        $replyId = (int)($insert->fetchColumn() ?: 0);

        gp_send_json(201, [
            'status' => 'success',
            'message' => 'Reponse envoyee a l\'animateur pour validation',
            'data' => [
                'id_reponse' => $replyId,
            ],
        ]);
    }

    gp_send_json(404, ['message' => 'Action inconnue']);
} catch (Throwable $e) {
    $message = !empty($config['debug'])
        ? ($e->getMessage() ?: 'Erreur serveur')
        : 'Erreur serveur';

    gp_send_json(500, ['message' => $message]);
}

/**
 * Exige un utilisateur authentifie avec un role precis.
 */
function gp_require_authenticated_user(array $config, string $requiredRole): array
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

    $idUser = (int)($payload['sub'] ?? 0);
    $role = gp_normalize_role((string)($payload['role'] ?? ''));

    if ($idUser <= 0) {
        gp_send_json(401, ['message' => 'Utilisateur invalide']);
    }

    if ($role !== $requiredRole) {
        gp_send_json(403, ['message' => 'Acces refuse']);
    }

    return [
        'id_user' => $idUser,
        'role' => $role,
        'payload' => $payload,
    ];
}

/**
 * Verifie l'existence de l'employe en base.
 */
function gp_assert_employe_exists(PDO $pdo, int $employeId): void
{
    $stmt = $pdo->prepare(
        'SELECT 1
         FROM Employe
         WHERE Id_Employe = :employe_id
         LIMIT 1'
    );
    $stmt->execute([':employe_id' => $employeId]);

    if (!$stmt->fetch()) {
        gp_send_json(403, ['message' => 'Compte employe introuvable']);
    }
}

