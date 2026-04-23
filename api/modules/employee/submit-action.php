<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $claims = gp_jwt_verify($token, $config['jwt']);
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

if (gp_normalize_role($claims['role'] ?? '') !== 'employe') {
    gp_send_json(403, ['message' => 'Accès refusé']);
}

$body = gp_read_json_body();
$defiId = (int) ($body['defi_id'] ?? 0);
$actionId = (int) ($body['action_id'] ?? 0);
$preuve = trim((string) ($body['preuve'] ?? ''));

if ($defiId <= 0 || $actionId <= 0) {
    gp_send_json(400, ['message' => 'defi_id et action_id requis']);
}
if ($preuve === '') {
    gp_send_json(400, ['message' => 'Une preuve est requise']);
}

$pdo = gp_pdo($config);
$userId = (int) $claims['sub'];

$stmt = $pdo->prepare("\n    SELECT emp.Id_equipe AS equipe_id\n    FROM Employe emp\n    WHERE emp.Id_Employe = :id\n    LIMIT 1\n");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();
$teamId = $teamRow ? (int) $teamRow['equipe_id'] : 0;

$stmt = $pdo->prepare("\n    SELECT 1\n    FROM Faire_partie\n    WHERE Id_defi = :defi AND Id_actions = :action\n");
$stmt->execute([':defi' => $defiId, ':action' => $actionId]);
if (!$stmt->fetch()) {
    gp_send_json(400, ['message' => 'Cette action n\'appartient pas à ce défi']);
}

$stmt = $pdo->prepare("\n    SELECT r.ordre, r.Id_thematique\n    FROM Regroupe r\n    WHERE r.Id_defi = :defi\n    LIMIT 1\n");
$stmt->execute([':defi' => $defiId]);
$challengeRow = $stmt->fetch();
if (!$challengeRow) {
    gp_send_json(404, ['message' => 'Défi introuvable']);
}

if ($teamId > 0) {
    $stmt = $pdo->prepare("\n        SELECT COUNT(*) AS nb\n        FROM Employe e\n        JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n        WHERE e.Id_equipe = :team\n          AND u.statutUser = 'actif'\n    ");
    $stmt->execute([':team' => $teamId]);
    $memberCountRow = $stmt->fetch();
    $memberCount = max(1, (int) ($memberCountRow['nb'] ?? 0));

    $ordre = (int) $challengeRow['ordre'];
    if ($ordre > 1) {
        $stmt = $pdo->prepare("\n            SELECT r2.Id_defi\n            FROM Regroupe r2\n            WHERE r2.Id_thematique = :theme\n              AND r2.ordre = :ordre\n            LIMIT 1\n        ");
        $stmt->execute([
            ':theme' => (int) $challengeRow['id_thematique'],
            ':ordre' => $ordre - 1,
        ]);
        $previousRow = $stmt->fetch();

        if ($previousRow) {
            $stmt = $pdo->prepare("\n                SELECT COUNT(DISTINCT v.Id_Employe) AS nb_valides\n                FROM Valider v\n                JOIN Employe e ON e.Id_Employe = v.Id_Employe\n                JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n                WHERE e.Id_equipe = :team\n                  AND u.statutUser = 'actif'\n                  AND v.Id_defi = :defi\n            ");
            $stmt->execute([
                ':team' => $teamId,
                ':defi' => (int) $previousRow['id_defi'],
            ]);
            $validatedRow = $stmt->fetch();
            $validatedCount = (int) ($validatedRow['nb_valides'] ?? 0);

            if ($validatedCount < $memberCount) {
                gp_send_json(422, ['message' => 'Votre équipe doit valider le défi précédent avant celui-ci']);
            }
        }
    }
}

$stmt = $pdo->prepare("\n    SELECT 1\n    FROM Valider\n    WHERE Id_defi = :defi AND Id_actions = :action AND Id_Employe = :emp\n");
$stmt->execute([':defi' => $defiId, ':action' => $actionId, ':emp' => $userId]);
if ($stmt->fetch()) {
    gp_send_json(409, ['message' => 'Vous avez déjà validé cette action']);
}

try {
    $stmt = $pdo->prepare("\n        INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, preuve)\n        VALUES (:defi, :action, :emp, :preuve)\n    ");
    $stmt->execute([
        ':defi' => $defiId,
        ':action' => $actionId,
        ':emp' => $userId,
        ':preuve' => $preuve,
    ]);
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if (str_contains($msg, 'ordre')) {
        gp_send_json(422, ['message' => 'Vous devez valider le défi précédent avant celui-ci']);
    }
    gp_send_json(500, ['message' => 'Erreur lors de la validation']);
}

gp_send_json(201, ['message' => 'Action validée avec succès']);