-- Nettoyage complet avec reset des sequences
DELETE FROM Regroupe;
DELETE FROM Defi;
DELETE FROM Thematique;

ALTER SEQUENCE defi_id_defi_seq RESTART WITH 1;
ALTER SEQUENCE thematique_id_thematique_seq RESTART WITH 1;

-- Thematiques
INSERT INTO Thematique (nomTheme, descriptionTheme) VALUES 
('Mobilite', 'Reduire impact carbone des deplacements'),
('Energie', 'Economiser energie au bureau'),
('Dechets', 'Reduire et trier les dechets'),
('Alimentation', 'Manger plus responsable');

-- Defis
INSERT INTO Defi (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi, Id_Animateur) VALUES
('Zero Voiture', 'Venez au travail en transport doux cette semaine', 100, 15, 1, 1),
('Covoiturage Express', 'Organisez un covoiturage avec un collegue', 75, 10, 2, 1),
('Velo Challenge', 'Venez au bureau a velo 3 jours de suite', 150, 20, 3, 1),
('Eteins la lumiere', 'Eteignez les lumieres en quittant une piece', 50, 8, 1, 1),
('Mode Veille Interdit', 'Ne laissez aucun appareil en veille le soir', 60, 10, 2, 1),
('Thermostat Eco', 'Reduisez le chauffage de 1 degre cette semaine', 80, 12, 3, 1),
('Lunch zero dechet', 'Apportez votre repas sans emballage plastique', 75, 5, 1, 1),
('Semaine sans plastique', 'Aucun plastique usage unique cette semaine', 120, 8, 2, 1),
('Tri Master', 'Triez correctement vos dechets pendant 5 jours', 90, 6, 3, 1),
('Repas Veggie', 'Mangez vegetarien le midi toute la semaine', 80, 12, 1, 1),
('Local et Saison', 'Achetez uniquement des produits locaux de saison', 100, 15, 2, 1),
('Zero Gaspi', 'Ne jetez aucun aliment cette semaine', 110, 10, 3, 1);

-- Regroupe (Mobilite = 1)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES
(1, 1, DATE_TRUNC('month', CURRENT_DATE), 1),
(2, 1, DATE_TRUNC('month', CURRENT_DATE), 2),
(3, 1, DATE_TRUNC('month', CURRENT_DATE), 3);

-- Regroupe (Energie = 2)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES
(4, 2, DATE_TRUNC('month', CURRENT_DATE), 1),
(5, 2, DATE_TRUNC('month', CURRENT_DATE), 2),
(6, 2, DATE_TRUNC('month', CURRENT_DATE), 3);

-- Regroupe (Dechets = 3)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES
(7, 3, DATE_TRUNC('month', CURRENT_DATE), 1),
(8, 3, DATE_TRUNC('month', CURRENT_DATE), 2),
(9, 3, DATE_TRUNC('month', CURRENT_DATE), 3);

-- Regroupe (Alimentation = 4)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES
(10, 4, DATE_TRUNC('month', CURRENT_DATE), 1),
(11, 4, DATE_TRUNC('month', CURRENT_DATE), 2),
(12, 4, DATE_TRUNC('month', CURRENT_DATE), 3);

-- Actions
INSERT INTO Actions (nomAction, descriptionAction) VALUES
('Venir a velo', 'Utiliser le velo pour venir au travail'),
('Venir a pied', 'Marcher pour venir au travail'),
('Transports en commun', 'Utiliser bus, metro ou tram');

-- Lier actions au defi 1
INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES
(1, 1), (1, 2), (1, 3);

-- Forum pour le defi 1
INSERT INTO Forum (nomForum, descriptionForum, Id_defi) VALUES
('Forum Zero Voiture', 'Echangez vos conseils sur la mobilite douce', 1);

-- Actions pour tous les defis
INSERT INTO Actions (nomAction, descriptionAction) VALUES
('Eteindre ecran', 'Eteignez votre ecran pendant la pause'),
('Debrancher chargeur', 'Debranchez les chargeurs inutilises'),
('Thermostat reduit', 'Reduisez le thermostat de 1 degre'),
('Trier papier', 'Triez vos papiers dans la bonne poubelle'),
('Refuser sac plastique', 'Refusez les sacs plastiques a usage unique'),
('Compost bureau', 'Utilisez le compost du bureau'),
('Repas sans viande', 'Mangez sans viande le midi'),
('Fruits locaux', 'Choisissez des fruits locaux au dejeuner'),
('Eviter gaspillage', 'Finissez votre assiette sans jeter');

-- Defis Energie (4,5,6)
INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES
(4, 4), (4, 5), (4, 6),
(5, 4), (5, 5),
(6, 6);

-- Defis Dechets (7,8,9)
INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES
(7, 7), (7, 8),
(8, 7), (8, 9),
(9, 7), (9, 8), (9, 9);

-- Defis Alimentation (10,11,12)
INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES
(10, 10), (10, 11),
(11, 11), (11, 12),
(12, 10), (12, 12);

-- Forums pour tous les defis
INSERT INTO Forum (nomForum, descriptionForum, Id_defi) VALUES
('Forum Covoiturage', 'Partagez vos experiences de covoiturage', 2),
('Forum Velo', 'Conseils et astuces pour venir a velo', 3),
('Forum Lumieres', 'Economisez energie au bureau', 4),
('Forum Veille', 'Reduire la consommation des appareils', 5),
('Forum Thermostat', 'Optimiser le chauffage ensemble', 6),
('Forum Lunch', 'Partagez vos idees repas zero dechet', 7),
('Forum Plastique', 'Alternatives au plastique usage unique', 8),
('Forum Tri', 'Guide du tri selectif au bureau', 9),
('Forum Veggie', 'Recettes et conseils vegetariens', 10),
('Forum Local', 'Producteurs locaux recommandes', 11),
('Forum Gaspi', 'Astuces anti-gaspillage alimentaire', 12);