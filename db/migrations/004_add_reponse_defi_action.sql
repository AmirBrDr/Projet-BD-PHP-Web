ALTER TABLE Reponse_Defi ADD COLUMN IF NOT EXISTS Id_actions INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reponse_defi_action'
    ) THEN
        ALTER TABLE Reponse_Defi
        ADD CONSTRAINT fk_Reponse_Defi_Action
        FOREIGN KEY (Id_defi, Id_actions)
        REFERENCES Faire_partie (Id_defi, Id_actions);
    END IF;
END $$;
