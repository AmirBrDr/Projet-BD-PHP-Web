<?php

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

header('Content-Type: application/json');

$pdo = gp_pdo($config);

// Requêtes avec alias
$sql_co2 = "SELECT COALESCE(SUM(nbCO2Equipe), 0) AS co2Tot FROM Equipe";

$sql_participation = "SELECT 
    ROUND(
        COUNT(DISTINCT v.id_employe) * 100.0 / (SELECT COUNT(*) FROM Employe),
        1
    ) AS tauxParticipation
FROM Valider v

";

$sql_actions_Validees = "SELECT COUNT(*) AS actionsValides FROM Valider";

$sql_engagementParDept = "SELECT
    e.departementEmploye                                AS departement,
    ROUND(
        COUNT(DISTINCT v.Id_Employe) * 100.0
        / COUNT(DISTINCT e.Id_Employe)
    , 1)                                                AS engagementParDept
FROM Employe e
LEFT JOIN Valider v
    ON v.Id_Employe = e.Id_Employe
LEFT JOIN Utilisateur u
    ON u.Id_User = e.Id_Employe
WHERE u.statutUser = 'actif'
GROUP BY e.departementEmploye
ORDER BY engagementParDept DESC";

$sql_co2ParCategorie = "SELECT t.nomTheme as categorie
, SUM(d.nbCo2defi) as co2
, ROUND(SUM(d.nbCo2defi) * 1.0 * 100 / (SELECT SUM(nbCo2defi) FROM Defi )) as pourcentage 
FROM Thematique t, Defi d, Regroupe r
WHERE t.id_thematique = r.id_thematique 
and d.id_defi = r.id_defi 
Group by categorie";

// Tableau des requêtes
$queries = [
    'co2tot' => $sql_co2,
    'tauxparticipation' => $sql_participation,
    'actionsvalides' => $sql_actions_Validees,
    'engagementParDept' => $sql_engagementParDept, 
    'co2ParCategorie' => $sql_co2ParCategorie
];



// Boucle pour tout exécuter automatiquement
$results = [];

foreach ($queries as $key => $sql) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    // CAS SPÉCIAL : engagement par département
    if ($key === 'engagementParDept') {
        $results[$key] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        for ($i = 0; $i < count($results[$key]); $i++) {
            $results[$key][$i]['engagementpardept'] = (float) $results[$key][$i]['engagementpardept'];
        }
        continue;
    } else if ($key === 'co2ParCategorie'){
        $results[$key] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        for ($i = 0; $i < count($results[$key]); $i++) {
            $results[$key][$i]['co2'] = (float) $results[$key][$i]['co2'];
            $results[$key][$i]['pourcentage'] = (float) $results[$key][$i]['pourcentage'];
        }
        continue;
    }
    // CAS NORMAL : une seule valeur
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    $results[$key] = array_values($data)[0];
}




// Réponse JSON
http_response_code(200);
echo json_encode([
    "status" => "success",
    "module" => "admin",
    "co2Tot" => $results["co2tot"],
    "tauxParticipation" => $results["tauxparticipation"]."%",
    "actionsValides" => $results["actionsvalides"],
    "engagementParDept" => $results["engagementParDept"], 
    "co2ParCategorie" => $results["co2ParCategorie"]
]);
