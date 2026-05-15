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
gp_ensure_defi_block_table($pdo);
gp_ensure_replies_table($pdo);
$userId = (int) $claims['sub'];

// Info defi + thematique (mois courant)
$stmt = $pdo->prepare("
    SELECT d.Id_defi, d.nomDefi, d.descriptionDefi, d.nbPointsDefi, d.nbCO2Defi, d.niveauDefi,
           t.nomTheme
    FROM Defi d
    JOIN Regroupe r ON r.Id_defi = d.Id_defi
        AND date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
    JOIN Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE d.Id_defi = :id
    LIMIT 1
");
$stmt->execute([':id' => $defiId]);
$defi = $stmt->fetch();

if (!$defi) {
    gp_send_json(404, ['message' => 'Défi introuvable']);
}

// Actions du defi avec statut valide par l'employe — mois courant uniquement
$stmt = $pdo->prepare("
    SELECT a.Id_actions, a.nomAction, a.descriptionAction,
           EXISTS(
               SELECT 1 FROM Valider v
               WHERE v.Id_defi = :defi_id AND v.Id_actions = a.Id_actions AND v.Id_Employe = :emp_id
                 AND date_trunc('month', v.mois) = date_trunc('month', CURRENT_DATE)
           ) AS valide
    FROM Actions a
    JOIN Faire_partie fp ON fp.Id_actions = a.Id_actions
    WHERE fp.Id_defi = :defi_id2
");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId, ':defi_id2' => $defiId]);
$actions = $stmt->fetchAll();

// Messages du forum (derniers echanges)
$stmt = $pdo->prepare("
    SELECT m.contenuMessage, m.dateMessage, u.prenomUser, u.nomUser
    FROM Message m
    JOIN Utilisateur u ON u.Id_User = m.Id_Employe
    JOIN Forum f ON f.Id_forum = m.Id_forum
    WHERE f.Id_defi = :id AND date_trunc('month', f.mois) = date_trunc('month', CURRENT_DATE)
    ORDER BY m.dateMessage DESC
    LIMIT 20
");
$stmt->execute([':id' => $defiId]);
$messages = $stmt->fetchAll();

// Statut blocage du defi pour cet employe
$stmt = $pdo->prepare("\n    SELECT motif, date_blocage\n    FROM Defi_Employe_Block\n    WHERE Id_defi = :defi_id AND Id_Employe = :emp_id\n    LIMIT 1\n");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId]);
$blockRow = $stmt->fetch();
$isBlocked = (bool) $blockRow;
$blockReason = $blockRow ? (string) ($blockRow['motif'] ?? '') : '';
$blockDate = $blockRow ? ($blockRow['date_blocage'] ?? null) : null;

// Historique des validations de l'employe pour ce defi
$stmt = $pdo->prepare("
    SELECT a.nomAction, v.date_validation, v.preuve
    FROM Valider v
    JOIN Actions a ON a.Id_actions = v.Id_actions
    WHERE v.Id_defi = :defi_id AND v.Id_Employe = :emp_id
      AND date_trunc('month', v.mois) = date_trunc('month', CURRENT_DATE)
    ORDER BY v.date_validation DESC
");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId]);
$historique = $stmt->fetchAll();

$stmt = $pdo->prepare("\n    SELECT\n        rd.Id_reponse,\n        rd.Id_actions,\n        a.nomAction,\n        rd.reponse_text,\n        rd.statut_reponse,\n        rd.commentaire_animateur,\n        to_char(rd.date_reponse, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS date_reponse,\n        to_char(rd.date_traitement, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS date_traitement\n    FROM Reponse_Defi rd\n    LEFT JOIN Actions a ON a.Id_actions = rd.Id_actions\n    WHERE rd.Id_defi = :defi_id AND rd.Id_Employe = :emp_id\n      AND date_trunc('month', rd.date_reponse) = date_trunc('month', CURRENT_TIMESTAMP)\n    ORDER BY rd.date_reponse DESC\n");
$stmt->execute([':defi_id' => $defiId, ':emp_id' => $userId]);
$replies = $stmt->fetchAll();

$latestByAction = [];
$hasPending = false;
foreach ($replies as $reply) {
    if (($reply['statut_reponse'] ?? '') === 'pending') {
        $hasPending = true;
    }

    $actionId = (int) ($reply['id_actions'] ?? 0);
    if ($actionId > 0 && !array_key_exists($actionId, $latestByAction)) {
        $latestByAction[$actionId] = $reply;
    }
}

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
    'actions' => array_map(function ($a) use ($latestByAction) {
        $reply = $latestByAction[(int) $a['id_actions']] ?? null;

        return [
            'id'          => (int) $a['id_actions'],
            'nom'         => $a['nomaction'],
            'description' => $a['descriptionaction'],
            'valide'      => (bool) $a['valide'],
            'reply_status' => $reply['statut_reponse'] ?? null,
            'reply_comment' => $reply['commentaire_animateur'] ?? null,
            'reply_date' => $reply['date_reponse'] ?? null,
            'reply_text' => $reply['reponse_text'] ?? null,
        ];
    }, $actions),
    'messages' => array_map(fn($m) => [
        'auteur' => $m['prenomuser'] . ' ' . $m['nomuser'],
        'texte'  => $m['contenumessage'],
        'date'   => str_replace(' ', 'T', (string) $m['datemessage']),
    ], $messages),
    'reponses' => array_map(fn($r) => [
        'id' => (int) $r['id_reponse'],
        'action_id' => (int) ($r['id_actions'] ?? 0),
        'action' => $r['nomaction'] ?? null,
        'reponse' => $r['reponse_text'] ?? null,
        'statut' => $r['statut_reponse'] ?? null,
        'commentaire' => $r['commentaire_animateur'] ?? null,
        'date' => $r['date_reponse'] ?? null,
        'date_traitement' => $r['date_traitement'] ?? null,
    ], $replies),
    'historique' => array_map(fn($h) => [
        'action' => $h['nomaction'],
        'date'   => $h['date_validation'],
        'preuve' => $h['preuve'],
    ], $historique),
    'has_pending' => $hasPending,
    'deja_valide' => $dejaValide,
    'blocked' => $isBlocked,
    'blocked_reason' => $blockReason !== '' ? $blockReason : null,
    'blocked_at' => $blockDate,
]);
