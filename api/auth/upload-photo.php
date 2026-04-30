<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$token = gp_get_bearer_token();
if ($token === '') {
    gp_send_json(401, ['message' => 'Token manquant']);
}

try {
    $claims = gp_jwt_verify($token, $config['jwt']);
} catch (Throwable $e) {
    gp_send_json(401, ['message' => 'Token invalide']);
}

$file = $_FILES['photo'] ?? null;
if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK || $file['size'] === 0) {
    gp_send_json(400, ['message' => 'Aucun fichier reçu']);
}

$allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
$detectedMime = mime_content_type($file['tmp_name']);
if (!in_array($detectedMime, $allowedMime, true)) {
    gp_send_json(400, ['message' => 'Type de fichier non autorisé (jpeg, png, webp uniquement)']);
}
if ($file['size'] > 2 * 1024 * 1024) {
    gp_send_json(400, ['message' => 'Photo trop volumineuse (2 Mo max)']);
}

$extMap   = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$ext      = $extMap[$detectedMime] ?? 'jpg';
$userId   = (int) $claims['sub'];
$filename = 'pdp_' . $userId . '_' . uniqid('', true) . '.' . $ext;

$uploadDir = __DIR__ . '/../../public/image/pdp/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$pdo = gp_pdo($config);

// Supprimer l'ancienne photo si elle existe
$stmt = $pdo->prepare("SELECT pdpUser FROM Utilisateur WHERE Id_User = :id");
$stmt->execute([':id' => $userId]);
$row = $stmt->fetch();
if ($row && !empty($row['pdpuser'])) {
    $oldPath = __DIR__ . '/../../public' . $row['pdpuser'];
    if (is_file($oldPath)) {
        @unlink($oldPath);
    }
}

if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
    gp_send_json(500, ['message' => "Impossible d'enregistrer la photo"]);
}

$photoPath = '/image/pdp/' . $filename;
$stmt = $pdo->prepare("UPDATE Utilisateur SET pdpUser = :photo WHERE Id_User = :id");
$stmt->execute([':photo' => $photoPath, ':id' => $userId]);

gp_send_json(200, ['photo' => $photoPath]);
