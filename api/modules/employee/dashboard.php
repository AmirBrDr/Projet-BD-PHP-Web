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

$pdo    = gp_pdo($config);
$userId = (int) $claims['sub'];

// Points, CO2 de l'employé
$stmt = $pdo->prepare("
    SELECT nbPointsEmploye, nbCO2 FROM Employe WHERE Id_Employe = :id
");
$stmt->execute([':id' => $userId]);
$empRow = $stmt->fetch();

// Nombre de badges
$stmt = $pdo->prepare("
    SELECT COUNT(*) AS nb FROM Obtenir_Em WHERE Id_Employe = :id
");
$stmt->execute([':id' => $userId]);
$badgeRow = $stmt->fetch();

// Équipe + rang
$stmt = $pdo->prepare("
    SELECT eq.nomEquipe, eq.Id_equipe AS equipe_id
    FROM Equipe eq
    JOIN Employe emp ON emp.Id_equipe = eq.Id_equipe
    WHERE emp.Id_Employe = :id
    LIMIT 1
");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();

$teamRang = 0;
if ($teamRow) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) + 1 AS rang
        FROM Equipe
        WHERE nbPointsEquipe > (
            SELECT eq2.nbPointsEquipe FROM Equipe eq2
            JOIN Employe emp2 ON emp2.Id_equipe = eq2.Id_equipe
            WHERE emp2.Id_Employe = :id
            LIMIT 1
        )
    ");
    $stmt->execute([':id' => $userId]);
    $rangRow = $stmt->fetch();
    $teamRang = $rangRow ? (int) $rangRow['rang'] : 1;
}

// Défis du mois actif
$stmt = $pdo->prepare("
    SELECT d.Id_defi, d.nomDefi, d.nbPointsDefi,
           EXISTS(
               SELECT 1 FROM Valider v WHERE v.Id_defi = d.Id_defi AND v.Id_Employe = :id
           ) AS fait
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    ORDER BY r.ordre
    LIMIT 4
");
$stmt->execute([':id' => $userId]);
$defis = $stmt->fetchAll();

// Notifications récentes
$stmt = $pdo->prepare("
    SELECT n.nomNotif, n.dateNotif, n.lienRedirection
    FROM Notification n
    JOIN Recevoir rc ON rc.id_notif = n.id_notif
    WHERE rc.Id_User = :id
    ORDER BY n.dateNotif DESC
    LIMIT 5
");
$stmt->execute([':id' => $userId]);
$notifs = $stmt->fetchAll();

// CO2 par mois (6 derniers mois)
$stmt = $pdo->prepare("
    SELECT TO_CHAR(date_trunc('month', v.date_validation), 'Mon') AS mois,
           SUM(d.nbCO2Defi) AS co2
    FROM Valider v
    JOIN Defi d ON d.Id_defi = v.Id_defi
    WHERE v.Id_Employe = :id
      AND v.date_validation >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY date_trunc('month', v.date_validation)
    ORDER BY date_trunc('month', v.date_validation)
");
$stmt->execute([':id' => $userId]);
$co2Mensuel = $stmt->fetchAll();

gp_send_json(200, [
    'stats' => [
        'points' => $empRow ? (int) $empRow['nbpointsemploye'] : 0,
        'co2'    => $empRow ? (int) $empRow['nbco2'] : 0,
        'badges' => $badgeRow ? (int) $badgeRow['nb'] : 0,
    ],
    'team' => $teamRow ? [
        'id'   => (int) $teamRow['equipe_id'],
        'nom'  => $teamRow['nomequipe'],
        'rang' => $teamRang,
    ] : null,
    'challenges' => array_map(fn($d) => [
        'id'     => (int) $d['id_defi'],
        'nom'    => $d['nomdefi'],
        'points' => (int) $d['nbpointsdefi'],
        'fait'   => (bool) $d['fait'],
    ], $defis),
    'notifications' => array_map(fn($n) => [
        'titre' => $n['nomnotif'],
        'date'  => $n['datenotif'],
        'lien'  => $n['lienredirection'],
    ], $notifs),
    'co2_mensuel' => array_map(fn($r) => [
        'mois' => $r['mois'],
        'co2'  => (int) $r['co2'],
    ], $co2Mensuel),
]);
