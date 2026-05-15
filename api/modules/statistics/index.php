<?php
// Fichier: api/modules/statistics/index.php

require_once __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');
$pdo = gp_pdo($config);

// --- 1. Stats globales (mois courant uniquement) ---
$stmt = $pdo->query("
    SELECT 
        COUNT(DISTINCT d.Id_defi) AS total_defis,
        COUNT(DISTINCT t.Id_thematique) AS total_themes,
        COUNT(DISTINCT v.Id_Employe) AS total_participants,
        COALESCE(SUM(d.nbCO2Defi), 0) AS total_co2
    FROM Defi d
    LEFT JOIN Regroupe r ON r.Id_defi = d.Id_defi
    LEFT JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
        AND DATE_TRUNC('month', v.mois) = DATE_TRUNC('month', CURRENT_DATE)
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
");
$globales = $stmt->fetch(PDO::FETCH_ASSOC);

// --- 2. Participants par défi (mois courant) ---
$stmt2 = $pdo->query("
    SELECT 
        d.nomDefi,
        t.nomTheme,
        COUNT(DISTINCT v.Id_Employe) AS nb_participants,
        d.nbPointsDefi AS points
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
        AND DATE_TRUNC('month', v.mois) = DATE_TRUNC('month', CURRENT_DATE)
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY d.Id_defi, d.nomDefi, t.nomTheme, d.nbPointsDefi
    ORDER BY nb_participants DESC
");
$parDefi = $stmt2->fetchAll(PDO::FETCH_ASSOC);

// --- 3. Stats par thématique (mois courant) ---
$stmt3 = $pdo->query("
    SELECT 
        t.nomTheme,
        COUNT(DISTINCT d.Id_defi) AS nb_defis,
        COUNT(DISTINCT v.Id_Employe) AS nb_participants,
        COALESCE(SUM(d.nbCO2Defi), 0) AS co2_total
    FROM Thematique t
    JOIN Regroupe r ON r.Id_thematique = t.Id_thematique
    JOIN Defi d ON d.Id_defi = r.Id_defi
    LEFT JOIN Valider v ON v.Id_defi = d.Id_defi
        AND DATE_TRUNC('month', v.mois) = DATE_TRUNC('month', CURRENT_DATE)
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY t.Id_thematique, t.nomTheme
    ORDER BY nb_participants DESC
");
$parTheme = $stmt3->fetchAll(PDO::FETCH_ASSOC);

// --- 4. Taux de validation des défis du mois (par employés en équipe) ---
$stmt4 = $pdo->query("
    SELECT
        d.nomDefi,
        COUNT(DISTINCT v.Id_Employe)                                    AS nb_employes_valides,
        (SELECT COUNT(*) FROM Employe WHERE Id_equipe IS NOT NULL)      AS total_employes_equipes
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    LEFT JOIN Valider v
        ON v.Id_defi = d.Id_defi
        AND DATE_TRUNC('month', v.mois) = DATE_TRUNC('month', CURRENT_DATE)
    WHERE DATE_TRUNC('month', r.mois) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY d.Id_defi, d.nomDefi
    ORDER BY nb_employes_valides DESC
");
$validationMonth = $stmt4->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'data' => [
        'globales'          => $globales,
        'par_defi'          => $parDefi,
        'par_theme'         => $parTheme,
        'validation_month'  => $validationMonth,
    ]
]);