-- Migration 005 : Ajout de la table Appartenir
-- Catalogue : lien many-to-many entre Defi et Thematique sans date ni ordre.
-- Un défi peut appartenir à plusieurs thématiques dans le catalogue.

CREATE TABLE IF NOT EXISTS Appartenir (
    Id_defi       INT CONSTRAINT fk_Appartenir_Defi       REFERENCES Defi(Id_defi),
    Id_thematique INT CONSTRAINT fk_Appartenir_Thematique REFERENCES Thematique(Id_thematique),
    CONSTRAINT pk_Appartenir PRIMARY KEY (Id_defi, Id_thematique)
);
