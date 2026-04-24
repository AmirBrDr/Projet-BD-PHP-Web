-- Migration: Ajouter le suivi du dernier changement de mot de passe
-- Date: 2026-04-22

-- Ajouter une colonne pour tracer quand le mot de passe a été changé (si elle n'existe pas)
ALTER TABLE Utilisateur 
ADD COLUMN IF NOT EXISTS dernierchangementmdp DATE DEFAULT CURRENT_DATE;

-- Remplir la colonne avec la date d'inscription pour les utilisateurs existants
UPDATE Utilisateur SET dernierchangementmdp = inscriptionUser WHERE dernierchangementmdp IS NULL;
