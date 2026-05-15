<?php

declare(strict_types=1);

require_once __DIR__ . '/../../bootstrap.php';

// Endpoint reserve aux animateurs (gestion des badges)
$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $payload = gp_jwt_verify($token, $config['jwt']);
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

$role = gp_normalize_role((string) ($payload['role'] ?? ''));
if ($role !== 'animateur') {
    gp_send_json(403, ['message' => 'Accès réservé aux animateurs']);
}

$pdo    = gp_pdo($config);
$method = $_SERVER['REQUEST_METHOD'] ?? '';

try {
    if ($method === 'GET') {
        // Liste des badges pour le catalogue
        $stmt = $pdo->prepare(
            'SELECT id_badge, nombadge, descriptionbadge, iconebadge
             FROM badge
             ORDER BY id_badge'
        );
        $stmt->execute();
        $badges = $stmt->fetchAll();

        gp_send_json(200, [
            'badges' => array_map(fn($b) => [
                'id'          => (int) $b['id_badge'],
                'nom'         => $b['nombadge'],
                'description' => $b['descriptionbadge'] ?? '',
                'icone'       => $b['iconebadge'] ?? '',
            ], $badges),
        ]);
    }

    if ($method === 'POST') {
        // Mise a jour batch: creation, edition, suppression
        $body   = gp_read_json_body();
        $badges = $body['badges'] ?? [];

        if (!is_array($badges)) {
            gp_send_json(400, ['message' => 'badges doit être un tableau']);
        }

        foreach ($badges as $badge) {
            $id      = isset($badge['id']) && is_numeric($badge['id']) ? (int) $badge['id'] : null;
            $deleted = !empty($badge['deleted']);
            $nom     = trim((string) ($badge['nom'] ?? ''));
            $desc    = trim((string) ($badge['description'] ?? ''));
            $icone   = trim((string) ($badge['icone'] ?? ''));

            if ($id !== null) {
                if ($deleted) {
                    $stmt = $pdo->prepare('DELETE FROM badge WHERE id_badge = ?');
                    $stmt->execute([$id]);
                    continue;
                }
                if ($nom === '') continue;
                $stmt = $pdo->prepare(
                    'UPDATE badge SET nombadge = ?, descriptionbadge = ?, iconebadge = ? WHERE id_badge = ?'
                );
                $stmt->execute([$nom, $desc, $icone, $id]);
            } elseif (!$deleted && $nom !== '') {
                $stmt = $pdo->prepare(
                    'INSERT INTO badge (nombadge, descriptionbadge, iconebadge) VALUES (?, ?, ?)'
                );
                $stmt->execute([$nom, $desc, $icone]);
            }
        }

        gp_send_json(200, ['message' => 'Badges mis à jour']);
    }

    gp_send_json(405, ['message' => 'Méthode non autorisée']);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
