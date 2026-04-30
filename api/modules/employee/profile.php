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
    SELECT u.prenomUser, u.nomUser, u.email, u.inscriptionUser, u.pdpUser,
           emp.nbPointsEmploye, emp.nbCO2, emp.departementEmploye,
           eq.nomEquipe, eq.Id_equipe AS equipe_id,
           ent.nomEntreprise
    FROM Utilisateur u
    JOIN Employe emp ON emp.Id_Employe = u.Id_User
    LEFT JOIN Equipe eq ON eq.Id_equipe = emp.Id_equipe
    JOIN Entreprise ent ON ent.Id_Entreprise = u.Id_Entreprise
    WHERE u.Id_User = :id
");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch();

if (!$user) {
    gp_send_json(404, ['message' => 'Profil introuvable']);
}

$stmt = $pdo->prepare("
    SELECT rang_perso
    FROM (
        SELECT Id_Employe, RANK() OVER (ORDER BY nbPointsEmploye DESC) AS rang_perso
        FROM Employe
    ) ranked
    WHERE Id_Employe = :id
");
$stmt->execute([':id' => $userId]);
$rankRow = $stmt->fetch();

$stmt = $pdo->prepare("
    SELECT b.nomBadge, b.descriptionBadge, b.iconeBadge, oe.dateObtention
    FROM Obtenir_Em oe
    JOIN Badge b ON b.Id_Badge = oe.Id_Badge
    WHERE oe.Id_Employe = :id
    ORDER BY oe.dateObtention DESC
");
$stmt->execute([':id' => $userId]);
$badges = $stmt->fetchAll();

$stmt = $pdo->prepare("
    SELECT d.nomDefi, MIN(v.date_validation) AS date_completion
    FROM Valider v
    JOIN Defi d ON d.Id_defi = v.Id_defi
    WHERE v.Id_Employe = :id
    GROUP BY d.Id_defi, d.nomDefi
    ORDER BY date_completion DESC
");
$stmt->execute([':id' => $userId]);
$history = $stmt->fetchAll();

gp_send_json(200, [
    'user' => [
        'prenom'      => $user['prenomuser'],
        'nom'         => $user['nomuser'],
        'email'       => $user['email'],
        'inscription' => $user['inscriptionuser'],
        'departement' => $user['departementemploye'],
        'entreprise'  => $user['nomentreprise'],
        'photo'       => $user['pdpuser'] ?? null,
    ],
    'stats' => [
        'points'     => (int) $user['nbpointsemploye'],
        'co2'        => (int) $user['nbco2'],
        'rang_perso' => $rankRow ? (int) $rankRow['rang_perso'] : 0,
    ],
    'equipe' => $user['equipe_id'] ? [
        'id'  => (int) $user['equipe_id'],
        'nom' => $user['nomequipe'],
    ] : null,
    'badges' => array_map(fn($b) => [
        'nom'         => $b['nombadge'],
        'description' => $b['descriptionbadge'],
        'icone'       => $b['iconebadge'],
        'date'        => $b['dateobtention'],
    ], $badges),
    'historique' => array_map(fn($h) => [
        'nom'  => $h['nomdefi'],
        'date' => $h['date_completion'],
    ], $history),
]);
