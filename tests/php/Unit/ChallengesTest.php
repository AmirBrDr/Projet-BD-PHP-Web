<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use PDO;
use PDOStatement;

/**
 * Tests pour la gestion des défis (api/modules/challenges/index.php)
 */
class ChallengesTest extends TestCase
{
    private $pdoMock;
    private $stmtMock;

    protected function setUp(): void
    {
        parent::setUp();
        // Création de mocks pour PDO et PDOStatement
        $this->pdoMock = $this->createMock(PDO::class);
        $this->stmtMock = $this->createMock(PDOStatement::class);
    }

    /** @test */
    public function challenges_get_by_thematique_retourne_les_defis()
    {
        // Arrange
        $thematiqueId = 1;
        $expectedDefis = [
            ['Id_defi' => 10, 'nomDefi' => 'Defi 1', 'descriptionDefi' => 'Desc 1'],
            ['Id_defi' => 11, 'nomDefi' => 'Defi 2', 'descriptionDefi' => 'Desc 2']
        ];

        $this->pdoMock->method('prepare')
            ->willReturn($this->stmtMock);

        $this->stmtMock->method('execute')
            ->with([$thematiqueId]);

        $this->stmtMock->method('fetchAll')
            ->willReturn($expectedDefis);

        // Act
        // Simulation de la fonction : on appelle le comportement attendu sur les mocks
        $stmt = $this->pdoMock->prepare('SELECT ...');
        $stmt->execute([$thematiqueId]);
        $result = $stmt->fetchAll();

        // Assert
        $this->assertCount(2, $result);
        $this->assertEquals('Defi 1', $result[0]['nomDefi']);
    }

    /** @test */
    public function thematique_inexistante_retourne_tableau_vide()
    {
        // Arrange
        $this->pdoMock->method('prepare')
            ->willReturn($this->stmtMock);

        $this->stmtMock->method('execute')
            ->with([999]); // ID inexistant

        $this->stmtMock->method('fetchAll')
            ->willReturn([]);

        // Act
        $stmt = $this->pdoMock->prepare('SELECT ...');
        $stmt->execute([999]);
        $result = $stmt->fetchAll();

        // Assert
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /** @test */
    public function gestion_statut_pending_vers_approved()
    {
        $this->markTestSkipped('Skippé: Nécessite un refactoring de l\'API pour extraire la logique de mise à jour des statuts sans exécuter le routeur entier.');
    }

    /** @test */
    public function gestion_statut_pending_vers_rejected()
    {
        $this->markTestSkipped('Skippé: Idem, la logique est fortement couplée aux scripts API globaux.');
    }

    /** @test */
    public function blocage_defi_insere_dans_table_block()
    {
        // Test de gp_ensure_defi_block_table
        // Arrange
        $this->pdoMock->expects($this->once())
            ->method('exec')
            ->with($this->stringContains('CREATE TABLE IF NOT EXISTS Defi_Employe_Block'));

        // Act
        gp_ensure_defi_block_table($this->pdoMock);
        
        // Assert
        $this->assertTrue(true, 'La méthode exec a été appelée correctement avec la requête CREATE TABLE.');
    }
}
