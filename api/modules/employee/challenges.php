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

$stmt = $pdo->prepare("
    SELECT emp.Id_equipe AS equipe_id, eq.nomEquipe
    FROM Employe emp
    LEFT JOIN Equipe eq ON eq.Id_equipe = emp.Id_equipe
    WHERE emp.Id_Employe = :id
    LIMIT 1
");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();
$teamId  = $teamRow ? (int) $teamRow['equipe_id'] : 0;

$memberCount    = 1;
$validationMap  = [];   // defi_id -> count of team members who validated
$validatedNames = [];   // defi_id -> ['Prénom N.', ...]
$allMemberNames = [];   // 'Employe Id' -> 'Prénom N.'

if ($teamId > 0) {
    // Count active team members
    $stmt = $pdo->prepare("
        SELECT e.Id_Employe, u.prenomUser, u.nomUser
        FROM Employe e
        JOIN Utilisateur u ON u.Id_User = e.Id_Employe
        WHERE e.Id_equipe = :team AND u.statutUser = 'actif'
    ");
    $stmt->execute([':team' => $teamId]);
    $memberRows = $stmt->fetchAll();
    $memberCount = max(1, count($memberRows));
    foreach ($memberRows as $m) {
        $allMemberNames[(int) $m['id_employe']] = $m['prenomuser'] . ' ' . substr($m['nomuser'], 0, 1) . '.';
    }

    // Who validated which defi (at least one action)
    $stmt = $pdo->prepare("
        SELECT DISTINCT v.Id_defi, v.Id_Employe
        FROM Valider v
        JOIN Employe e ON e.Id_Employe = v.Id_Employe
        WHERE e.Id_equipe = :team
    ");
    $stmt->execute([':team' => $teamId]);
    foreach ($stmt->fetchAll() as $row) {
        $did = (int) $row['id_defi'];
        $eid = (int) $row['id_employe'];
        if (!isset($validationMap[$did])) $validationMap[$did] = 0;
        $validationMap[$did]++;
        $validatedNames[$did][] = $allMemberNames[$eid] ?? 'Membre';
    }
} else {
    // Solo (no team) — count self
    $stmt = $pdo->prepare("
        SELECT DISTINCT v.Id_defi FROM Valider v WHERE v.Id_Employe = :user
    ");
    $stmt->execute([':user' => $userId]);
    foreach ($stmt->fetchAll() as $row) {
        $validationMap[(int) $row['id_defi']] = 1;
    }
}

// Current month theme
$stmt = $pdo->query("
    SELECT DISTINCT t.Id_thematique, t.nomTheme, t.descriptionTheme
    FROM Thematique t
    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique
    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    ORDER BY t.nomTheme
    LIMIT 1
");
$theme = $stmt->fetch();

if (!$theme) {
    gp_send_json(200, [
        'theme'    => null,
        'team'     => $teamRow ? ['id' => $teamId, 'nom' => $teamRow['nomequipe'], 'membres' => $memberCount] : null,
        'progress' => ['completed' => 0, 'total' => 0],
        'defis'    => [],
    ]);
}

$themeId = (int) $theme['id_thematique'];

$stmt = $pdo->prepare("
    SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
           r.ordre, r.Id_thematique, t.nomTheme
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
      AND r.Id_thematique = :theme_id
    ORDER BY r.ordre
");
$stmt->execute([':theme_id' => $themeId]);
$rows = $stmt->fetchAll();

$unlocked      = true;
$completedCount = 0;
$defis         = [];

foreach ($rows as $row) {
    $defiId           = (int) $row['id_defi'];
    $validatedMembers = $validationMap[$defiId] ?? 0;
    $completed        = $validatedMembers >= $memberCount;

    if ($completed) {
        $statut = 'completed';
        $completedCount++;
        $unlocked = true;
    } elseif ($unlocked) {
        $statut   = 'active';
        $unlocked = false;
    } else {
        $statut = 'locked';
    }

    $valNames = $validatedNames[$defiId] ?? [];
    $pendNames = array_values(array_filter(
        array_map(fn($name) => in_array($name, $valNames, true) ? null : $name, $allMemberNames),
        fn($v) => $v !== null
    ));

    $defis[] = [
        'id'          => $defiId,
        'nom'         => $row['nomdefi'],
        'description' => $row['descriptiondefi'],
        'points'      => (int) $row['nbpointsdefi'],
        'co2'         => (int) $row['nbco2defi'],
        'niveau'      => (int) $row['niveaudefi'],
        'ordre'       => (int) $row['ordre'],
        'statut'      => $statut,
        'theme'       => ['id' => (int) $row['id_thematique'], 'nom' => $row['nomtheme']],
        'progress'    => [
            'validated_members' => $validatedMembers,
            'total_members'     => $memberCount,
            'completion_rate'   => $memberCount > 0 ? (int) round(($validatedMembers / $memberCount) * 100) : 0,
            'validated_names'   => $valNames,
            'pending_names'     => $pendNames,
        ],
    ];
}

gp_send_json(200, [
    'theme'    => ['id' => $themeId, 'nom' => $theme['nomtheme'], 'description' => $theme['descriptiontheme']],
    'team'     => $teamRow ? ['id' => $teamId, 'nom' => $teamRow['nomequipe'], 'membres' => $memberCount] : null,
    'progress' => ['completed' => $completedCount, 'total' => count($defis)],
    'defis'    => $defis,
]);
