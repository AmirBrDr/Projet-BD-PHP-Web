-- Migration: Changer le type de la colonne datemessage de la table message
-- Date: 2026-05-02
-- Description: Change le type et le default value

ALTER TABLE "message" ALTER COLUMN "datemessage" TYPE TIMESTAMP USING "datemessage"::TIMESTAMP;
ALTER TABLE "message" ALTER COLUMN "datemessage" SET DEFAULT CURRENT_TIMESTAMP;
