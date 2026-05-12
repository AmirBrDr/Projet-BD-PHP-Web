-- Défi 10 (Repas Veggie)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(10, 30, 6,  '2026-05-10', '2026-05-01', 'Plat partagé avec l''équipe'),
(10, 29, 8,  '2026-05-10', '2026-05-01', 'Nouvelle recette testée'),
(10, 30, 10, '2026-05-10', '2026-05-01', 'Plat partagé'),
(10, 29, 19, '2026-05-10', '2026-05-01', 'Recette testée'),
(10, 28, 22, '2026-05-10', '2026-05-01', 'Repas veggie'),
(10, 29, 35, '2026-05-10', '2026-05-01', 'Recette nouvelle'),
(10, 30, 38, '2026-05-10', '2026-05-01', 'Plat partagé collègues'),
(10, 28, 49, '2026-05-10', '2026-05-01', 'Menu végé'),
(10, 29, 54, '2026-05-10', '2026-05-01', 'Recette testée'),
(10, 28, 63, '2026-05-10', '2026-05-01', 'Menu cantine photo'),
(10, 30, 70, '2026-05-10', '2026-05-01', 'Plat partagé'),
(10, 28, 75, '2026-05-10', '2026-05-01', 'Menu végé photo'),
(10, 29, 82, '2026-05-10', '2026-05-01', 'Recette testée'),
(10, 30, 89, '2026-05-10', '2026-05-01', 'Plat maison partagé'),
(10, 28, 97, '2026-05-10', '2026-05-01', 'Repas veggie');

-- Défi 11 (Local & Saison)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(11, 33, 6,  '2026-05-10', '2026-05-01', 'Fraises espagnoles refusées en janvier'),
(11, 32, 8,  '2026-05-10', '2026-05-01', 'Origine produits vérifiée'),
(11, 33, 10, '2026-05-10', '2026-05-01', 'Hors-saison refusé'),
(11, 32, 35, '2026-05-10', '2026-05-01', 'Étiquettes contrôlées'),
(11, 33, 38, '2026-05-10', '2026-05-01', 'Produits de saison uniquement'),
(11, 32, 70, '2026-05-10', '2026-05-01', 'Étiquettes vérifiées'),
(11, 33, 89, '2026-05-10', '2026-05-01', 'Hors-saison refusé');

-- Défi 12 (Zéro Gaspi)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(12, 36, 6,  '2026-05-10', '2026-05-01', 'Liste de courses faite le dimanche'),
(12, 35, 8,  '2026-05-10', '2026-05-01', 'Restes en lunch box'),
(12, 36, 10, '2026-05-10', '2026-05-01', 'Planning repas semaine fait'),
(12, 36, 38, '2026-05-10', '2026-05-01', 'Liste de courses'),
(12, 35, 89, '2026-05-10', '2026-05-01', 'Restes conservés');

COMMIT;