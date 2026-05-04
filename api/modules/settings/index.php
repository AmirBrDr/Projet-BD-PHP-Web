<?php

// Fichier: api/modules/settings/index.php - API et logique serveur.
/**
 * Settings Module
 * Handles global settings operations (thematiques, gamification rules, etc.)
 */

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

/**
 * Vérifie que la requête provient d'un administrateur via un token JWT valide.
 * Envoie une réponse JSON en cas d'erreur (401 non autorisé, 403 accès refusé).
 * 
 * @param array $config Configuration contenant les paramètres JWT
 * @return array Payload du token JWT vérifié
 */
function settings_require_admin(array $config): array
{
    $token = gp_get_bearer_token();
    if ($token === '') {
        gp_send_json(401, ['message' => 'Token manquant']);
    }

    try {
        $payload = gp_jwt_verify($token, $config['jwt']);
    } catch (Throwable $e) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }

    $role = gp_normalize_role((string)($payload['role'] ?? ''));
    if ($role !== 'admin') {
        gp_send_json(403, ['message' => 'Accès réservé aux administrateurs']);
    }

    return $payload;
}

/**
 * Récupère les paramètres globaux
 * Note: Dans une vraie implémentation, ces données viendraient d'une table config
 */
function settings_get(PDO $pdo): array
{
    // Récupérer les thématiques
    $stmt = $pdo->prepare('SELECT id_thematique, nomtheme, descriptiontheme FROM thematique ORDER BY nomtheme');
    $stmt->execute();
    $thematiques = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer les badges
    $stmt = $pdo->prepare('SELECT id_badge, nombadge, descriptionbadge, iconebadge FROM badge ORDER BY id_badge');
    $stmt->execute();
    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Paramètres par défaut (à stocker dans une table config en production)
    $settings = [
        'thematiques' => array_map(function($t) {
            return [
                'id' => (int)$t['id_thematique'],
                'nom' => $t['nomtheme'],
                'description' => $t['descriptiontheme']
            ];
        }, $thematiques),
        'badges' => array_map(function($b) {
            return [
                'id' => (int)$b['id_badge'],
                'nom' => $b['nombadge'],
                'description' => $b['descriptionbadge'],
                'icone' => $b['iconebadge']
            ];
        }, $badges),
        'gamification' => [
            'pointsParDefi' => 100,
            'co2ParDefi' => 50,
            'badgesActives' => true,
            'notificationsActives' => true
        ],
        'system' => [
            'maintenanceMode' => false,
            'maxUsersParEquipe' => 10
        ],
        'notifications' => [
            'active' => true,
            'frequency' => 'biweekly',
        ],
    ];

    return $settings;
}

/**
 * Met à jour les paramètres globaux
 */
function settings_update(PDO $pdo, array $data): void
{
    // Pour les thématiques, gérer ajout/modification/suppression
    if (isset($data['thematiques'])) {
        // Supprimer les thématiques non présentes dans la liste
        $ids = array_column($data['thematiques'], 'id');
        $ids = array_filter($ids, 'is_numeric');
        if (!empty($ids)) {
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $stmt = $pdo->prepare("DELETE FROM thematique WHERE id_thematique NOT IN ($placeholders)");
            $stmt->execute($ids);
        } else {
            $pdo->exec('DELETE FROM thematique');
        }

        // Insérer ou mettre à jour les thématiques
        foreach ($data['thematiques'] as $theme) {
            if (isset($theme['id']) && is_numeric($theme['id'])) {
                // Update
                $stmt = $pdo->prepare('UPDATE thematique SET nomtheme = ?, descriptiontheme = ? WHERE id_thematique = ?');
                $stmt->execute([$theme['nom'], $theme['description'] ?? '', $theme['id']]);
            } else {
                // Insert
                $stmt = $pdo->prepare('INSERT INTO thematique (nomtheme, descriptiontheme) VALUES (?, ?)');
                $stmt->execute([$theme['nom'], $theme['description'] ?? '']);
            }
        }
    }

    // Pour les badges, gérer ajout/modification/suppression
    if (isset($data['badges'])) {
        foreach ($data['badges'] as $badge) {
            if (isset($badge['id']) && is_numeric($badge['id'])) {
                if (!empty($badge['deleted'])) {
                    $stmt = $pdo->prepare('DELETE FROM badge WHERE id_badge = ?');
                    $stmt->execute([$badge['id']]);
                    continue;
                }

                $stmt = $pdo->prepare(
                    'UPDATE badge SET nombadge = ?, descriptionbadge = ?, iconebadge = ? WHERE id_badge = ?'
                );
                $stmt->execute([
                    $badge['nom'],
                    $badge['description'] ?? '',
                    $badge['icone'] ?? '',
                    $badge['id']
                ]);
            } elseif (empty($badge['deleted'])) {
                $stmt = $pdo->prepare('INSERT INTO badge (nombadge, descriptionbadge, iconebadge) VALUES (?, ?, ?)');
                $stmt->execute([
                    $badge['nom'],
                    $badge['description'] ?? '',
                    $badge['icone'] ?? ''
                ]);
            }
        }
    }

    // Pour les autres paramètres, stocker dans une table config (non implémentée ici)
    // TODO: Créer table config avec clé-valeur pour gamification et system settings
}

function settings_send_inactivity_notifications(PDO $pdo, array $notifications, array $config): array
{
    $active = !empty($notifications['active']);
    if (!$active) {
        return ['emailsSent' => 0];
    }

    $frequency = trim((string)($notifications['frequency'] ?? 'biweekly'));
    if (!in_array($frequency, ['weekly', 'biweekly'], true)) {
        $frequency = 'biweekly';
    }

    $stmt = $pdo->prepare(
        "SELECT nomuser, prenomuser, email FROM utilisateur "
        . "WHERE statutuser = 'actif' "
        . "AND derniereconnexion < NOW() - INTERVAL '3 days'"
    );
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $subject = 'GreenPulse - Rappel de participation';
    $frequencyText = $frequency === 'weekly' ? 'une fois par semaine' : 'une fois toutes les deux semaines';
    $sentCount = 0;

    foreach ($users as $user) {
        $email = trim((string)($user['email'] ?? ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            continue;
        }

        $displayName = trim((string)($user['prenomuser'] ?? '') . ' ' . (string)($user['nomuser'] ?? ''));
        if ($displayName === '') {
            $displayName = 'collaborateur';
        }

        $htmlBody = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#071225;color:#fff;padding:24px;">'
            . '<div style="max-width:640px;margin:0 auto;background:#0a1830;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;">'
            . '<h2 style="margin-top:0;color:#2bd47c;">Rappel de participation</h2>'
            . '<p>Bonjour ' . htmlspecialchars($displayName, ENT_QUOTES, 'UTF-8') . ',</p>'
            . '<p>Vous n’avez pas accédé à GreenPulse depuis plus de 3 jours. Pour rester dans le rythme du défi, pensez à vous reconnecter et à participer aux actions.</p>'
            . '<p>Ce type de rappel est envoyé ' . htmlspecialchars($frequencyText, ENT_QUOTES, 'UTF-8') . ' lorsque l’option est activée.</p>'
            . '<p style="margin-top:24px;color:rgba(255,255,255,.75);">Si vous avez déjà participé récemment, vous pouvez ignorer ce message.</p>'
            . '</div></body></html>';

        $textBody = "Bonjour {$displayName},\n\nVous n’avez pas accédé à GreenPulse depuis plus de 3 jours. Ce rappel est envoyé {$frequencyText}.\n\nConnectez-vous pour continuer à participer aux défis.";

        try {
            gp_send_email($config, $email, $subject, $htmlBody, $textBody);
            $sentCount++;
        } catch (Throwable $e) {
            continue;
        }
    }

    return ['emailsSent' => $sentCount];
}

// Routage des requêtes
$method = $_SERVER['REQUEST_METHOD'] ?? '';

try {
    $pdo = gp_pdo($config);
    $payload = settings_require_admin($config);

    if ($method === 'GET') {
        $settings = settings_get($pdo);
        gp_send_json(200, ['settings' => $settings]);
    } elseif ($method === 'POST') {
        $body = gp_read_json_body();
        settings_update($pdo, $body);
        $result = settings_send_inactivity_notifications($pdo, $body['notifications'] ?? [], $config);
        gp_send_json(200, array_merge(['message' => 'Paramètres mis à jour'], $result));
    } else {
        gp_send_json(405, ['message' => 'Méthode non autorisée']);
    }
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
?>
