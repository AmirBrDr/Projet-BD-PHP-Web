ALTER TABLE utilisateur ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE utilisateur ADD COLUMN two_factor_code VARCHAR(255);
ALTER TABLE utilisateur ADD COLUMN two_factor_expires_at TIMESTAMP;
