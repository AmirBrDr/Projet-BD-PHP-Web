-- Migration 010 : Corriger la PK de Valider
-- Problème : PK (Id_defi, Id_actions, Id_Employe, mois) autorise plusieurs
-- validations d'un même défi par un même employé dans le même mois via
-- des actions différentes.
-- Solution : réduire la PK à (Id_defi, Id_Employe, mois) — une seule
-- validation par défi par employé par mois, quelle que soit l'action.

-- Étape 1 : supprimer les doublons
-- Pour chaque groupe (Id_defi, Id_Employe, mois), on garde la ligne
-- avec la date_validation la plus récente ; en cas d'égalité, le plus
-- grand Id_actions.
WITH ranked AS (
    SELECT ctid,
           ROW_NUMBER() OVER (
               PARTITION BY Id_defi, Id_Employe, mois
               ORDER BY date_validation DESC, Id_actions DESC
           ) AS rn
    FROM Valider
)
DELETE FROM Valider
WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1);

-- Étape 2 : remplacer la PK
ALTER TABLE Valider DROP CONSTRAINT pk_Valider;
ALTER TABLE Valider ADD CONSTRAINT pk_Valider
    PRIMARY KEY (Id_defi, Id_Employe, mois);
