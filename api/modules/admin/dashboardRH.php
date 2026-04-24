<?php

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

$pdo = gp_pdo($config);

// Requêtes avec alias
$sql_co2 = "SELECT COALESCE(SUM(nbCO2Equipe), 0) AS co2Tot FROM Equipe";

$sql_participation = "SELECT 
    ROUND(
        COUNT(DISTINCT m.id_employe) * 100.0 / (SELECT COUNT(*) FROM Employe),
        1
    ) AS tauxParticipation
FROM Message m
";

$sql_actions_Validees = "SELECT COUNT(*) AS actionsValides FROM Valider";

$sql_taux_engagement = "SELECT
    e.departementEmploye                                AS departement,
    COUNT(DISTINCT e.Id_Employe)                        AS total_employes,
    COUNT(DISTINCT v.Id_Employe)                        AS employes_actifs,
    ROUND(
        COUNT(DISTINCT v.Id_Employe) * 100.0
        / COUNT(DISTINCT e.Id_Employe)
    , 1)                                                AS taux_engagement
FROM Employe e
LEFT JOIN Valider v
    ON v.Id_Employe = e.Id_Employe
LEFT JOIN Utilisateur u
    ON u.Id_User = e.Id_Employe
WHERE u.statutUser = 'actif'
GROUP BY e.departementEmploye
ORDER BY taux_engagement DESC";

// Tableau des requêtes
$queries = [
    'co2tot' => $sql_co2,
    'tauxparticipation' => $sql_participation,
    'actionsvalides' => $sql_actions_Validees,
    'taux_engagement' => $sql_taux_engagement
];

$results = [];

// Boucle pour tout exécuter automatiquement
foreach ($queries as $key => $sql) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    // On récupère la valeur via l'alias
    $results[$key] = $data[$key];
}



// Réponse JSON
http_response_code(200);
echo json_encode([
    "status" => "success",
    "module" => "admin",
    "co2Tot" => $results["co2tot"],
    "tauxParticipation" => $results["tauxparticipation"]."%",
    "actionsValides" => $results["actionsvalides"],
    "taux_engagement" => $results["taux_engagement"]."%"
]);
