<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * Tests pour api/lib/auth.php
 */
class AuthTest extends TestCase
{
    private array $jwtConfig;

    protected function setUp(): void
    {
        parent::setUp();
        // Configuration de test isolée pour le JWT
        $this->jwtConfig = [
            'secret' => 'test_secret_for_phpunit',
            'issuer' => 'greenpulse.test',
            'ttl_seconds' => 3600
        ];
    }

    /** @test */
    public function password_reset_sign_genere_un_token_avec_le_bon_purpose()
    {
        // Arrange
        $claims = ['email' => 'test@greenpulse.fr', 'user_id' => 42];

        // Act
        $token = gp_password_reset_sign($claims, $this->jwtConfig);
        $payload = gp_jwt_verify($token, $this->jwtConfig);

        // Assert
        $this->assertNotEmpty($token);
        $this->assertEquals('password_reset', $payload['purpose']);
        $this->assertEquals('test@greenpulse.fr', $payload['email']);
    }

    /** @test */
    public function password_reset_verify_rejette_un_token_sans_le_bon_purpose()
    {
        // Logique métier : Un attaquant ne doit pas pouvoir utiliser un token d'accès standard
        $tokenStandard = gp_jwt_sign(['email' => 'hacker@greenpulse.fr'], $this->jwtConfig);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Token de réinitialisation invalide');
        
        gp_password_reset_verify($tokenStandard, $this->jwtConfig);
    }

    /** @test */
    public function normalize_role_enleve_les_espaces_et_met_en_minuscules()
    {
        // Arrange & Act
        $role1 = gp_normalize_role('  Admin  ');
        $role2 = gp_normalize_role('EMPLOYE');
        $role3 = gp_normalize_role(' aNiMaTeuR ');

        // Assert
        $this->assertEquals('admin', $role1);
        $this->assertEquals('employe', $role2);
        $this->assertEquals('animateur', $role3);
    }
    
    /** @test */
    public function is_valid_role_accepte_seulement_les_roles_autorises()
    {
        // Assert - Doit accepter
        $this->assertTrue(gp_is_valid_role('employe'));
        $this->assertTrue(gp_is_valid_role('ADMIN')); 
        
        // Assert - Doit rejeter
        $this->assertFalse(gp_is_valid_role('manager'));
        $this->assertFalse(gp_is_valid_role(''));
        $this->assertFalse(gp_is_valid_role(' null '));
    }

    /** @test */
    public function is_valid_role_gere_les_cas_limites()
    {
        // Test de chaînes très longues ou caractères spéciaux
        $this->assertFalse(gp_is_valid_role('employe ' . str_repeat('a', 1000)));
        $this->assertFalse(gp_is_valid_role('admin!'));
    }
}
