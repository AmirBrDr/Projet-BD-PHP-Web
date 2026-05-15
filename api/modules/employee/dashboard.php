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

$stmt = $pdo->prepare("\n    SELECT nbPointsEmploye, nbCO2 FROM Employe WHERE Id_Employe = :id\n");
$stmt->execute([':id' => $userId]);
$empRow = $stmt->fetch();

$stmt = $pdo->prepare("\n    SELECT COUNT(*) AS nb FROM Obtenir_Em WHERE Id_Employe = :id\n");
$stmt->execute([':id' => $userId]);
$badgeRow = $stmt->fetch();

$stmt = $pdo->prepare("\n    SELECT eq.nomEquipe, eq.Id_equipe AS equipe_id\n    FROM Equipe eq\n    JOIN Employe emp ON emp.Id_equipe = eq.Id_equipe\n    WHERE emp.Id_Employe = :id\n    LIMIT 1\n");
$stmt->execute([':id' => $userId]);
$teamRow = $stmt->fetch();

$teamRang = 0;
if ($teamRow) {
    // Classement equipe calcule par points décroissants
    $stmt = $pdo->prepare("\n        SELECT COUNT(*) + 1 AS rang\n        FROM Equipe\n        WHERE nbPointsEquipe > (\n            SELECT eq2.nbPointsEquipe FROM Equipe eq2\n            JOIN Employe emp2 ON emp2.Id_equipe = eq2.Id_equipe\n            WHERE emp2.Id_Employe = :id\n            LIMIT 1\n        )\n    ");
    $stmt->execute([':id' => $userId]);
    $rangRow = $stmt->fetch();
    $teamRang = $rangRow ? (int) $rangRow['rang'] : 1;
}

$teamId = $teamRow ? (int) $teamRow['equipe_id'] : 0;
$memberCount = 1;
$validationMap = [];
if ($teamId > 0) {
    // Nombre de membres actifs pour le calcul de progression
    $stmt = $pdo->prepare("\n        SELECT COUNT(*) AS nb\n        FROM Employe e\n        JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n        WHERE e.Id_equipe = :team\n          AND u.statutUser = 'actif'\n    ");
    $stmt->execute([':team' => $teamId]);
    $memberCountRow = $stmt->fetch();
    $memberCount = max(1, (int) ($memberCountRow['nb'] ?? 0));

    // Progression par defi: nombre de membres ayant valide
    $stmt = $pdo->prepare("\n        SELECT v.Id_defi, COUNT(DISTINCT v.Id_Employe) AS validated_members\n        FROM Valider v\n        JOIN Employe e ON e.Id_Employe = v.Id_Employe\n        JOIN Utilisateur u ON u.Id_User = e.Id_Employe\n        WHERE e.Id_equipe = :team\n          AND u.statutUser = 'actif'\n        GROUP BY v.Id_defi\n    ");
    $stmt->execute([':team' => $teamId]);
    foreach ($stmt->fetchAll() as $row) {
        $validationMap[(int) $row['id_defi']] = (int) $row['validated_members'];
    }
}

$stmt = $pdo->prepare("\n    SELECT d.Id_defi, d.nomDefi, d.nbPointsDefi, d.descriptionDefi, d.nbCO2Defi, d.niveauDefi,\n           r.ordre, r.Id_thematique, t.nomTheme\n    FROM Defi d\n    JOIN Regroupe r ON r.Id_defi = d.Id_defi\n    JOIN Thematique t ON t.Id_thematique = r.Id_thematique\n    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)\n    ORDER BY t.nomTheme, r.ordre\n    LIMIT 4\n");
$stmt->execute();
$defis = $stmt->fetchAll();

$themeState = [];
foreach ($defis as &$defi) {
    // Regle de deblocage: un seul defi actif par thematique
    $themeId = (int) $defi['id_thematique'];
    if (!array_key_exists($themeId, $themeState)) {
        $themeState[$themeId] = true;
    }

    $validatedMembers = $validationMap[(int) $defi['id_defi']] ?? 0;
    $completed = $validatedMembers >= $memberCount;
    if ($completed) {
        $statut = 'completed';
        $themeState[$themeId] = true;
    } elseif ($themeState[$themeId] || (int) $defi['ordre'] === 1) {
        $statut = 'active';
        $themeState[$themeId] = false;
    } else {
        $statut = 'locked';
    }

    $defi['fait'] = $statut === 'completed';
    $defi['statut'] = $statut;
    $defi['progress'] = [
        'validated_members' => $validatedMembers,
        'total_members' => $memberCount,
    ];
}
unset($defi);

$stmt = $pdo->prepare("\n    SELECT n.nomNotif, n.dateNotif, n.lienRedirection\n    FROM Notification n\n    JOIN Recevoir rc ON rc.id_notif = n.id_notif\n    WHERE rc.Id_User = :id\n    ORDER BY n.dateNotif DESC\n    LIMIT 5\n");
$stmt->execute([':id' => $userId]);
$notifs = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT
        TO_CHAR(date_trunc('month', v.date_validation), 'YYYY-MM') AS mois_key,
        COALESCE(SUM(d.nbCO2Defi), 0) AS co2
    FROM Valider v
    JOIN Defi d ON d.Id_defi = v.Id_defi
    WHERE v.Id_Employe = :id
      AND v.date_validation >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY date_trunc('month', v.date_validation)
    ORDER BY date_trunc('month', v.date_validation)
");
$stmt->execute([':id' => $userId]);
$co2Rows = $stmt->fetchAll();

// Construire une map mois_key => co2 depuis les données réelles
$co2Map = [];
foreach ($co2Rows as $row) {
    $co2Map[$row['mois_key']] = (int) $row['co2'];
}

// Toujours générer le squelette de 6 mois et y injecter les vraies valeurs
$co2Mensuel = [];
$hasCo2Data  = false;
for ($i = 5; $i >= 0; $i--) {
    $dt      = new DateTimeImmutable("first day of -$i month");
    $key     = $dt->format('Y-m');   // format YYYY-MM, correspond à TO_CHAR 'YYYY-MM'
    $co2Val  = $co2Map[$key] ?? 0;
    if ($co2Val > 0) $hasCo2Data = true;
    $co2Mensuel[] = [
        'mois' => $dt->format('M Y'),
        'co2'  => $co2Val,
    ];
}

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
        'statut' => $d['statut'] ?? 'active',
        'progress' => $d['progress'] ?? [
            'validated_members' => 0,
            'total_members' => 1,
        ],
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
    'has_co2_data' => $hasCo2Data,
]);