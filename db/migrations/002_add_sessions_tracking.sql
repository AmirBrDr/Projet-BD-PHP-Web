-- Migration: Ajouter le suivi des sessions et dernière connexion
-- Date: 2026-04-22

-- Ajouter colonne pour la dernière connexion
ALTER TABLE Utilisateur 
ADD COLUMN IF NOT EXISTS derniereconnexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Créer la table pour les sessions
CREATE TABLE IF NOT EXISTS Session (
    id_session SERIAL PRIMARY KEY,
    id_user INT NOT NULL CONSTRAINT fk_Session_User REFERENCES Utilisateur(Id_User) ON DELETE CASCADE,
    adresse_ip VARCHAR(45),
    user_agent TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_activite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true
);

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_session_user ON Session(id_user);
CREATE INDEX IF NOT EXISTS idx_session_active ON Session(active);
