-- Migration 008 : Ajouter mois à Valider pour cloisonner les validations par mois
-- Problème : PK (Id_defi, Id_actions, Id_Employe) empêche un employé de revalider
-- un défi réutilisé dans un mois ultérieur.
-- Solution : étendre la PK avec mois (= Regroupe.mois de l'activation mensuelle).

ALTER TABLE Valider ADD COLUMN mois DATE;
UPDATE Valider SET mois = date_trunc('month', date_validation)::DATE;
ALTER TABLE Valider ALTER COLUMN mois SET NOT NULL;
ALTER TABLE Valider DROP CONSTRAINT pk_Valider;
ALTER TABLE Valider ADD CONSTRAINT pk_Valider
    PRIMARY KEY (Id_defi, Id_Employe, mois);
