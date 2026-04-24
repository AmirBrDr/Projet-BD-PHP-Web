<?php

/**
 * File: api/modules/profile/security.php - Security operations for user account
 * Handles password changes, 2FA, sessions, and security information
 */

declare(strict_types=1);

require __DIR__ . '/../../bootstrap.php';

/**
 * Récupère les informations de sécurité de l'utilisateur connecté
 */
function security_get_info(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('
        SELECT u.id_user, u.email, u.inscriptionuser, u.dernierchangementmdp, u.derniereconnexion
        FROM utilisateur u
        WHERE u.id_user = :id
    ');
    $stmt->execute([':id' => $userId]);
    $info = $stmt->fetch();

    if (!$info) {
        return [];
    }

    // Calculer le nombre de jours depuis le dernier changement de mot de passe
    $lastPwdChange = $info['dernierchangementmdp'] ?? $info['inscriptionuser'];
    $pwdChangeDate = new DateTime($lastPwdChange);
    $now = new DateTime();
    $daysSinceChange = $pwdChangeDate->diff($now)->days;

    // Récupérer la date de dernière connexion réelle
    $lastLoginDate = $info['derniereconnexion'] ? new DateTime($info['derniereconnexion']) : new DateTime();

    return [
        'email' => $info['email'],
        'inscriptionDate' => $info['inscriptionuser'],
        'lastPasswordChange' => $lastPwdChange,
        'daysSincePasswordChange' => $daysSinceChange,
        'lastLogin' => $lastLoginDate->format('Y-m-d H:i:s'),
        'activeSessions' => 1,
        'twoFactorEnabled' => false,
    ];
}

/**
 * Change le mot de passe de l'utilisateur
 */
function security_change_password(PDO $pdo, int $userId, string $currentPassword, string $newPassword): void
{
    // Récupérer le mot de passe actuel
    $stmt = $pdo->prepare('SELECT mdp FROM utilisateur WHERE id_user = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur non trouvé']);
    }

    // Vérifier le mot de passe actuel
    if (!password_verify($currentPassword, $user['mdp'])) {
        gp_send_json(401, ['message' => 'Mot de passe actuel incorrect']);
    }

    // Valider le nouveau mot de passe
    if (strlen($newPassword) < 8) {
        gp_send_json(400, ['message' => 'Le mot de passe doit faire au moins 8 caractères']);
    }

    // Hasher et mettre à jour
    $hashedPassword = password_hash($newPassword, PASSWORD_ARGON2ID);
    
    // Update password
    $stmt = $pdo->prepare('UPDATE utilisateur SET mdp = :pwd WHERE id_user = :id');
    $result = $stmt->execute([':pwd' => $hashedPassword, ':id' => $userId]);
    
    if (!$result || $stmt->rowCount() === 0) {
        gp_send_json(500, ['message' => 'Erreur lors de la mise à jour du mot de passe']);
    }
    
    // Essayer de mettre à jour la date de dernier changement si la colonne existe
    try {
        $stmt2 = $pdo->prepare('UPDATE utilisateur SET dernierchangementmdp = CURRENT_DATE WHERE id_user = :id');
        $stmt2->execute([':id' => $userId]);
    } catch (Throwable $e) {
        // La colonne n'existe peut-être pas, on continue quand même
    }
}

/**
 * Active ou désactive l'authentification à deux facteurs (placeholder)
 */
function security_toggle_2fa(PDO $pdo, int $userId, bool $enable): array
{
    $stmt = $pdo->prepare('SELECT 1 FROM utilisateur WHERE id_user = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        gp_send_json(404, ['message' => 'Utilisateur non trouvé']);
    }

    if ($enable) {
        // Générer un secret TOTP
        $secret = bin2hex(random_bytes(20));
        // À améliorer: ajouter colonne twofa_secret à la table utilisateur
        
        return ['status' => 'secret_generated', 'secret' => $secret];
    } else {
        // À améliorer: ajouter colonne twofa_secret à la table utilisateur
        
        return ['status' => 'disabled'];
    }
}

/**
 * Récupère les sessions actives de l'utilisateur
 */
function security_get_sessions(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('
        SELECT id_session, adresse_ip, user_agent, date_creation, derniere_activite
        FROM Session
        WHERE id_user = :user_id AND active = true
        ORDER BY derniere_activite DESC
    ');
    $stmt->execute([':user_id' => $userId]);
    $sessions = $stmt->fetchAll();

    return array_map(function($session) {
        return [
            'id_session' => (int)$session['id_session'],
            'ip_address' => $session['adresse_ip'],
            'user_agent' => $session['u
 */
function security_logout_session(PDO $pdo, int $userId, int $sessionId): void
{
    // Vérifier que la session appartient à l'utilisateur
    $stmt = $pdo->prepare('SELECT 1 FROM Session WHERE id_session = :session_id AND id_user = :user_id');
    $stmt->execute([':session_id' => $sessionId, ':user_id' => $userId]);
    
    if (!$stmt->fetch()) {
        gp_send_json(403, ['message' => 'Session non autorisée']);
    }

    // Marquer la session comme inactive
    $stmt = $pdo->prepare('UPDATE Session SET active = false WHERE id_session = :session_id');
    $stmt->execute([':session_id' => $sessionId]);
 * Termine une session de l'utilisateur (placeholder)
 */
function security_logout_session(PDO $pdo, int $userId, string $sessionId): void
{
    // Placeholder: pas de vrai système de sessions pour l'instant
    // Cette fonction simule une déconnexion d'une session
    // À améliorer avec un vrai système de suivi de sessions
}

// Routage des requêtes
$method = $_SERVER['REQUEST_METHOD'] ?? '';
$action = $_GET['action'] ?? '';

try {
    $pdo = gp_pdo($config);
    
    // Authentification requise
    $token = gp_get_bearer_token();
    if ($token === '') {
        gp_send_json(401, ['message' => 'Token manquant']);
    }

    try {
        $payload = gp_jwt_verify($token, $config['jwt']);
    } catch (Throwable $e) {
        gp_send_json(401, ['message' => 'Token invalide']);
    }

    $userId = (int)$payload['sub'];

    if ($method === 'GET' && $action === 'info') {
        $info = security_get_info($pdo, $userId);
        gp_send_json(200, ['security' => $info]);
    } elseif ($method === 'GET' && $action === 'sessions') {
        $sessions = security_get_sessions($pdo, $userId);
        gp_send_json(200, ['sessions' => $sessions]);
    } elseif ($method === 'POST' && $action === 'change-password') {
        $body = gp_read_json_body();
        
        if (empty($body['currentPassword']) || empty($body['newPassword'])) {
            gp_send_json(400, ['message' => 'Données manquantes']);
        }

        security_change_password($pdo, $userId, $body['currentPassword'], $body['newPassword']);
        gp_send_json(200, ['message' => 'Mot de passe modifié avec succès']);
    } elseif ($method === 'POST' && $action === 'toggle-2fa') {
        $body = gp_read_json_body();
        $enable = $body['enable'] ?? false;
        
        $result = security_toggle_2fa($pdo, $userId, (bool)$enable);
        gp_send_json(200, $result);
    } elseif ($method === 'POST' && $action === 'logout-session') {
        $body = gp_read_json_body();
        
        if (empty($body['sessionId'])) {
            gp_send_json(400, ['message' => 'Session ID requis']);
        }

        security_logout_session($pdo, $userId, $body['sessionId']);
        gp_send_json(200, ['message' => 'Session terminée']);
    } else {
        gp_send_json(405, ['message' => 'Méthode ou action non autorisée']);
    }
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
?>
