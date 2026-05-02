<?php
// Fichier: api/modules/statistics/index.php

error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
$pdo = gp_pdo($config);

// --- 1. Stats globales ---
$stmt = $pdo->query("
    SELECT 
        COUNT(DISTINCT d.Id_defi) AS total_defis,
        COUNT(DISTINCT t.Id_thematique) AS total_themes,
        COUNT(v.Id_defi) AS total_validations,
        COALESCE(SUM(d.nbCO2Defi), 0) AS total_co2
    FROM Defi d
    LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
    LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
");
$globales = $stmt->fetch(PDO::FETCH_ASSOC);

// --- 2. Validations par défi ---
$stmt2 = $pdo->query("
    SELECT 
        d.nomDefi,
        t.nomTheme,
        COUNT(v.Id_Employe) AS nb_validations,
        d.nbPointsDefi AS points
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY d.Id_defi, d.nomDefi, t.nomTheme, d.nbPointsDefi
    ORDER BY nb_validations DESC
");
$parDefi = $stmt2->fetchAll(PDO::FETCH_ASSOC);

// --- 3. Stats par thématique ---
$stmt3 = $pdo->query("
    SELECT 
        t.nomTheme,
        COUNT(DISTINCT d.Id_defi) AS nb_defis,
        COUNT(v.Id_Employe) AS nb_validations,
        COALESCE(SUM(DISTINCT d.nbCO2Defi), 0) AS co2_total
    FROM Thematique t
    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique
    JOIN Defi d ON d.Id_defi = r.Id_defi
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY t.Id_thematique, t.nomTheme
    ORDER BY nb_validations DESC
");
$parTheme = $stmt3->fetchAll(PDO::FETCH_ASSOC);

// --- 4. Taux de validation ---
$stmt4 = $pdo->query("
    SELECT
        d.nomDefi,
        COUNT(DISTINCT fp.Id_actions) AS nb_actions_total,
        COUNT(DISTINCT v.Id_actions) AS nb_actions_validees
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    JOIN Faire_partie fp ON fp.Id_defi = d.Id_defi
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi AND v.Id_actions = fp.Id_actions
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY d.Id_defi, d.nomDefi
    ORDER BY nb_actions_validees DESC
");
$validation = $stmt4->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'data' => [
        'globales'   => $globales,
        'par_defi'   => $parDefi,
        'par_theme'  => $parTheme,
        'validation' => $validation,
    ]
], JSON_UNESCAPED_UNICODE);