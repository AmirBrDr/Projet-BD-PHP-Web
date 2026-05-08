-- Migration 007 : Étendre la PK de Regroupe pour inclure mois
-- Problème : pk_Regroupe (Id_defi, Id_thematique) empêche de réutiliser
-- un défi dans la même thématique sur un mois différent (erreur 23505).
-- Solution : la PK inclut désormais mois, garantissant l'unicité par mois.

ALTER TABLE Regroupe DROP CONSTRAINT pk_Regroupe;
ALTER TABLE Regroupe ADD CONSTRAINT pk_Regroupe PRIMARY KEY (Id_defi, Id_thematique, mois);
