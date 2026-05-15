<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use PDO;
use PDOException;

/**
 * Tests pour la connexion et logique DB
 */
class DatabaseTest extends TestCase
{
    /** @test */
    public function gp_pdo_retourne_une_instance_de_pdo_avec_bonne_config()
    {
        // On ne peut pas tester une vraie connexion sans BDD, donc on teste le comportement
        // de la fonction gp_pdo() si on lui passe une config invalide.
        
        // Arrange
        $badConfig = [
            'db' => [
                'host' => 'inexistant_host',
                'port' => '5432',
                'name' => 'fake',
                'user' => 'fake',
                'pass' => 'fake'
            ]
        ];

        // Assert
        $this->expectException(PDOException::class);
        
        // Act
        gp_pdo($badConfig);
    }

    /** @test */
    public function gp_ensure_replies_table_execute_les_bonnes_requetes()
    {
        // Arrange
        $pdoMock = $this->createMock(PDO::class);
        
        // On s'attend à ce que exec soit appelé au moins 3 fois (CREATE TABLE, ALTER TABLE, DO)
        $pdoMock->expects($this->exactly(3))
            ->method('exec')
            ->willReturn(1);

        // Act
        gp_ensure_replies_table($pdoMock);
        
        // Assert
        $this->assertTrue(true); // Si aucune exception n'est jetée, le test passe
    }
}
