-- Migration 006 : Scoper la contrainte UNIQUE et le trigger d'ordre par mois
-- Problème : u_ordre_thematique et fn_check_ordre_consecutif ignoraient le mois,
-- empêchant de réutiliser les mêmes numéros d'ordre pour une thématique sur un nouveau mois.

-- 1. Remplacer la contrainte UNIQUE (Id_thematique, ordre) par (Id_thematique, ordre, mois)
ALTER TABLE Regroupe DROP CONSTRAINT u_ordre_thematique;
ALTER TABLE Regroupe ADD CONSTRAINT u_ordre_thematique_mois
    UNIQUE (Id_thematique, ordre, mois);

-- 2. Mettre à jour la fonction pour filtrer par mois
CREATE OR REPLACE FUNCTION fn_check_ordre_consecutif()
RETURNS TRIGGER AS $$
DECLARE
    v_max_ordre INT;
BEGIN
    SELECT COALESCE(MAX(ordre), 0)
    INTO   v_max_ordre
    FROM   Regroupe
    WHERE  Id_thematique = NEW.Id_thematique
      AND  date_trunc('month', mois) = date_trunc('month', NEW.mois);

    IF NEW.ordre <> v_max_ordre + 1 THEN
        RAISE EXCEPTION
            'L''ordre % est invalide pour la thématique %. L''ordre attendu est %.',
            NEW.ordre, NEW.Id_thematique, v_max_ordre + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
