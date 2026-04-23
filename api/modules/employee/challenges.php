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

$pdo = gp_pdo($config);
$userId = (int) $claims['sub'];

$stmt = $pdo->prepare("\n    SELECT emp.Id_equipe AS equipe_id, eq.nomEquipe\n    FROM Employe emp\n    LEFT JOIN Equipe eq ON eq.Id_equipe = emp.Id_equipe\n    WHERE emp.Id_Employe = :id\n    LIMIT 1\n");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();
$teamId = $teamRow ? (int) $teamRow['equipe_id'] : 0;

$memberCount = 1;
$validationMap = [];

if ($teamId > 0) {
    $stmt = $pdo->prepare("\n        SELECT COUNT(*) AS nb\n        FROM Employe e\n        JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n        WHERE e.Id_equipe = :team\n          AND u.statutUser = 'actif'\n    ");
    $stmt->execute([':team' => $teamId]);
    $countRow = $stmt->fetch();
    $memberCount = max(1, (int) ($countRow['nb'] ?? 0));

    $stmt = $pdo->prepare("\n        SELECT v.Id_defi, COUNT(DISTINCT v.Id_Employe) AS validated_members\n        FROM Valider v\n        JOIN Employe e ON e.Id_Employe = v.Id_Employe\n        JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n        WHERE e.Id_equipe = :team\n          AND u.statutUser = 'actif'\n        GROUP BY v.Id_defi\n    ");
    $stmt->execute([':team' => $teamId]);
} else {
    $stmt = $pdo->prepare("\n        SELECT v.Id_defi, COUNT(DISTINCT v.Id_Employe) AS validated_members\n        FROM Valider v\n        WHERE v.Id_Employe = :user\n        GROUP BY v.Id_defi\n    ");
    $stmt->execute([':user' => $userId]);
}

foreach ($stmt->fetchAll() as $row) {
    $validationMap[(int) $row['id_defi']] = (int) $row['validated_members'];
}

$stmt = $pdo->query("\n    SELECT DISTINCT t.Id_thematique, t.nomTheme, t.descriptionTheme\n    FROM Thematique t\n    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique\n    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)\n    ORDER BY t.nomTheme\n    LIMIT 1\n");
$theme = $stmt->fetch();

if (!$theme) {
    gp_send_json(200, [
        'theme' => null,
        'team' => $teamRow ? [
            'id' => $teamId,
            'nom' => $teamRow['nomequipe'],
            'membres' => $memberCount,
        ] : null,
        'progress' => [
            'completed' => 0,
            'total' => 0,
        ],
        'defis' => [],
    ]);
}

$themeId = (int) $theme['id_thematique'];

$stmt = $pdo->prepare("\n    SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,\n           r.ordre, r.Id_thematique, t.nomTheme\n    FROM Defi d\n    JOIN Regroupe r ON r.Id_defi = d.Id_defi\n    JOIN Thematique t ON t.Id_thematique = r.Id_thematique\n    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)\n      AND r.Id_thematique = :theme_id\n    ORDER BY r.ordre\n");
$stmt->execute([':theme_id' => $themeId]);
$rows = $stmt->fetchAll();

$themeUnlocked = true;
$completedCount = 0;
$defis = [];

foreach ($rows as $row) {
    $defiId = (int) $row['id_defi'];
    $ordre = (int) $row['ordre'];
    $validatedMembers = $validationMap[$defiId] ?? 0;
    $completed = $validatedMembers >= $memberCount;

    if ($completed) {
        $statut = 'completed';
        $completedCount++;
        $themeUnlocked = true;
    } elseif ($themeUnlocked || $ordre === 1) {
        $statut = 'active';
        $themeUnlocked = false;
    } else {
        $statut = 'locked';
    }

    $defis[] = [
        'id' => $defiId,
        'nom' => $row['nomdefi'],
        'description' => $row['descriptiondefi'],
        'points' => (int) $row['nbpointsdefi'],
        'co2' => (int) $row['nbco2defi'],
        'niveau' => (int) $row['niveaudefi'],
        'ordre' => $ordre,
        'statut' => $statut,
        'theme' => [
            'id' => (int) $row['id_thematique'],
            'nom' => $row['nomtheme'],
        ],
        'progress' => [
            'validated_members' => $validatedMembers,
            'total_members' => $memberCount,
            'completion_rate' => $memberCount > 0 ? (int) round(($validatedMembers / $memberCount) * 100) : 0,
        ],
    ];
}

gp_send_json(200, [
    'theme' => [
        'id' => $themeId,
        'nom' => $theme['nomtheme'],
        'description' => $theme['descriptiontheme'],
    ],
    'team' => $teamRow ? [
        'id' => $teamId,
        'nom' => $teamRow['nomequipe'],
        'membres' => $memberCount,
    ] : null,
    'progress' => [
        'completed' => $completedCount,
        'total' => count($defis),
    ],
    'defis' => $defis,
]);