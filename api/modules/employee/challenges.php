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

// Thématique du mois actif
$stmt = $pdo->query("
    SELECT DISTINCT t.Id_thematique, t.nomTheme, t.descriptionTheme
    FROM Thematique t
    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique
    WHERE date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    LIMIT 1
");
$theme = $stmt->fetch();

if (!$theme) {
    gp_send_json(200, [
        'theme' => null,
        'defis' => [],
    ]);
}

$themeId = (int) $theme['id_thematique'];

// Défis de la thématique avec statut validé par l'employé
$stmt = $pdo->prepare("
    SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
           r.ordre,
           EXISTS(
               SELECT 1 FROM Valider v WHERE v.Id_defi = d.Id_defi AND v.Id_Employe = :id
           ) AS valide
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi AND r.Id_thematique = :theme_id
    ORDER BY r.ordre
");
$stmt->execute([':id' => $userId, ':theme_id' => $themeId]);
$rows = $stmt->fetchAll();

// Calcul du statut (valide > actif > bloque)
$validatedOrders = [];
foreach ($rows as $row) {
    if ($row['valide']) {
        $validatedOrders[] = (int) $row['ordre'];
    }
}

$defis = array_map(function ($row) use ($validatedOrders) {
    $ordre = (int) $row['ordre'];
    if ($row['valide']) {
        $statut = 'completed';
    } elseif ($ordre === 1 || in_array($ordre - 1, $validatedOrders, true)) {
        $statut = 'active';
    } else {
        $statut = 'locked';
    }
    return [
        'id'          => (int) $row['id_defi'],
        'nom'         => $row['nomdefi'],
        'description' => $row['descriptiondefi'],
        'points'      => (int) $row['nbpointsdefi'],
        'co2'         => (int) $row['nbco2defi'],
        'niveau'      => (int) $row['niveaudefi'],
        'ordre'       => $ordre,
        'statut'      => $statut,
    ];
}, $rows);

gp_send_json(200, [
    'theme' => [
        'id'          => $themeId,
        'nom'         => $theme['nomtheme'],
        'description' => $theme['descriptiontheme'],
    ],
    'defis' => $defis,
]);
