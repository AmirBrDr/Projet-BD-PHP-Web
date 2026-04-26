-- Migration: Augmenter la taille de la colonne iconeBadge pour supporter le base64
-- Date: 2026-04-23
-- Description: Change iconeBadge de VARCHAR(255) à TEXT pour supporter les icônes en base64

ALTER TABLE Badge
ALTER COLUMN iconeBadge SET DATA TYPE TEXT;
