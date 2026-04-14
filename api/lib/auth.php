<?php

declare(strict_types=1);

function gp_normalize_role(string $role): string
{
    return strtolower(trim($role));
}

function gp_is_valid_role(string $role): bool
{
    return in_array(gp_normalize_role($role), ['employe', 'admin', 'animateur'], true);
}

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

function gp_password_reset_sign(array $claims, array $jwtConfig): string
{
    return gp_jwt_sign(array_merge([
        'purpose' => 'password_reset',
    ], $claims), $jwtConfig);
}

function gp_password_reset_verify(string $token, array $jwtConfig): array
{
    $payload = gp_jwt_verify($token, $jwtConfig);

    if (($payload['purpose'] ?? '') !== 'password_reset') {
        throw new RuntimeException('Token de réinitialisation invalide');
    }

    return $payload;
}
