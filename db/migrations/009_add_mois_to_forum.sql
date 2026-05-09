-- Migration 009 : Ajouter mois à Forum pour cloisonner les discussions par mois
-- Problème : Forum.Id_defi seul ne distingue pas les instances mensuelles d'un
-- même défi réutilisé. Deux mois partageaient le même fil de discussion.
-- Solution : ajouter mois (= Regroupe.mois du mois actif) et un index unique
-- partiel sur (Id_defi, mois) pour les forums liés à un défi.

ALTER TABLE Forum ADD COLUMN mois DATE;
UPDATE Forum SET mois = date_trunc('month', CURRENT_DATE)::DATE WHERE Id_defi IS NOT NULL;
CREATE UNIQUE INDEX u_forum_defi_mois ON Forum (Id_defi, mois) WHERE Id_defi IS NOT NULL;
