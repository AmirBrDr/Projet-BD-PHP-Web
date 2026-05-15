<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

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

$pdo    = gp_pdo($config);
$userId = (int) $claims['sub'];

// Recuperer l'equipe de l'employe pour surlignage cote frontend
$stmt = $pdo->prepare("
    SELECT eq.Id_equipe AS equipe_id
    FROM Equipe eq
    JOIN Employe emp ON emp.Id_equipe = eq.Id_equipe
    WHERE emp.Id_Employe = :id
    LIMIT 1
");
$stmt->execute([':id' => $userId]);
$myTeamRow = $stmt->fetch();
$myTeamId  = $myTeamRow ? (int) $myTeamRow['equipe_id'] : 0;

// Classement global des equipes par points
$stmt = $pdo->query("
    SELECT eq.Id_equipe AS equipe_id,
           eq.nomEquipe,
           eq.nbPointsEquipe,
           eq.nbCO2Equipe,
           COUNT(emp.Id_Employe) AS membres,
           RANK() OVER (ORDER BY eq.nbPointsEquipe DESC) AS rang
    FROM Equipe eq
    LEFT JOIN Employe emp ON emp.Id_equipe = eq.Id_equipe
    GROUP BY eq.Id_equipe, eq.nomEquipe, eq.nbPointsEquipe, eq.nbCO2Equipe
    ORDER BY eq.nbPointsEquipe DESC
");
$rows = $stmt->fetchAll();

$classement = array_map(fn($r) => [
    'id'      => (int) $r['equipe_id'],
    'nom'     => $r['nomequipe'],
    'points'  => (int) $r['nbpointsequipe'],
    'co2'     => (int) $r['nbco2equipe'],
    'membres' => (int) $r['membres'],
    'rang'    => (int) $r['rang'],
], $rows);

gp_send_json(200, [
    'mon_equipe_id' => $myTeamId,
    'classement'    => $classement,
]);
