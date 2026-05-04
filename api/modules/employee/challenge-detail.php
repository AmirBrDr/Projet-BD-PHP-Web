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

$defiId = (int) ($_GET['id'] ?? 0);
if ($defiId <= 0) {
    gp_send_json(400, ['message' => 'Paramètre id manquant']);
}

$pdo    = gp_pdo($config);
$userId = (int) $claims['sub'];

// Info défi + thématique
$stmt = $pdo->prepare("
    SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
           t.nomTheme
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
    JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE d.Id_defi = :id
    LIMIT 1
");
$stmt->execute([':id' => $defiId]);
$defi = $stmt->fetch();

if (!$defi) {
    gp_send_json(404, ['message' => 'Défi introuvable']);
}

// Actions du défi avec statut validé par l'employé
$stmt = $pdo->prepare("
    SELECT a.Id_actions, a.nomAction, a.descriptionAction,
           EXISTS(
               SELECT 1 FROM Valider v
               WHERE v.Id_defi = :defi_id AND v.Id_actions = a.Id_actions AND v.Id_Employe = :emp_id
           ) AS valide
    FROM Actions a
    JOIN Faire_partie fp ON fp.Id_actions = a.Id_actions
    WHERE fp.Id_defi = :defi_id2
");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId, ':defi_id2' => $defiId]);
$actions = $stmt->fetchAll();

// Messages du forum
$stmt = $pdo->prepare("
    SELECT m.contenuMessage, m.dateMessage, u.prenomUser, u.nomUser
    FROM Message m
    JOIN Utilisateur u ON u.Id_User = m.Id_Employe
    JOIN Forum f ON f.Id_forum = m.Id_forum
    WHERE f.Id_defi = :id
    ORDER BY m.dateMessage DESC
    LIMIT 20
");
$stmt->execute([':id' => $defiId]);
$messages = $stmt->fetchAll();

// Historique des validations de l'employé pour ce défi
$stmt = $pdo->prepare("
    SELECT a.nomAction, v.date_validation, v.preuve
    FROM Valider v
    JOIN Actions a ON a.Id_actions = v.Id_actions
    WHERE v.Id_defi = :defi_id AND v.Id_Employe = :emp_id
    ORDER BY v.date_validation DESC
");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId]);
$historique = $stmt->fetchAll();

$dejaValide = count($historique) > 0;

gp_send_json(200, [
    'defi' => [
        'id'          => (int) $defi['id_defi'],
        'nom'         => $defi['nomdefi'],
        'description' => $defi['descriptiondefi'],
        'points'      => (int) $defi['nbpointsdefi'],
        'co2'         => (int) $defi['nbco2defi'],
        'niveau'      => (int) $defi['niveaudefi'],
        'theme'       => $defi['nomtheme'],
    ],
    'actions' => array_map(fn($a) => [
        'id'          => (int) $a['id_actions'],
        'nom'         => $a['nomaction'],
        'description' => $a['descriptionaction'],
        'valide'      => (bool) $a['valide'],
    ], $actions),
    'messages' => array_map(fn($m) => [
        'auteur' => $m['prenomuser'] . ' ' . $m['nomuser'],
        'texte'  => $m['contenumessage'],
        'date'   => str_replace(' ', 'T', (string) $m['datemessage']),
    ], $messages),
    'historique' => array_map(fn($h) => [
        'action' => $h['nomaction'],
        'date'   => $h['date_validation'],
        'preuve' => $h['preuve'],
    ], $historique),
    'deja_valide' => $dejaValide,
]);
