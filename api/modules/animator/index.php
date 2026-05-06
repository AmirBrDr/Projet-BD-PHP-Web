<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

$pdo = gp_pdo($config);
gp_ensure_replies_table($pdo);
gp_ensure_defi_block_table($pdo);

$auth = gp_require_authenticated_user($config, 'animateur');
$animateurId = $auth['id_user'];
gp_assert_animateur_exists($pdo, $animateurId);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = trim((string)($_GET['action'] ?? ''));

try {
    if ($method === 'GET' && $action === 'dashboard_summary') {
        $stmt = $pdo->prepare(
            'SELECT
                COUNT(DISTINCT d.Id_defi) AS total_defis,
                COUNT(DISTINCT r.Id_thematique) AS total_thematiques,
                COALESCE(SUM(d.nbPointsDefi), 0) AS points_potentiels
             FROM Defi d
             LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
             WHERE d.Id_Animateur = :animateur_id'
        );
        $stmt->execute([':animateur_id' => $animateurId]);
        $kpis = $stmt->fetch() ?: [];

        $stmt2 = $pdo->prepare(
            'SELECT
                COALESCE(SUM(CASE WHEN rd.statut_reponse = \'pending\' THEN 1 ELSE 0 END), 0) AS pending_count,
                COALESCE(SUM(CASE WHEN rd.statut_reponse = \'approved\' THEN 1 ELSE 0 END), 0) AS approved_count,
                COALESCE(SUM(CASE WHEN rd.statut_reponse = \'rejected\' THEN 1 ELSE 0 END), 0) AS rejected_count
             FROM Reponse_Defi rd
             JOIN Defi d ON d.Id_defi = rd.Id_defi
             WHERE d.Id_Animateur = :animateur_id'
        );
        $stmt2->execute([':animateur_id' => $animateurId]);
        $moderation = $stmt2->fetch() ?: [];

        gp_send_json(200, [
            'status' => 'success',
            'data' => [
                'kpis' => $kpis,
                'moderation' => $moderation,
            ],
        ]);
    }

    if ($method === 'GET' && $action === 'themes') {
        $mois = trim((string)($_GET['mois'] ?? ''));
        if ($mois === '') {
            $mois = date('Y-m');
        }
        $moisDate = $mois . '-01';

        $stmt = $pdo->prepare(
            'SELECT
                t.Id_thematique,
                t.nomTheme,
                t.descriptionTheme,
                COALESCE(MAX(r.ordre), 0) + 1 AS next_ordre
             FROM Thematique t
             LEFT JOIN Regroupe r
                ON r.Id_thematique = t.Id_thematique
               AND date_trunc(\'month\', r.mois) = date_trunc(\'month\', :mois::date)
             GROUP BY t.Id_thematique, t.nomTheme, t.descriptionTheme
             ORDER BY t.nomTheme ASC'
        );
        $stmt->execute([':mois' => $moisDate]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'GET' && $action === 'challenges') {
        $stmt = $pdo->prepare(
            'SELECT
                d.Id_defi,
                d.nomDefi,
                d.descriptionDefi,
                d.nbPointsDefi,
                d.nbCO2Defi,
                d.niveauDefi,
                r.Id_thematique,
                t.nomTheme,
                r.ordre,
                to_char(r.mois, \'YYYY-MM\') AS mois,
                COALESCE(ac.nb_actions, 0) AS nb_actions,
                COALESCE(rr.nb_replies_pending, 0) AS nb_replies_pending,
                COALESCE(rr.nb_replies_approved, 0) AS nb_replies_approved,
                COALESCE(rr.nb_replies_rejected, 0) AS nb_replies_rejected
             FROM Defi d
             LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
             LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
             LEFT JOIN LATERAL (
                SELECT COUNT(*) AS nb_actions
                FROM Faire_partie fp
                WHERE fp.Id_defi = d.Id_defi
             ) ac ON TRUE
             LEFT JOIN LATERAL (
                SELECT
                    COALESCE(SUM(CASE WHEN rd.statut_reponse = \'pending\' THEN 1 ELSE 0 END), 0) AS nb_replies_pending,
                    COALESCE(SUM(CASE WHEN rd.statut_reponse = \'approved\' THEN 1 ELSE 0 END), 0) AS nb_replies_approved,
                    COALESCE(SUM(CASE WHEN rd.statut_reponse = \'rejected\' THEN 1 ELSE 0 END), 0) AS nb_replies_rejected
                FROM Reponse_Defi rd
                WHERE rd.Id_defi = d.Id_defi
             ) rr ON TRUE
             WHERE d.Id_Animateur = :animateur_id
             ORDER BY r.mois DESC NULLS LAST, r.ordre ASC NULLS LAST, d.Id_defi DESC'
        );
        $stmt->execute([':animateur_id' => $animateurId]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'GET' && $action === 'challenge_detail') {
        $challengeId = (int)($_GET['id'] ?? 0);
        if ($challengeId <= 0) {
            gp_send_json(400, ['message' => 'Identifiant du defis invalide']);
        }

        $stmt = $pdo->prepare(
            'SELECT
                d.Id_defi,
                d.nomDefi,
                d.descriptionDefi,
                d.nbPointsDefi,
                d.nbCO2Defi,
                d.niveauDefi,
                r.Id_thematique,
                t.nomTheme,
                r.ordre,
                to_char(r.mois, \'YYYY-MM\') AS mois,
                f.Id_forum,
                f.nomForum,
                f.descriptionForum
             FROM Defi d
             LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
             LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
             LEFT JOIN Forum f ON f.Id_defi = d.Id_defi
             WHERE d.Id_defi = :challenge_id AND d.Id_Animateur = :animateur_id
             LIMIT 1'
        );
        $stmt->execute([
            ':challenge_id' => $challengeId,
            ':animateur_id' => $animateurId,
        ]);
        $challenge = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$challenge) {
            gp_send_json(404, ['message' => 'Defis introuvable']);
        }

        $stmt2 = $pdo->prepare(
            'SELECT
                a.Id_actions,
                a.nomAction,
                a.descriptionAction
             FROM Faire_partie fp
             JOIN Actions a ON a.Id_actions = fp.Id_actions
             WHERE fp.Id_defi = :challenge_id
             ORDER BY a.Id_actions ASC'
        );
        $stmt2->execute([':challenge_id' => $challengeId]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => [
                'challenge' => $challenge,
                'actions' => $stmt2->fetchAll(PDO::FETCH_ASSOC),
            ],
        ]);
    }

    if ($method === 'GET' && $action === 'blocked_employees') {
        $defiId = (int)($_GET['defi_id'] ?? 0);
        if ($defiId <= 0) {
            gp_send_json(400, ['message' => 'defi_id requis']);
        }

        $stmt = $pdo->prepare(
            'SELECT 1
             FROM Defi
             WHERE Id_defi = :defi_id AND Id_Animateur = :animateur_id
             LIMIT 1'
        );
        $stmt->execute([':defi_id' => $defiId, ':animateur_id' => $animateurId]);
        if (!$stmt->fetch()) {
            gp_send_json(404, ['message' => 'Defis introuvable']);
        }

        $stmt = $pdo->prepare(
            'SELECT b.Id_Employe, u.prenomUser, u.nomUser, b.motif, b.date_blocage
             FROM Defi_Employe_Block b
             JOIN Utilisateur u ON u.Id_User = b.Id_Employe
             WHERE b.Id_defi = :defi_id
             ORDER BY b.date_blocage DESC'
        );
        $stmt->execute([':defi_id' => $defiId]);

        gp_send_json(200, [
            'status' => 'success',
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'POST' && $action === 'block_employee') {
        $body = gp_read_json_body();
        $defiId = (int)($body['defi_id'] ?? 0);
        $employeId = (int)($body['employe_id'] ?? 0);
        $motif = trim((string)($body['motif'] ?? ''));

        if ($defiId <= 0 || $employeId <= 0) {
            gp_send_json(400, ['message' => 'defi_id et employe_id requis']);
        }

        $stmt = $pdo->prepare(
            'SELECT 1
             FROM Defi
             WHERE Id_defi = :defi_id AND Id_Animateur = :animateur_id
             LIMIT 1'
        );
        $stmt->execute([':defi_id' => $defiId, ':animateur_id' => $animateurId]);
        if (!$stmt->fetch()) {
            gp_send_json(404, ['message' => 'Defis introuvable']);
        }

        $stmt = $pdo->prepare('SELECT 1 FROM Employe WHERE Id_Employe = :emp LIMIT 1');
        $stmt->execute([':emp' => $employeId]);
        if (!$stmt->fetch()) {
            gp_send_json(404, ['message' => 'Employe introuvable']);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO Defi_Employe_Block (Id_defi, Id_Employe, Id_Animateur, motif)
             VALUES (:defi_id, :employe_id, :animateur_id, :motif)
             ON CONFLICT (Id_defi, Id_Employe)
             DO UPDATE SET motif = EXCLUDED.motif,
                           Id_Animateur = EXCLUDED.Id_Animateur,
                           date_blocage = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            ':defi_id' => $defiId,
            ':employe_id' => $employeId,
            ':animateur_id' => $animateurId,
            ':motif' => $motif !== '' ? $motif : null,
        ]);

        gp_send_json(200, ['status' => 'success', 'message' => 'Employe bloque pour ce defi']);
    }

    if ($method === 'POST' && $action === 'unblock_employee') {
        $body = gp_read_json_body();
        $defiId = (int)($body['defi_id'] ?? 0);
        $employeId = (int)($body['employe_id'] ?? 0);

        if ($defiId <= 0 || $employeId <= 0) {
            gp_send_json(400, ['message' => 'defi_id et employe_id requis']);
        }

        $stmt = $pdo->prepare(
            'SELECT 1
             FROM Defi
             WHERE Id_defi = :defi_id AND Id_Animateur = :animateur_id
             LIMIT 1'
        );
        $stmt->execute([':defi_id' => $defiId, ':animateur_id' => $animateurId]);
        if (!$stmt->fetch()) {
            gp_send_json(404, ['message' => 'Defis introuvable']);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM Defi_Employe_Block
             WHERE Id_defi = :defi_id AND Id_Employe = :employe_id'
        );
        $stmt->execute([':defi_id' => $defiId, ':employe_id' => $employeId]);

        gp_send_json(200, ['status' => 'success', 'message' => 'Employe debloque pour ce defi']);
    }

    if ($method === 'POST' && $action === 'challenge_create') {
        $body = gp_read_json_body();
        $payload = gp_validate_challenge_payload($body);

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                'INSERT INTO Defi (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi, Id_Animateur)
                 VALUES (:nomDefi, :descriptionDefi, :nbPointsDefi, :nbCO2Defi, :niveauDefi, :animateur_id)
                 RETURNING Id_defi'
            );
            $stmt->execute([
                ':nomDefi' => $payload['nomDefi'],
                ':descriptionDefi' => $payload['descriptionDefi'],
                ':nbPointsDefi' => $payload['nbPointsDefi'],
                ':nbCO2Defi' => $payload['nbCO2Defi'],
                ':niveauDefi' => $payload['niveauDefi'],
                ':animateur_id' => $animateurId,
            ]);
            $challengeId = (int)($stmt->fetchColumn() ?: 0);

            if ($challengeId <= 0) {
                throw new RuntimeException('Creation du defis impossible');
            }

            $stmt2 = $pdo->prepare(
                'INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre)
                 VALUES (:challenge_id, :thematique_id, :mois, :ordre)'
            );
            $stmt2->execute([
                ':challenge_id' => $challengeId,
                ':thematique_id' => $payload['idThematique'],
                ':mois' => $payload['mois'] . '-01',
                ':ordre' => $payload['ordre'],
            ]);

            $stmt3 = $pdo->prepare(
                'INSERT INTO Forum (nomForum, descriptionForum, Id_defi)
                 VALUES (:nomForum, :descriptionForum, :challenge_id)'
            );
            $stmt3->execute([
                ':nomForum' => $payload['nomForum'],
                ':descriptionForum' => $payload['descriptionForum'],
                ':challenge_id' => $challengeId,
            ]);

            $insertAction = $pdo->prepare(
                'INSERT INTO Actions (nomAction, descriptionAction)
                 VALUES (:nomAction, :descriptionAction)
                 RETURNING Id_actions'
            );
            $linkAction = $pdo->prepare(
                'INSERT INTO Faire_partie (Id_defi, Id_actions)
                 VALUES (:challenge_id, :action_id)'
            );

            foreach ($payload['actions'] as $actionItem) {
                $insertAction->execute([
                    ':nomAction' => $actionItem['nomAction'],
                    ':descriptionAction' => $actionItem['descriptionAction'],
                ]);
                $actionId = (int)($insertAction->fetchColumn() ?: 0);

                if ($actionId <= 0) {
                    throw new RuntimeException('Creation de l\'action impossible');
                }

                $linkAction->execute([
                    ':challenge_id' => $challengeId,
                    ':action_id' => $actionId,
                ]);
            }

            $pdo->commit();

            gp_send_json(201, [
                'status' => 'success',
                'message' => 'Defis cree avec succes',
                'data' => ['id_defi' => $challengeId],
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            gp_send_json(400, ['message' => gp_clean_db_message($e->getMessage())]);
        }
    }

    if ($method === 'POST' && $action === 'challenge_update') {
        $challengeId = (int)($_GET['id'] ?? 0);
        if ($challengeId <= 0) {
            gp_send_json(400, ['message' => 'Identifiant du defis invalide']);
        }

        $body = gp_read_json_body();
        $payload = gp_validate_challenge_payload($body);

        try {
            $pdo->beginTransaction();

            gp_assert_animateur_owns_challenge($pdo, $animateurId, $challengeId);

            $stmt = $pdo->prepare(
                'UPDATE Defi
                 SET nomDefi = :nomDefi,
                     descriptionDefi = :descriptionDefi,
                     nbPointsDefi = :nbPointsDefi,
                     nbCO2Defi = :nbCO2Defi,
                     niveauDefi = :niveauDefi
                 WHERE Id_defi = :challenge_id AND Id_Animateur = :animateur_id'
            );
            $stmt->execute([
                ':nomDefi' => $payload['nomDefi'],
                ':descriptionDefi' => $payload['descriptionDefi'],
                ':nbPointsDefi' => $payload['nbPointsDefi'],
                ':nbCO2Defi' => $payload['nbCO2Defi'],
                ':niveauDefi' => $payload['niveauDefi'],
                ':challenge_id' => $challengeId,
                ':animateur_id' => $animateurId,
            ]);

            $stmt2 = $pdo->prepare(
                'SELECT Id_thematique
                 FROM Regroupe
                 WHERE Id_defi = :challenge_id
                 LIMIT 1'
            );
            $stmt2->execute([':challenge_id' => $challengeId]);
            $currentThematiqueId = (int)($stmt2->fetchColumn() ?: 0);

            if ($currentThematiqueId > 0 && $currentThematiqueId !== $payload['idThematique']) {
                $deleteRegroup = $pdo->prepare(
                    'DELETE FROM Regroupe
                     WHERE Id_defi = :challenge_id AND Id_thematique = :thematique_id'
                );
                $deleteRegroup->execute([
                    ':challenge_id' => $challengeId,
                    ':thematique_id' => $currentThematiqueId,
                ]);

                $insertRegroup = $pdo->prepare(
                    'INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre)
                     VALUES (:challenge_id, :thematique_id, :mois, :ordre)'
                );
                $insertRegroup->execute([
                    ':challenge_id' => $challengeId,
                    ':thematique_id' => $payload['idThematique'],
                    ':mois' => $payload['mois'] . '-01',
                    ':ordre' => $payload['ordre'],
                ]);
            } elseif ($currentThematiqueId > 0) {
                $updateRegroup = $pdo->prepare(
                    'UPDATE Regroupe
                     SET mois = :mois,
                         ordre = :ordre
                     WHERE Id_defi = :challenge_id AND Id_thematique = :thematique_id'
                );
                $updateRegroup->execute([
                    ':mois' => $payload['mois'] . '-01',
                    ':ordre' => $payload['ordre'],
                    ':challenge_id' => $challengeId,
                    ':thematique_id' => $currentThematiqueId,
                ]);
            } else {
                $insertRegroup = $pdo->prepare(
                    'INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre)
                     VALUES (:challenge_id, :thematique_id, :mois, :ordre)'
                );
                $insertRegroup->execute([
                    ':challenge_id' => $challengeId,
                    ':thematique_id' => $payload['idThematique'],
                    ':mois' => $payload['mois'] . '-01',
                    ':ordre' => $payload['ordre'],
                ]);
            }

            $stmt3 = $pdo->prepare(
                'SELECT Id_forum
                 FROM Forum
                 WHERE Id_defi = :challenge_id
                 LIMIT 1'
            );
            $stmt3->execute([':challenge_id' => $challengeId]);
            $forumId = (int)($stmt3->fetchColumn() ?: 0);

            if ($forumId > 0) {
                $updateForum = $pdo->prepare(
                    'UPDATE Forum
                     SET nomForum = :nomForum,
                         descriptionForum = :descriptionForum
                     WHERE Id_forum = :forum_id'
                );
                $updateForum->execute([
                    ':nomForum' => $payload['nomForum'],
                    ':descriptionForum' => $payload['descriptionForum'],
                    ':forum_id' => $forumId,
                ]);
            } else {
                $insertForum = $pdo->prepare(
                    'INSERT INTO Forum (nomForum, descriptionForum, Id_defi)
                     VALUES (:nomForum, :descriptionForum, :challenge_id)'
                );
                $insertForum->execute([
                    ':nomForum' => $payload['nomForum'],
                    ':descriptionForum' => $payload['descriptionForum'],
                    ':challenge_id' => $challengeId,
                ]);
            }

            $stmtDeleteValider = $pdo->prepare(
                'DELETE FROM Valider
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteValider->execute([':challenge_id' => $challengeId]);

            $stmtDeleteLinks = $pdo->prepare(
                'DELETE FROM Faire_partie
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteLinks->execute([':challenge_id' => $challengeId]);

            $insertAction = $pdo->prepare(
                'INSERT INTO Actions (nomAction, descriptionAction)
                 VALUES (:nomAction, :descriptionAction)
                 RETURNING Id_actions'
            );
            $linkAction = $pdo->prepare(
                'INSERT INTO Faire_partie (Id_defi, Id_actions)
                 VALUES (:challenge_id, :action_id)'
            );

            foreach ($payload['actions'] as $actionItem) {
                $insertAction->execute([
                    ':nomAction' => $actionItem['nomAction'],
                    ':descriptionAction' => $actionItem['descriptionAction'],
                ]);
                $actionId = (int)($insertAction->fetchColumn() ?: 0);

                if ($actionId <= 0) {
                    throw new RuntimeException('Creation de l\'action impossible');
                }

                $linkAction->execute([
                    ':challenge_id' => $challengeId,
                    ':action_id' => $actionId,
                ]);
            }

            $pdo->commit();

            gp_send_json(200, [
                'status' => 'success',
                'message' => 'Defis mis a jour avec succes',
                'data' => ['id_defi' => $challengeId],
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            gp_send_json(400, ['message' => gp_clean_db_message($e->getMessage())]);
        }
    }

    if ($method === 'POST' && $action === 'challenge_delete') {
        $challengeId = (int)($_GET['id'] ?? 0);
        if ($challengeId <= 0) {
            gp_send_json(400, ['message' => 'Identifiant du defis invalide']);
        }

        try {
            $pdo->beginTransaction();
            gp_assert_animateur_owns_challenge($pdo, $animateurId, $challengeId);

            $stmtDeleteBlocks = $pdo->prepare(
                'DELETE FROM Defi_Employe_Block
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteBlocks->execute([':challenge_id' => $challengeId]);

            $stmtDeleteReplies = $pdo->prepare(
                'DELETE FROM Reponse_Defi
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteReplies->execute([':challenge_id' => $challengeId]);

            $stmtDeleteMessages = $pdo->prepare(
                'DELETE FROM Message
                 WHERE Id_forum IN (
                    SELECT Id_forum
                    FROM Forum
                    WHERE Id_defi = :challenge_id
                 )'
            );
            $stmtDeleteMessages->execute([':challenge_id' => $challengeId]);

            $stmtDeleteForums = $pdo->prepare(
                'DELETE FROM Forum
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteForums->execute([':challenge_id' => $challengeId]);

            $stmtDeleteValider = $pdo->prepare(
                'DELETE FROM Valider
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteValider->execute([':challenge_id' => $challengeId]);

            $stmtDeleteLinks = $pdo->prepare(
                'DELETE FROM Faire_partie
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteLinks->execute([':challenge_id' => $challengeId]);

            $stmtDeleteRegroupe = $pdo->prepare(
                'DELETE FROM Regroupe
                 WHERE Id_defi = :challenge_id'
            );
            $stmtDeleteRegroupe->execute([':challenge_id' => $challengeId]);

            $stmtDeleteDefi = $pdo->prepare(
                'DELETE FROM Defi
                 WHERE Id_defi = :challenge_id AND Id_Animateur = :animateur_id'
            );
            $stmtDeleteDefi->execute([
                ':challenge_id' => $challengeId,
                ':animateur_id' => $animateurId,
            ]);

            $pdo->commit();

            gp_send_json(200, [
                'status' => 'success',
                'message' => 'Defis supprime avec succes',
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            gp_send_json(400, ['message' => gp_clean_db_message($e->getMessage())]);
        }
    }

    if ($method === 'GET' && $action === 'replies') {
        $status = strtolower(trim((string)($_GET['status'] ?? 'all')));
        $challengeFilter = (int)($_GET['challenge_id'] ?? 0);
        $limit = (int)($_GET['limit'] ?? 0);
        if ($limit <= 0 || $limit > 200) {
            $limit = 80;
        }

        $params = [
            ':animateur_id' => $animateurId,
            ':limit_count' => $limit,
        ];

        $where =
            'WHERE EXISTS (
                SELECT 1
                FROM Utilisateur ua
                JOIN Utilisateur ud ON ud.Id_User = d.Id_Animateur
                WHERE ua.Id_User = :animateur_id
                  AND ua.Id_Entreprise = ud.Id_Entreprise
            )';

        if (in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $where .= ' AND rd.statut_reponse = :status_filter';
            $params[':status_filter'] = $status;
        }

        if ($challengeFilter > 0) {
            $where .= ' AND rd.Id_defi = :challenge_filter';
            $params[':challenge_filter'] = $challengeFilter;
        }

        $sql =
            'SELECT
                rd.Id_reponse,
                rd.Id_defi,
                d.nomDefi,
                rd.Id_actions,
                a.nomAction,
                rd.Id_Employe,
                u.nomUser,
                u.prenomUser,
                rd.reponse_text,
                rd.statut_reponse,
                rd.commentaire_animateur,
                     to_char(rd.date_reponse, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_reponse,
                     to_char(rd.date_traitement, \'YYYY-MM-DD"T"HH24:MI:SS\') AS date_traitement
             FROM Reponse_Defi rd
             JOIN Defi d ON d.Id_defi = rd.Id_defi
             LEFT JOIN Actions a ON a.Id_actions = rd.Id_actions
             JOIN Utilisateur u ON u.Id_User = rd.Id_Employe
             ' . $where . '
             ORDER BY rd.date_reponse DESC
             LIMIT :limit_count';

        $stmt = $pdo->prepare($sql);

        foreach ($params as $key => $value) {
            if ($key === ':limit_count') {
                $stmt->bindValue($key, (int)$value, PDO::PARAM_INT);
                continue;
            }

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

    if ($method === 'POST' && $action === 'reply_decision') {
        $replyId = (int)($_GET['id'] ?? 0);
        if ($replyId <= 0) {
            gp_send_json(400, ['message' => 'Identifiant de la reponse invalide']);
        }

        $body = gp_read_json_body();
        $decision = strtolower(trim((string)($body['decision'] ?? '')));
        $comment = trim((string)($body['commentaire'] ?? ''));

        if (!in_array($decision, ['approve', 'reject'], true)) {
            gp_send_json(400, ['message' => 'Decision invalide']);
        }

        if ($decision === 'reject' && $comment === '') {
            gp_send_json(400, ['message' => 'Un commentaire est obligatoire pour refuser une reponse']);
        }

        $newStatus = $decision === 'approve' ? 'approved' : 'rejected';

        $stmt = $pdo->prepare(
            'UPDATE Reponse_Defi rd
             SET statut_reponse = :new_status,
                 commentaire_animateur = :commentaire,
                 date_traitement = CURRENT_TIMESTAMP,
                 Id_Animateur_traitement = :animateur_id
             FROM Defi d
                         JOIN Utilisateur ua ON ua.Id_User = :animateur_owner_id
                         JOIN Utilisateur ud ON ud.Id_User = d.Id_Animateur
             WHERE rd.Id_reponse = :reply_id
               AND d.Id_defi = rd.Id_defi
                             AND ua.Id_Entreprise = ud.Id_Entreprise
             RETURNING rd.Id_defi, rd.Id_actions, rd.Id_Employe, rd.reponse_text'
        );
        $stmt->execute([
            ':new_status' => $newStatus,
            ':commentaire' => $comment !== '' ? $comment : null,
            ':animateur_id' => $animateurId,
            ':reply_id' => $replyId,
            ':animateur_owner_id' => $animateurId,
        ]);

        $reply = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$reply) {
            gp_send_json(404, ['message' => 'Reponse introuvable']);
        }

        if ($newStatus === 'approved' && !empty($reply['id_actions'])) {
            $stmtInsert = $pdo->prepare(
                'INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, preuve)
                 VALUES (:defi, :action, :employe, :preuve)
                 ON CONFLICT DO NOTHING'
            );
            $stmtInsert->execute([
                ':defi' => (int) $reply['id_defi'],
                ':action' => (int) $reply['id_actions'],
                ':employe' => (int) $reply['id_employe'],
                ':preuve' => $reply['reponse_text'] ?? null,
            ]);
        }

        gp_send_json(200, [
            'status' => 'success',
            'message' => $newStatus === 'approved' ? 'Reponse approuvee' : 'Reponse refusee',
        ]);
    }

    // ─── CATALOGUE : thematiques ───────────────────────────────────────────────

    if ($method === 'GET' && $action === 'catalogue_themes') {
        $stmt = $pdo->query(
            'SELECT t.Id_thematique, t.nomTheme, t.descriptionTheme,
                    COUNT(a.Id_defi) AS nb_defis
             FROM Thematique t
             LEFT JOIN Appartenir a ON a.Id_thematique = t.Id_thematique
             GROUP BY t.Id_thematique, t.nomTheme, t.descriptionTheme
             ORDER BY t.nomTheme ASC'
        );
        gp_send_json(200, ['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'POST' && $action === 'catalogue_theme_create') {
        $body = gp_read_json_body();
        $nomTheme = trim((string)($body['nomTheme'] ?? ''));
        $descriptionTheme = trim((string)($body['descriptionTheme'] ?? ''));
        if ($nomTheme === '') {
            gp_send_json(400, ['message' => 'Le nom de la thematique est obligatoire']);
        }
        $stmt = $pdo->prepare(
            'INSERT INTO Thematique (nomTheme, descriptionTheme) VALUES (:nom, :desc) RETURNING Id_thematique'
        );
        $stmt->execute([':nom' => substr($nomTheme, 0, 100), ':desc' => $descriptionTheme !== '' ? $descriptionTheme : null]);
        $id = (int)$stmt->fetchColumn();
        gp_send_json(201, ['status' => 'success', 'data' => ['id_thematique' => $id, 'nomTheme' => $nomTheme]]);
    }

    // ─── CATALOGUE : défis ─────────────────────────────────────────────────────

    if ($method === 'GET' && $action === 'catalogue_defis_by_theme') {
        $themeId = (int)($_GET['theme_id'] ?? 0);
        if ($themeId <= 0) {
            gp_send_json(400, ['message' => 'theme_id requis']);
        }
        $stmt = $pdo->prepare(
            'SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
                    EXISTS(SELECT 1 FROM Regroupe r WHERE r.Id_defi = d.Id_defi AND r.Id_thematique = :theme_id) AS is_scheduled
             FROM Defi d
             JOIN Appartenir a ON a.Id_defi = d.Id_defi
             WHERE a.Id_thematique = :theme_id2
             ORDER BY d.nomDefi ASC'
        );
        $stmt->execute([':theme_id' => $themeId, ':theme_id2' => $themeId]);
        gp_send_json(200, ['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($method === 'POST' && $action === 'catalogue_defi_create') {
        $body = gp_read_json_body();
        $nomDefi = trim((string)($body['nomDefi'] ?? ''));
        $descriptionDefi = trim((string)($body['descriptionDefi'] ?? ''));
        $nbPointsDefi = (int)($body['nbPointsDefi'] ?? 0);
        $nbCO2Defi = (int)($body['nbCO2Defi'] ?? 0);
        $niveauDefi = (int)($body['niveauDefi'] ?? 0);
        $themeIds = array_values(array_unique(array_filter(array_map('intval', (array)($body['themeIds'] ?? [])))));
        $actions = is_array($body['actions'] ?? null) ? $body['actions'] : [];

        if ($nomDefi === '') gp_send_json(400, ['message' => 'Le nom du defi est obligatoire']);
        if ($nbPointsDefi <= 0 || $niveauDefi <= 0) gp_send_json(400, ['message' => 'Points et niveau doivent etre positifs']);
        if ($nbCO2Defi < 0) gp_send_json(400, ['message' => 'CO2 ne peut pas etre negatif']);
        if (empty($themeIds)) gp_send_json(400, ['message' => 'Selectionnez au moins une thematique']);

        $normalizedActions = [];
        foreach ($actions as $item) {
            $nom = trim((string)($item['nomAction'] ?? ''));
            if ($nom !== '') {
                $normalizedActions[] = ['nomAction' => $nom, 'descriptionAction' => trim((string)($item['descriptionAction'] ?? '')) ?: null];
            }
        }
        if (empty($normalizedActions)) gp_send_json(400, ['message' => 'Ajoutez au moins une action']);

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                'INSERT INTO Defi (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi, Id_Animateur)
                 VALUES (:nom, :desc, :pts, :co2, :niveau, :anim) RETURNING Id_defi'
            );
            $stmt->execute([':nom' => substr($nomDefi, 0, 150), ':desc' => $descriptionDefi ?: null, ':pts' => $nbPointsDefi, ':co2' => $nbCO2Defi, ':niveau' => $niveauDefi, ':anim' => $animateurId]);
            $defiId = (int)$stmt->fetchColumn();
            if ($defiId <= 0) throw new RuntimeException('Creation impossible');

            $pdo->prepare('INSERT INTO Forum (nomForum, descriptionForum, Id_defi) VALUES (:nom, :desc, :id)')
                ->execute([':nom' => 'Forum - ' . substr($nomDefi, 0, 140), ':desc' => null, ':id' => $defiId]);

            $stmtApp = $pdo->prepare('INSERT INTO Appartenir (Id_defi, Id_thematique) VALUES (:defi, :theme)');
            foreach ($themeIds as $tid) {
                $stmtApp->execute([':defi' => $defiId, ':theme' => $tid]);
            }

            $insertAction = $pdo->prepare('INSERT INTO Actions (nomAction, descriptionAction) VALUES (:nom, :desc) RETURNING Id_actions');
            $linkAction = $pdo->prepare('INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES (:defi, :action)');
            foreach ($normalizedActions as $a) {
                $insertAction->execute([':nom' => $a['nomAction'], ':desc' => $a['descriptionAction']]);
                $actionId = (int)$insertAction->fetchColumn();
                $linkAction->execute([':defi' => $defiId, ':action' => $actionId]);
            }

            $pdo->commit();
            gp_send_json(201, ['status' => 'success', 'message' => 'Defi cree dans le catalogue', 'data' => ['id_defi' => $defiId]]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            gp_send_json(400, ['message' => gp_clean_db_message($e->getMessage())]);
        }
    }

    if ($method === 'GET' && $action === 'catalogue_defis_available') {
        $themeId = (int)($_GET['theme_id'] ?? 0);
        if ($themeId <= 0) gp_send_json(400, ['message' => 'theme_id requis']);

        $stmt = $pdo->prepare(
            'SELECT d.Id_defi, d.nomDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi
             FROM Defi d
             JOIN Appartenir a ON a.Id_defi = d.Id_defi
             WHERE a.Id_thematique = :theme_id
               AND d.Id_defi NOT IN (
                   SELECT r.Id_defi FROM Regroupe r WHERE r.Id_thematique = :theme_id2
               )
             ORDER BY d.nomDefi ASC'
        );
        $stmt->execute([':theme_id' => $themeId, ':theme_id2' => $themeId]);
        gp_send_json(200, ['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    // ─── PLANNING MENSUEL ──────────────────────────────────────────────────────

    if ($method === 'POST' && $action === 'defis_month_save') {
        $body = gp_read_json_body();
        $themeId = (int)($body['thematique_id'] ?? 0);
        $defiIds = array_values(array_unique(array_filter(array_map('intval', (array)($body['defi_ids'] ?? [])))));
        $moisInput = trim((string)($body['mois'] ?? ''));

        if ($themeId <= 0) gp_send_json(400, ['message' => 'thematique_id requis']);
        if (empty($defiIds)) gp_send_json(400, ['message' => 'Selectionnez au moins un defi']);
        if (!preg_match('/^\d{4}-\d{2}$/', $moisInput)) gp_send_json(400, ['message' => 'mois doit etre au format YYYY-MM']);

        $moisDate = $moisInput . '-01';
        $placeholders = implode(',', array_fill(0, count($defiIds), '?'));
        $check = $pdo->prepare("SELECT COUNT(*) FROM Appartenir WHERE Id_thematique = ? AND Id_defi IN ($placeholders)");
        $check->execute(array_merge([$themeId], $defiIds));
        if ((int)$check->fetchColumn() !== count($defiIds)) {
            gp_send_json(400, ['message' => 'Certains defis n\'appartiennent pas a cette thematique']);
        }

        try {
            $pdo->beginTransaction();
            $pdo->prepare(
                'DELETE FROM Regroupe WHERE Id_thematique = :theme AND date_trunc(\'month\', mois) = date_trunc(\'month\', :mois::date)'
            )->execute([':theme' => $themeId, ':mois' => $moisDate]);

            $insert = $pdo->prepare('INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (:defi, :theme, :mois, :ordre)');
            foreach ($defiIds as $i => $defiId) {
                $insert->execute([':defi' => $defiId, ':theme' => $themeId, ':mois' => $moisDate, ':ordre' => $i + 1]);
            }
            $pdo->commit();
            gp_send_json(200, ['status' => 'success', 'message' => 'Defis du mois sauvegardes']);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            gp_send_json(400, ['message' => gp_clean_db_message($e->getMessage())]);
        }
    }

    gp_send_json(404, ['message' => 'Action inconnue']);
} catch (Throwable $e) {
    $message = !empty($config['debug'])
        ? ($e->getMessage() ?: 'Erreur serveur')
        : 'Erreur serveur';

    gp_send_json(500, ['message' => $message]);
}

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

function gp_assert_animateur_exists(PDO $pdo, int $animateurId): void
{
    $stmt = $pdo->prepare(
        'SELECT 1
         FROM Animateur
         WHERE Id_Animateur = :animateur_id
         LIMIT 1'
    );
    $stmt->execute([':animateur_id' => $animateurId]);

    if (!$stmt->fetch()) {
        gp_send_json(403, ['message' => 'Compte animateur introuvable']);
    }
}

function gp_assert_animateur_owns_challenge(PDO $pdo, int $animateurId, int $challengeId): void
{
    $stmt = $pdo->prepare(
        'SELECT 1
         FROM Defi
         WHERE Id_defi = :challenge_id AND Id_Animateur = :animateur_id
         LIMIT 1'
    );
    $stmt->execute([
        ':challenge_id' => $challengeId,
        ':animateur_id' => $animateurId,
    ]);

    if (!$stmt->fetch()) {
        gp_send_json(404, ['message' => 'Defis introuvable']);
    }
}

function gp_validate_challenge_payload(array $body): array
{
    $nomDefi = trim((string)($body['nomDefi'] ?? ''));
    $descriptionDefi = trim((string)($body['descriptionDefi'] ?? ''));
    $nbPointsDefi = (int)($body['nbPointsDefi'] ?? 0);
    $nbCO2Defi = (int)($body['nbCO2Defi'] ?? 0);
    $niveauDefi = (int)($body['niveauDefi'] ?? 0);
    $idThematique = (int)($body['idThematique'] ?? 0);
    $ordre = (int)($body['ordre'] ?? 0);
    $mois = trim((string)($body['mois'] ?? ''));
    $nomForum = trim((string)($body['nomForum'] ?? ''));
    $descriptionForum = trim((string)($body['descriptionForum'] ?? ''));
    $actions = $body['actions'] ?? [];

    if ($nomDefi === '') {
        gp_send_json(400, ['message' => 'Le nom du defis est obligatoire']);
    }
    if ($nbPointsDefi <= 0 || $niveauDefi <= 0 || $idThematique <= 0 || $ordre <= 0) {
        gp_send_json(400, ['message' => 'Points, niveau, thematique et ordre doivent etre strictement positifs']);
    }
    if ($nbCO2Defi < 0) {
        gp_send_json(400, ['message' => 'Le CO2 evite doit etre positif ou nul']);
    }
    if (!preg_match('/^\d{4}-\d{2}$/', $mois)) {
        gp_send_json(400, ['message' => 'Le mois doit etre au format YYYY-MM']);
    }
    if (!is_array($actions) || count($actions) === 0) {
        gp_send_json(400, ['message' => 'Ajoutez au moins une action']);
    }

    $normalizedActions = [];
    foreach ($actions as $item) {
        if (!is_array($item)) {
            continue;
        }

        $nomAction = trim((string)($item['nomAction'] ?? ''));
        $descriptionAction = trim((string)($item['descriptionAction'] ?? ''));

        if ($nomAction === '') {
            continue;
        }

        $normalizedActions[] = [
            'nomAction' => $nomAction,
            'descriptionAction' => $descriptionAction !== '' ? $descriptionAction : null,
        ];
    }

    if (count($normalizedActions) === 0) {
        gp_send_json(400, ['message' => 'Chaque defis doit contenir au moins une action nommee']);
    }

    if ($nomForum === '') {
        $nomForum = 'Forum - ' . $nomDefi;
    }

    return [
        'nomDefi' => $nomDefi,
        'descriptionDefi' => $descriptionDefi !== '' ? $descriptionDefi : null,
        'nbPointsDefi' => $nbPointsDefi,
        'nbCO2Defi' => $nbCO2Defi,
        'niveauDefi' => $niveauDefi,
        'idThematique' => $idThematique,
        'ordre' => $ordre,
        'mois' => $mois,
        'nomForum' => $nomForum,
        'descriptionForum' => $descriptionForum !== '' ? $descriptionForum : null,
        'actions' => $normalizedActions,
    ];
}

function gp_clean_db_message(string $message): string
{
    $trimmed = trim($message);
    if ($trimmed === '') {
        return 'Operation impossible';
    }

    if (strlen($trimmed) > 240) {
        return substr($trimmed, 0, 240) . '...';
    }

    return $trimmed;
}

