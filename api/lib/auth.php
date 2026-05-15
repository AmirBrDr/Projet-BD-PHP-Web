<?php

// Fichier: api/lib/auth.php - API et logique serveur.

declare(strict_types=1);

/**
 * Normalise un role utilisateur (casse, espaces).
 */
function gp_normalize_role(string $role): string
{
    return strtolower(trim($role));
}

/**
 * Valide qu'un role appartient a l'ensemble autorise.
 */
function gp_is_valid_role(string $role): bool
{
    return in_array(gp_normalize_role($role), ['employe', 'admin', 'animateur'], true);
}

/**
 * Insere l'utilisateur dans la table de role correspondante.
 *
 * @throws InvalidArgumentException Si le role est invalide.
 */
function gp_insert_user_role(PDO $pdo, int $userId, string $role): void
{
    $normalizedRole = gp_normalize_role($role);

    switch ($normalizedRole) {
        case 'employe':
            $stmt = $pdo->prepare('INSERT INTO Employe (Id_Employe) VALUES (:id)');
            break;
        case 'admin':
            $stmt = $pdo->prepare('INSERT INTO Admin (Id_Admin) VALUES (:id)');
            break;
        case 'animateur':
            $stmt = $pdo->prepare('INSERT INTO Animateur (Id_Animateur) VALUES (:id)');
            break;
        default:
            throw new InvalidArgumentException('Rôle utilisateur invalide');
    }

    $stmt->execute([':id' => $userId]);
}

/**
 * Determine le role d'un utilisateur a partir des tables de roles.
 */
function gp_resolve_user_role(PDO $pdo, int $userId): ?string
{
    $checks = [
        ['role' => 'employe', 'sql' => 'SELECT 1 FROM Employe WHERE Id_Employe = :id LIMIT 1'],
        ['role' => 'admin', 'sql' => 'SELECT 1 FROM Admin WHERE Id_Admin = :id LIMIT 1'],
        ['role' => 'animateur', 'sql' => 'SELECT 1 FROM Animateur WHERE Id_Animateur = :id LIMIT 1'],
    ];

    foreach ($checks as $check) {
        $stmt = $pdo->prepare($check['sql']);
        $stmt->execute([':id' => $userId]);

        if ($stmt->fetch()) {
            return $check['role'];
        }
    }

    return null;
}

/**
 * Signe un JWT de reinitialisation avec un claim purpose explicite.
 */
function gp_password_reset_sign(array $claims, array $jwtConfig): string
{
    return gp_jwt_sign(array_merge([
        'purpose' => 'password_reset',
    ], $claims), $jwtConfig);
}

/**
 * Verifie un token de reinitialisation et son claim purpose.
 *
 * @throws RuntimeException Si le token est invalide.
 */
function gp_password_reset_verify(string $token, array $jwtConfig): array
{
    $payload = gp_jwt_verify($token, $jwtConfig);

    if (($payload['purpose'] ?? '') !== 'password_reset') {
        throw new RuntimeException('Token de réinitialisation invalide');
    }

    return $payload;
}
