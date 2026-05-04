<?php

// Fichier: api/lib/db.php - API et logique serveur.

declare(strict_types=1);

function gp_pdo(array $config): PDO
{
    $db = $config['db'];
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $db['host'], $db['port'], $db['name']);

    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec("SET client_encoding = 'WIN1252'");
    return $pdo;
<<<<<<< HEAD
}

function gp_ensure_defi_block_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS Defi_Employe_Block (
            Id_defi INT NOT NULL REFERENCES Defi(Id_defi),
            Id_Employe INT NOT NULL REFERENCES Employe(Id_Employe),
            Id_Animateur INT NOT NULL REFERENCES Animateur(Id_Animateur),
            motif TEXT,
            date_blocage TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (Id_defi, Id_Employe)
        )'
    );
}

function gp_ensure_replies_table(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS Reponse_Defi (
            Id_reponse              SERIAL PRIMARY KEY,
            Id_defi                 INT NOT NULL REFERENCES Defi(Id_defi),
            Id_Employe              INT NOT NULL REFERENCES Employe(Id_Employe),
            Id_actions              INT,
            reponse_text            TEXT NOT NULL,
            statut_reponse          VARCHAR(20) NOT NULL DEFAULT \'pending\' CHECK (statut_reponse IN (\'pending\', \'approved\', \'rejected\')),
            commentaire_animateur   TEXT,
            date_reponse            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            date_traitement         TIMESTAMP,
            Id_Animateur_traitement INT REFERENCES Animateur(Id_Animateur)
        )'
    );

    $pdo->exec('ALTER TABLE Reponse_Defi ADD COLUMN IF NOT EXISTS Id_actions INT');

    $pdo->exec(
        "DO $$ BEGIN\n"
        . "    IF NOT EXISTS (\n"
        . "        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reponse_defi_action'\n"
        . "    ) THEN\n"
        . "        ALTER TABLE Reponse_Defi\n"
        . "        ADD CONSTRAINT fk_Reponse_Defi_Action\n"
        . "        FOREIGN KEY (Id_defi, Id_actions)\n"
        . "        REFERENCES Faire_partie (Id_defi, Id_actions);\n"
        . "    END IF;\n"
        . "END $$;"
    );
}
=======
}
>>>>>>> c88b0ba8662b03677f9c6619cf18e11559e1891d
