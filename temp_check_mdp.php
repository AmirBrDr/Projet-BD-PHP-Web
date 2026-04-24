<?php
require 'api/config.local.php';
require 'api/lib/db.php';

try {
    $pdo = gp_pdo($config);
    
    echo "=== Step 1: Check current mdp column length ===\n";
    $stmt = $pdo->query("SELECT character_maximum_length FROM information_schema.columns WHERE table_name = 'utilisateur' AND column_name = 'mdp';");
    $result = $stmt->fetch();
    echo "Current length: " . ($result['character_maximum_length'] ?: 'NULL') . "\n\n";
    
    if ($result['character_maximum_length'] == 255) {
        echo "=== Step 2: Expanding mdp column to VARCHAR(500) ===\n";
        $pdo->exec("ALTER TABLE utilisateur ALTER COLUMN mdp TYPE VARCHAR(500);");
        echo "Column expanded successfully.\n\n";
        
        echo "=== Step 3: Verify the change ===\n";
        $stmt = $pdo->query("SELECT character_maximum_length FROM information_schema.columns WHERE table_name = 'utilisateur' AND column_name = 'mdp';");
        $result = $stmt->fetch();
        echo "New length: " . ($result['character_maximum_length'] ?: 'NULL') . "\n";
    } else {
        echo "Column is not VARCHAR(255), skipping expansion.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
