<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * Tests pour api/lib/jwt.php
 */
class JwtTest extends TestCase
{
    private array $jwtConfig;

    protected function setUp(): void
    {
        parent::setUp();
        $this->jwtConfig = [
            'secret' => 'super_secret_test_key_123',
            'issuer' => 'greenpulse.test',
            'ttl_seconds' => 3600
        ];
    }

    /** @test */
    public function jwt_sign_genere_un_token_valide_avec_claims()
    {
        // Arrange
        $claims = ['user_id' => 99, 'role' => 'admin'];

        // Act
        $token = gp_jwt_sign($claims, $this->jwtConfig);
        $payload = gp_jwt_verify($token, $this->jwtConfig);

        // Assert
        $this->assertNotEmpty($token);
        $this->assertEquals(99, $payload['user_id']);
        $this->assertEquals('admin', $payload['role']);
        $this->assertEquals('greenpulse.test', $payload['iss']);
        $this->assertTrue(isset($payload['exp']));
    }

    /** @test */
    public function jwt_verify_rejette_un_token_modifie()
    {
        // Arrange
        $token = gp_jwt_sign(['user_id' => 1], $this->jwtConfig);
        
        // Falsification du payload
        $parts = explode('.', $token);
        $fakePayload = base64_encode(json_encode(['user_id' => 1, 'role' => 'admin']));
        $fakeToken = $parts[0] . '.' . $fakePayload . '.' . $parts[2];

        // Assert
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Signature invalide');
        
        // Act
        gp_jwt_verify($fakeToken, $this->jwtConfig);
    }

    /** @test */
    public function jwt_verify_rejette_un_token_expire()
    {
        // Arrange : TTL négatif pour forcer l'expiration
        $configExpiree = $this->jwtConfig;
        $configExpiree['ttl_seconds'] = -3600; 

        $token = gp_jwt_sign(['user_id' => 1], $configExpiree);

        // Assert
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Token expiré');
        
        // Act
        gp_jwt_verify($token, $this->jwtConfig);
    }

    /** @test */
    public function jwt_verify_rejette_un_token_malforme()
    {
        // Arrange
        $tokenMalforme = 'header.payload'; // Il manque la signature

        // Assert
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Token invalide');
        
        // Act
        gp_jwt_verify($tokenMalforme, $this->jwtConfig);
    }

    /** @test */
    public function b64url_encode_et_decode_fonctionnent_symetriquement()
    {
        // Arrange
        $data = "Data avec des caractères spéciaux : / + = ?";

        // Act
        $encoded = gp_b64url_encode($data);
        $decoded = gp_b64url_decode($encoded);

        // Assert
        $this->assertStringNotContainsString('+', $encoded);
        $this->assertStringNotContainsString('/', $encoded);
        $this->assertStringNotContainsString('=', $encoded);
        $this->assertEquals($data, $decoded);
    }

    /** @test */
    public function get_bearer_token_extrait_correctement_le_token()
    {
        // Arrange
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer my_test_token_123';

        // Act
        $token = gp_get_bearer_token();

        // Assert
        $this->assertEquals('my_test_token_123', $token);

        // Nettoyage
        unset($_SERVER['HTTP_AUTHORIZATION']);
    }
}
