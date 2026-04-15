<?php

// Fichier: api/modules/moderation/index.php - API et logique serveur.
/**
 * moderation Module
 * Handles moderation related operations
 */

require_once __DIR__ . '/../../bootstrap.php';

// TODO: Implement moderation endpoints

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'module' => 'moderation',
    'message' => 'Module moderation endpoints pending implementation'
]);
?>
