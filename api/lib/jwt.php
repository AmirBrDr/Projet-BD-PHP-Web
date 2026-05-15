<?php

// Fichier: api/lib/jwt.php - API et logique serveur.

declare(strict_types=1);

// Helpers JWT avec encodage Base64URL conforme RFC 7515
/**
 * Encode en Base64URL sans padding.
 */
function gp_b64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Decode Base64URL en ajoutant le padding manquant.
 */
function gp_b64url_decode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

/**
 * Signe un JWT HS256 avec claims standards et personnalisables.
 */
function gp_jwt_sign(array $claims, array $jwtConfig): string
{
    $now = time();
    $payload = array_merge([
        'iss' => $jwtConfig['issuer'] ?? 'greenpulse',
        'aud' => $jwtConfig['audience'] ?? 'greenpulse',
        'iat' => $now,
        'exp' => $now + (int)($jwtConfig['ttl_seconds'] ?? 3600),
    ], $claims);

    $header = ['typ' => 'JWT', 'alg' => 'HS256'];

    $h = gp_b64url_encode(json_encode($header, JSON_UNESCAPED_UNICODE));
    $p = gp_b64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));

    $sig = hash_hmac('sha256', $h . '.' . $p, (string)$jwtConfig['secret'], true);
    $s = gp_b64url_encode($sig);

    return $h . '.' . $p . '.' . $s;
}

/**
 * Verifie un JWT HS256 (signature + expiration).
 *
 * @throws RuntimeException Si le token est invalide.
 */
function gp_jwt_verify(string $token, array $jwtConfig): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new RuntimeException('Token invalide');
    }

    [$h, $p, $s] = $parts;
    $expected = gp_b64url_encode(hash_hmac('sha256', $h . '.' . $p, (string)$jwtConfig['secret'], true));

    if (!hash_equals($expected, $s)) {
        throw new RuntimeException('Signature invalide');
    }

    $payloadRaw = gp_b64url_decode($p);
    $payload = json_decode($payloadRaw, true);
    if (!is_array($payload)) {
        throw new RuntimeException('Token invalide');
    }

    $now = time();
    if (isset($payload['exp']) && is_numeric($payload['exp']) && $now > (int)$payload['exp']) {
        throw new RuntimeException('Token expiré');
    }

    return $payload;
}

/**
 * Extrait le token Bearer depuis l'en-tete Authorization.
 */
function gp_get_bearer_token(): string
{
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$hdr) {
        return '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', $hdr, $m)) {
        return trim($m[1]);
    }
    return '';
}
