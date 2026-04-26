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

$teamId = (int) ($_GET['id'] ?? 0);
if ($teamId <= 0) {
    gp_send_json(400, ['message' => 'Paramètre id manquant']);
}

$pdo = gp_pdo($config);

// Team info
$stmt = $pdo->prepare("
    SELECT Id_equipe AS equipe_id, nomEquipe, nbPointsEquipe, nbCO2Equipe
    FROM Equipe WHERE Id_equipe = :id
");
$stmt->execute([':id' => $teamId]);
$team = $stmt->fetch();

if (!$team) {
    gp_send_json(404, ['message' => 'Équipe introuvable']);
}

// Team rank
$stmt = $pdo->prepare("
    SELECT COUNT(*) + 1 AS rang FROM Equipe
    WHERE nbPointsEquipe > (SELECT nbPointsEquipe FROM Equipe WHERE Id_equipe = :id)
");
$stmt->execute([':id' => $teamId]);
$rankRow = $stmt->fetch();
$rang    = $rankRow ? (int) $rankRow['rang'] : 1;

// Active members
$stmt = $pdo->prepare("
    SELECT e.Id_Employe, u.prenomUser, u.nomUser, e.departementEmploye AS departement,
           e.nbPointsEmploye, e.nbCO2
    FROM Employe e
    JOIN Utilisateur u ON u.Id_User = e.Id_Employe
    WHERE e.Id_equipe = :id
    ORDER BY e.nbPointsEmploye DESC
");
$stmt->execute([':id' => $teamId]);
$membresRows = $stmt->fetchAll();

$memberCount  = max(1, count($membresRows));
$memberNames  = [];
foreach ($membresRows as $m) {
    $memberNames[(int) $m['id_employe']] = $m['prenomuser'] . ' ' . substr($m['nomuser'], 0, 1) . '.';
}

// Recent successes
$stmt = $pdo->prepare("
    SELECT d.nomDefi, v.date_validation, u.prenomUser, d.nbPointsDefi
    FROM Valider v
    JOIN Defi d ON d.Id_defi = v.Id_defi
    JOIN Utilisateur u ON u.Id_User = v.Id_Employe
    JOIN Employe e ON e.Id_Employe = v.Id_Employe
    WHERE e.Id_equipe = :id
    ORDER BY v.date_validation DESC
    LIMIT 8
");
$stmt->execute([':id' => $teamId]);
$succes = $stmt->fetchAll();

// Current month's defis + team progression
$stmt = $pdo->query("
    SELECT DISTINCT t.Id_thematique
    FROM Thematique t
    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique
    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    LIMIT 1
");
$themeRow = $stmt->fetch();
$progression = [];

if ($themeRow) {
    $themeId = (int) $themeRow['id_thematique'];

    // Validations by defi for this team
    $stmt = $pdo->prepare("
        SELECT DISTINCT v.Id_defi, v.Id_Employe
        FROM Valider v
        JOIN Employe e ON e.Id_Employe = v.Id_Employe
        WHERE e.Id_equipe = :team
    ");
    $stmt->execute([':team' => $teamId]);
    $valMap   = [];
    $valNames = [];
    foreach ($stmt->fetchAll() as $row) {
        $did = (int) $row['id_defi'];
        $eid = (int) $row['id_employe'];
        if (!isset($valMap[$did])) $valMap[$did] = 0;
        $valMap[$did]++;
        $valNames[$did][] = $memberNames[$eid] ?? 'Membre';
    }

    $stmt = $pdo->prepare("
        SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, r.ordre
        FROM Defi d
        JOIN Regroupe r ON r.Id_defi = d.Id_defi
        WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
          AND r.Id_thematique = :theme_id
        ORDER BY r.ordre
    ");
    $stmt->execute([':theme_id' => $themeId]);
    $defiRows = $stmt->fetchAll();

    $unlocked = true;
    foreach ($defiRows as $row) {
        $did       = (int) $row['id_defi'];
        $valCount  = $valMap[$did] ?? 0;
        $completed = $valCount >= $memberCount;

        if ($completed) {
            $statut   = 'completed';
            $unlocked = true;
        } elseif ($unlocked) {
            $statut   = 'active';
            $unlocked = false;
        } else {
            $statut = 'locked';
        }

        $vn = $valNames[$did] ?? [];
        $pn = array_values(array_filter(
            array_map(fn($name) => in_array($name, $vn, true) ? null : $name, $memberNames),
            fn($v) => $v !== null
        ));

        $progression[] = [
            'id'          => $did,
            'nom'         => $row['nomdefi'],
            'description' => $row['descriptiondefi'],
            'points'      => (int) $row['nbpointsdefi'],
            'ordre'       => (int) $row['ordre'],
            'statut'      => $statut,
            'progress'    => [
                'validated_members' => $valCount,
                'total_members'     => $memberCount,
                'validated_names'   => $vn,
                'pending_names'     => $pn,
            ],
        ];
    }
}

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
    ], $membresRows),
    'succes' => array_map(fn($s) => [
        'defi'   => $s['nomdefi'],
        'date'   => $s['date_validation'],
        'prenom' => $s['prenomuser'],
        'points' => (int) $s['nbpointsdefi'],
    ], $succes),
    'progression' => $progression,
]);
