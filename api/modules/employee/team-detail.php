<?php

declare(strict_types=1);

require_once __DIR__ . '/../../../bootstrap.php';

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

$teamId = (int) ($_GET['id'] ?? 0);
if ($teamId <= 0) {
    gp_send_json(400, ['message' => 'Paramètre id manquant']);
}

$pdo = gp_pdo($config);

$stmt = $pdo->prepare("
    SELECT Id_equipe AS equipe_id, nomEquipe, nbPointsEquipe, nbCO2Equipe
    FROM Equipe
    WHERE Id_equipe = :id
");
$stmt->execute([':id' => $teamId]);
$team = $stmt->fetch();

if (!$team) {
    gp_send_json(404, ['message' => 'Équipe introuvable']);
}

$stmt2 = $pdo->prepare("
    SELECT COUNT(*) + 1 AS rang
    FROM Equipe
    WHERE nbPointsEquipe > (SELECT nbPointsEquipe FROM Equipe WHERE Id_equipe = :id)
");
$stmt2->execute([':id' => $teamId]);
$rankRow = $stmt2->fetch();
$rang = $rankRow ? (int) $rankRow['rang'] : 1;

$stmt = $pdo->prepare("
    SELECT u.prenomUser, u.nomUser, emp.departementEmploye AS departement,
           emp.nbPointsEmploye, emp.nbCO2
    FROM Employe emp
    JOIN Utilisateur u ON u.Id_User = emp.Id_Employe
    WHERE emp.Id_equipe = :id
    ORDER BY emp.nbPointsEmploye DESC
");
$stmt->execute([':id' => $teamId]);
$membres = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT d.nomDefi, v.date_validation, u.prenomUser, d.nbPointsDefi
    FROM Valider v
    JOIN Defi d ON d.Id_defi = v.Id_defi
    JOIN Utilisateur u ON u.Id_User = v.Id_Employe
    JOIN Employe emp ON emp.Id_Employe = v.Id_Employe
    WHERE emp.Id_equipe = :id
    ORDER BY v.date_validation DESC
    LIMIT 8
");
$stmt->execute([':id' => $teamId]);
$succes = $stmt->fetchAll();

gp_send_json(200, [
    'equipe' => [
        'id'     => (int) $team['equipe_id'],
        'nom'    => $team['nomequipe'],
        'points' => (int) $team['nbpointsequipe'],
        'co2'    => (int) $team['nbco2equipe'],
        'rang'   => $rang,
    ],
    'membres' => array_map(fn($m) => [
        'prenom'      => $m['prenomuser'],
        'nom'         => $m['nomuser'],
        'departement' => $m['departement'],
        'points'      => (int) $m['nbpointsemploye'],
        'co2'         => (int) $m['nbco2'],
    ], $membres),
    'succes' => array_map(fn($s) => [
        'defi'   => $s['nomdefi'],
        'date'   => $s['date_validation'],
        'prenom' => $s['prenomuser'],
        'points' => (int) $s['nbpointsdefi'],
    ], $succes),
]);
