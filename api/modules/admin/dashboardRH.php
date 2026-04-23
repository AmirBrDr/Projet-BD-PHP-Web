<?php

$pdo = gp_pdo($config);

// Requêtes avec alias
$sql_co2 = "SELECT COALESCE(SUM(nbCO2Equipe), 0) AS co2Tot FROM Equipe";

$sql_participation = "SELECT COALESCE(AVG(nb_messages), 0) AS tauxParticipation
FROM (
    SELECT idEmploye, COUNT(*) AS nb_messages
    FROM Message
    GROUP BY idEmploye
) AS stats
";

$sql_actions_Validees = "SELECT COUNT(*) AS actionsValides FROM Valider";

// Tableau des requêtes
$queries = [
    'co2Tot' => $sql_co2,
    'tauxParticipation' => $sql_participation,
    'actionsValides' => $sql_actions_Validees
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
    'status' => 'success',
    'module' => 'admin',
    'co2Tot' => $results['co2Tot'],
    'tauxParticipation' => $results['tauxParticipation'],
    'actionsValides' => $results['actionsValides']
]);

?>