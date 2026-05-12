-- ============================================================
-- SEED COMPLET - GreenPulse RSE
-- Données significatives pour toutes les tables
-- ~100 employés, 5 équipes, 3 animateurs, 2 admins
-- VERSION NEW : Valider dédupliqué — 1 seule validation par
-- (Id_defi, Id_Employe, mois), colonne mois incluse explicitement.
-- ============================================================

-- ============================================================
-- 0. NETTOYAGE COMPLET
-- ============================================================
DELETE FROM Recevoir;
DELETE FROM Obtenir_Eq;
DELETE FROM Obtenir_Em;
DELETE FROM Valider;
DELETE FROM Reponse_Defi;
DELETE FROM Message;
DELETE FROM Faire_partie;
DELETE FROM Forum;
DELETE FROM Regroupe;
DELETE FROM Actions;
DELETE FROM Defi;
DELETE FROM Animateur;
DELETE FROM Admin;
DELETE FROM Employe;
DELETE FROM Utilisateur;
DELETE FROM Notification;
DELETE FROM Badge;
DELETE FROM Thematique;
DELETE FROM Equipe;
DELETE FROM Entreprise;

ALTER SEQUENCE entreprise_id_entreprise_seq   RESTART WITH 1;
ALTER SEQUENCE equipe_id_equipe_seq           RESTART WITH 1;
ALTER SEQUENCE utilisateur_id_user_seq        RESTART WITH 1;
ALTER SEQUENCE defi_id_defi_seq               RESTART WITH 1;
ALTER SEQUENCE thematique_id_thematique_seq   RESTART WITH 1;
ALTER SEQUENCE actions_id_actions_seq         RESTART WITH 1;
ALTER SEQUENCE forum_id_forum_seq             RESTART WITH 1;
ALTER SEQUENCE badge_id_badge_seq             RESTART WITH 1;
ALTER SEQUENCE notification_id_notif_seq      RESTART WITH 1;
DO $$ BEGIN
    IF to_regclass('public.reponse_defi_id_reponse_seq') IS NOT NULL THEN
        EXECUTE 'ALTER SEQUENCE reponse_defi_id_reponse_seq RESTART WITH 1';
    END IF;
END $$;

-- ============================================================
-- 1. ENTREPRISES
-- ============================================================
INSERT INTO Entreprise (nomEntreprise, secteurEntreprise) VALUES
('GreenPulse SAS',         'Services numériques'),
('EcoTech Industries',     'Industrie manufacturière'),
('Verte Alliance SARL',    'Conseil environnemental');

-- ============================================================
-- 2. ÉQUIPES
-- ============================================================
INSERT INTO Equipe (nomEquipe, nbPointsEquipe, nbCO2Equipe) VALUES
('Les Colibris',    0, 0),
('Team Chlorophylle',0, 0),
('Éco Warriors',    0, 0),
('Planète Bleue',   0, 0),
('Green Hackers',   0, 0);

-- ============================================================
-- 3. BADGES
-- ============================================================
INSERT INTO Badge (nomBadge, descriptionBadge, iconeBadge) VALUES
('Premier Pas',      'Valider sa première action',                   '🌱'),
('Écolo Confirmé',   'Valider 10 actions au total',                  '🌿'),
('Champion Vert',    'Valider 25 actions au total',                  '🍀'),
('Super Héros',      'Valider 50 actions au total',                  '🦸‍♂️'),
('Zéro Carbone',     'Atteindre 100 kg CO₂ économisé',              '🌍'),
('Mobilité Douce',   'Valider toutes les actions mobilité',          '🚲'),
('Énergie Sage',     'Valider toutes les actions énergie',           '💡'),
('Zéro Déchet',      'Valider toutes les actions déchets',           '♻️'),
('Végéhéros',        'Valider toutes les actions alimentation',      '🥕'),
('Équipe Unie',       'Toute l''équipe valide un même défi',          '🤝'),
('Podium Équipe',    'Équipe dans le top 3 mensuel',                 '🥇');

-- ============================================================
-- 4. THÉMATIQUES
-- ============================================================
INSERT INTO Thematique (nomTheme, descriptionTheme) VALUES
('Mobilité',      'Réduire l''impact carbone des déplacements quotidiens'),
('Énergie',       'Économiser l''énergie au bureau et à la maison'),
('Déchets',       'Réduire, réutiliser et trier les déchets'),
('Alimentation',  'Adopter une alimentation plus responsable et locale');

-- ============================================================
-- 5. UTILISATEURS : admins, animateurs, employés
-- Mot de passe commun (bcrypt de "password") :
--   $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================

-- 2 Admins (entreprise 1)
INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, inscriptionUser, Id_Entreprise) VALUES
('Martin',    'Sophie',   'admin.sophie@greenpulse.fr',      'actif', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-10', 1),
('Renaud',    'Thomas',   'admin.thomas@greenpulse.fr',      'actif', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-10', 1);

INSERT INTO Admin (Id_Admin) VALUES (1), (2);

-- 3 Animateurs (entreprises 1, 2, 3)
INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, inscriptionUser, Id_Entreprise) VALUES
('Leblanc',   'Camille',  'animateur.camille@greenpulse.fr', 'actif', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-15', 1),
('Fontaine',  'Julien',   'animateur.julien@ecotech.fr',     'actif', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-15', 2),
('Aubert',    'Marine',   'animateur.marine@verte.fr',       'actif', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-01-15', 3);

INSERT INTO Animateur (Id_Animateur) VALUES (3), (4), (5);

-- 100 Employés répartis sur les 3 entreprises
INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, inscriptionUser, Id_Entreprise) VALUES
('Dupont',    'Alice',    'alice.dupont@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 1),
('Bernard',   'Marc',     'marc.bernard@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 1),
('Leclerc',   'Emma',     'emma.leclerc@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 1),
('Moreau',    'Luc',      'luc.moreau@greenpulse.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 1),
('Simon',     'Julie',    'julie.simon@greenpulse.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 1),
('Laurent',   'Pierre',   'pierre.laurent@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 1),
('Michel',    'Chloé',    'chloe.michel@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 1),
('Lefevre',   'Antoine',  'antoine.lefevre@greenpulse.fr',   'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 1),
('Garcia',    'Sarah',    'sarah.garcia@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 1),
('Roux',      'Kevin',    'kevin.roux@greenpulse.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 1),
('Fournier',  'Laura',    'laura.fournier@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 1),
('Girard',    'Nicolas',  'nicolas.girard@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 1),
('Bonnet',    'Manon',    'manon.bonnet@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 1),
('Dupuis',    'Romain',   'romain.dupuis@greenpulse.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 1),
('Lambert',   'Lucie',    'lucie.lambert@greenpulse.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 1),
('Morin',     'Hugo',     'hugo.morin@greenpulse.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 1),
('Robin',     'Lea',      'lea.robin@greenpulse.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 1),
('Clement',   'Alexis',   'alexis.clement@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 1),
('Guerin',    'Pauline',  'pauline.guerin@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 1),
('Chevalier', 'Maxime',   'maxime.chevalier@greenpulse.fr',  'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 1),
('Faure',     'Camille',  'camille.faure@greenpulse.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 1),
('Rousseau',  'Baptiste', 'baptiste.rousseau@greenpulse.fr', 'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 1),
('Blanc',     'Elise',    'elise.blanc@greenpulse.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 1),
('Gallet',    'Tristan',  'tristan.gallet@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 1),
('Vidal',     'Noemie',   'noemie.vidal@greenpulse.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 1),
('Perrin',    'Mathieu',  'mathieu.perrin@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 1),
('Rey',       'Clotilde',  'clotilde.rey@greenpulse.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 1),
('Colin',     'Etienne',  'etienne.colin@greenpulse.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 1),
('Mercier',   'Victoria', 'victoria.mercier@greenpulse.fr',  'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 1),
('Pichon',    'Florian',  'florian.pichon@greenpulse.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 1),
-- EcoTech (entreprise 2)
('Arnaud',    'Isabelle', 'isabelle.arnaud@ecotech.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 2),
('Barre',     'David',    'david.barre@ecotech.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 2),
('Carre',     'Valerie',  'valerie.carre@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 2),
('Denis',     'Samuel',   'samuel.denis@ecotech.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 2),
('Esteve',    'Aurelie',  'aurelie.esteve@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 2),
('Ferrand',   'Cyril',    'cyril.ferrand@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 2),
('Gros',      'Stephanie','stephanie.gros@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 2),
('Hubert',    'Jerome',   'jerome.hubert@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 2),
('Imbert',    'Sandrine', 'sandrine.imbert@ecotech.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 2),
('Jacquet',   'Philippe', 'philippe.jacquet@ecotech.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 2),
('Klein',     'Christelle','christelle.klein@ecotech.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 2),
('Lacombe',   'Olivier',  'olivier.lacombe@ecotech.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 2),
('Mallet',    'Veronique','veronique.mallet@ecotech.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 2),
('Navarro',   'Gregory',  'gregory.navarro@ecotech.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 2),
('Olivier',   'Nadege',   'nadege.olivier@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 2),
('Paul',      'Cedric',   'cedric.paul@ecotech.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 2),
('Quintin',   'Muriel',   'muriel.quintin@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 2),
('Robert',    'Laurent',  'laurent.robert@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 2),
('Salle',     'Sylvie',   'sylvie.salle@ecotech.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 2),
('Thibault',  'Frederic', 'frederic.thibault@ecotech.fr',    'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 2),
('Urbain',    'Pascale',  'pascale.urbain@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 2),
('Vasseur',   'Mickael',  'mickael.vasseur@ecotech.fr',      'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 2),
('Weil',      'Delphine', 'delphine.weil@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 2),
('Ximenes',   'Bruno',    'bruno.ximenes@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 2),
('Yilmaz',    'Celine',   'celine.yilmaz@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 2),
('Zoller',    'Arnaud',   'arnaud.zoller@ecotech.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 2),
('Auger',     'Brigitte', 'brigitte.auger@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 2),
('Bellamy',   'Xavier',   'xavier.bellamy@ecotech.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 2),
('Chancel',   'Patricia', 'patricia.chancel@ecotech.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 2),
('Drouet',    'Sebastien','sebastien.drouet@ecotech.fr',     'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 2),
('Echard',    'Florence', 'florence.echard@ecotech.fr',      'inactif',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-03', 2),
-- Verte Alliance (entreprise 3)
('Fabre',     'Gilles',   'gilles.fabre@verte.fr',           'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 3),
('Gauthier',  'Anne',     'anne.gauthier@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-01', 3),
('Herve',     'Jean',     'jean.herve@verte.fr',             'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 3),
('Isnard',    'Christine','christine.isnard@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-03', 3),
('Jourdain',  'Patrick',  'patrick.jourdain@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 3),
('Kermarrec', 'Sophie',   'sophie.kermarrec@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-05', 3),
('Loiseau',   'Emmanuel', 'emmanuel.loiseau@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 3),
('Masse',     'Virginie', 'virginie.masse@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-07', 3),
('Noel',      'Dominique','dominique.noel@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 3),
('Ortega',    'Franck',   'franck.ortega@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-09', 3),
('Pons',      'Laetitia', 'laetitia.pons@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 3),
('Quinet',    'Gerald',   'gerald.quinet@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-11', 3),
('Richard',   'Nathalie', 'nathalie.richard@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 3),
('Saunier',   'Denis',    'denis.saunier@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-13', 3),
('Tissier',   'Helene',   'helene.tissier@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 3),
('Ullmann',   'Thierry',  'thierry.ullmann@verte.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-15', 3),
('Vernet',    'Isabelle', 'isabelle.vernet@verte.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 3),
('Walter',    'Marc',     'marc.walter@verte.fr',            'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-17', 3),
('Xuereb',    'Monique',  'monique.xuereb@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 3),
('Yvert',     'Robert',   'robert.yvert@verte.fr',           'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-19', 3),
('Zidane',    'Farida',   'farida.zidane@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 3),
('Achard',    'Guillaume','guillaume.achard@verte.fr',       'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-21', 3),
('Bailly',    'Caroline', 'caroline.bailly@verte.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 3),
('Colas',     'Stephane', 'stephane.colas@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-23', 3),
('Dumas',     'Martine',  'martine.dumas@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 3),
('Ernst',     'Pierre',   'pierre.ernst@verte.fr',           'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-25', 3),
('Fleury',    'Annick',   'annick.fleury@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 3),
('Gosselin',  'Benoit',   'benoit.gosselin@verte.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-02-27', 3),
('Hoarau',    'Sylvia',   'sylvia.hoarau@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 3),
('Idiart',    'Nicolas',  'nicolas.idiart@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-01', 3),
('Jeanneau',  'Veronique','veronique.jeanneau@verte.fr',     'suspendu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-03', 3),
('Khaldi',    'Amine',    'amine.khaldi@verte.fr',           'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-05', 3),
('Lenoir',    'Paul',     'paul.lenoir@verte.fr',            'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-05', 3),
('Morel',     'Julie',    'julie.morel@verte.fr',            'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-07', 3),
('Perrot',    'Damien',   'damien.perrot@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-07', 3),
('Riviere',   'Celine',   'celine.riviere@verte.fr',         'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-09', 3),
('Sabatier',  'Loic',     'loic.sabatier@verte.fr',          'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-09', 3),
('Teixeira',  'Marion',   'marion.teixeira@verte.fr',        'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-11', 3),
('Vallee',    'Remi',     'remi.vallee@verte.fr',            'actif',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-03-11', 3);

-- ============================================================
-- 6. TABLE Employe (Id_User 6 à 105 = employés)
--    Répartition équipes :
--      Equipe 1 (Les Colibris)      : emp 6-25   (20 emp, GreenPulse)
--      Equipe 2 (Team Chlorophylle) : emp 26-45  (20 emp, GreenPulse+EcoTech)
--      Equipe 3 (Éco Warriors)      : emp 46-65  (20 emp, EcoTech)
--      Equipe 4 (Planète Bleue)     : emp 66-85  (20 emp, Verte Alliance)
--      Equipe 5 (Green Hackers)     : emp 86-105 (20 emp, Verte Alliance)
-- ============================================================
INSERT INTO Employe (Id_Employe, nbPointsEmploye, nbCO2, departementEmploye, Id_equipe) VALUES
-- Equipe 1 - Les Colibris (GreenPulse)
(6,  320, 48, 'Développement',    1),
(7,  280, 42, 'Développement',    1),
(8,  350, 52, 'Marketing',        1),
(9,  200, 30, 'Marketing',        1),
(10, 410, 62, 'RH',               1),
(11, 175, 26, 'RH',               1),
(12, 300, 45, 'Finance',          1),
(13, 240, 36, 'Finance',          1),
(14, 380, 57, 'Développement',    1),
(15, 130, 19, 'Développement',    1),
(16, 450, 67, 'Direction',        1),
(17, 95,  14, 'Direction',        1),
(18, 210, 31, 'Opérations',       1),
(19, 310, 46, 'Opérations',       1),
(20, 270, 40, 'Développement',    1),
(21, 190, 28, 'Marketing',        1),
(22, 340, 51, 'Finance',          1),
(23, 115, 17, 'RH',               1),
(24, 395, 59, 'Développement',    1),
(25, 225, 33, 'Opérations',       1),
-- Equipe 2 - Team Chlorophylle
(26, 360, 54, 'Développement',    2),
(27, 155, 23, 'Marketing',        2),
(28, 420, 63, 'Finance',          2),
(29, 290, 43, 'RH',               2),
(30, 185, 27, 'Opérations',       2),
(31, 310, 46, 'Développement',    2),
(32, 250, 37, 'Marketing',        2),
(33, 440, 66, 'Direction',        2),
(34, 170, 25, 'Finance',          2),
(35, 330, 49, 'Développement',    2),
-- EcoTech dans equipe 2
(36, 275, 41, 'Production',       2),
(37, 195, 29, 'Logistique',       2),
(38, 365, 55, 'Qualité',          2),
(39, 140, 21, 'Production',       2),
(40, 485, 73, 'Direction',        2),
(41, 120, 18, 'RH',               2),
(42, 255, 38, 'Finance',          2),
(43, 375, 56, 'Logistique',       2),
(44, 210, 31, 'Qualité',          2),
(45, 295, 44, 'Production',       2),
-- Equipe 3 - Éco Warriors (EcoTech)
(46, 430, 64, 'Production',       3),
(47, 180, 27, 'Logistique',       3),
(48, 320, 48, 'Qualité',          3),
(49, 260, 39, 'Production',       3),
(50, 390, 58, 'Direction',        3),
(51, 145, 21, 'RH',               3),
(52, 305, 45, 'Finance',          3),
(53, 235, 35, 'Logistique',       3),
(54, 415, 62, 'Qualité',          3),
(55, 165, 24, 'Production',       3),
(56, 475, 71, 'Direction',        3),
(57, 110, 16, 'RH',               3),
(58, 345, 51, 'Finance',          3),
(59, 285, 42, 'Logistique',       3),
(60, 225, 33, 'Production',       3),
(61, 0,   0,  'Production',       3),  -- inactif
(62, 355, 53, 'Production',       3),
(63, 400, 60, 'Qualité',          3),
(64, 215, 32, 'Logistique',       3),
(65, 335, 50, 'Finance',          3),
-- Equipe 4 - Planète Bleue (Verte Alliance)
(66, 370, 55, 'Conseil',          4),
(67, 200, 30, 'Conseil',          4),
(68, 460, 69, 'Recherche',        4),
(69, 150, 22, 'Recherche',        4),
(70, 310, 46, 'Communication',    4),
(71, 240, 36, 'Communication',    4),
(72, 410, 61, 'Direction',        4),
(73, 175, 26, 'Conseil',          4),
(74, 290, 43, 'Recherche',        4),
(75, 360, 54, 'Communication',    4),
(76, 220, 33, 'Conseil',          4),
(77, 430, 64, 'Recherche',        4),
(78, 130, 19, 'Direction',        4),
(79, 380, 57, 'Communication',    4),
(80, 265, 39, 'Conseil',          4),
(81, 195, 29, 'Recherche',        4),
(82, 445, 66, 'Conseil',          4),
(83, 115, 17, 'Communication',    4),
(84, 325, 48, 'Recherche',        4),
(85, 0,   0,  'Conseil',          4),  -- suspendu
-- Equipe 5 - Green Hackers (Verte Alliance)
(86, 500, 75, 'Conseil',          5),
(87, 340, 51, 'Recherche',        5),
(88, 255, 38, 'Communication',    5),
(89, 420, 63, 'Conseil',          5),
(90, 180, 27, 'Recherche',        5),
(91, 395, 59, 'Communication',    5),
(92, 145, 21, 'Conseil',          5),
(93, 470, 70, 'Recherche',        5),
(94, 230, 34, 'Direction',        5),
(95, 315, 47, 'Conseil',          5),
(96, 285, 42, 'Recherche',        5),
(97, 440, 66, 'Communication',    5),
(98, 165, 24, 'Conseil',          5),
(99, 360, 54, 'Recherche',        5),
(100,200, 30, 'Communication',    5),
(101,410, 61, 'Conseil',          5),
(102,135, 20, 'Recherche',        5),
(103,375, 56, 'Communication',    5),
(104,250, 37, 'Conseil',          5),
(105,330, 49, 'Recherche',        5);

-- ============================================================
-- 7. MISE À JOUR DES POINTS DES ÉQUIPES (agrégation des membres)
-- ============================================================
UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 1),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 1)
WHERE Id_equipe = 1;

UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 2),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 2)
WHERE Id_equipe = 2;

UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 3),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 3)
WHERE Id_equipe = 3;

UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 4),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 4)
WHERE Id_equipe = 4;

UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 5),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 5)
WHERE Id_equipe = 5;

-- ============================================================
-- 8. DÉFIS (12 défis, 3 par thématique, animateurs tournants)
-- ============================================================
INSERT INTO Defi (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi, Id_Animateur) VALUES
-- Mobilité
('Zéro Voiture',          'Venez au travail sans voiture pendant une semaine',           100, 15, 1, 3),
('Covoiturage Express',   'Organisez un covoiturage avec au moins un collègue',           75, 10, 2, 4),
('Vélo Challenge',        'Venez au bureau à vélo 3 jours consécutifs',                  150, 20, 3, 5),
-- Énergie
('Éteignez la lumière',   'Éteignez toutes les lumières en quittant une pièce',           50,  8, 1, 3),
('Mode Veille Interdit',  'Aucun appareil en veille le soir pendant une semaine',          60, 10, 4, 4),
('Thermostat Éco',        'Réduisez le chauffage d''un degré cette semaine',               80, 12, 3, 5),
-- Déchets
('Lunch Zéro Déchet',     'Apportez votre repas sans emballage plastique à usage unique',  75,  5, 1, 3),
('Semaine sans Plastique','Aucun plastique à usage unique pendant 7 jours',              120,  8, 2, 4),
('Tri Master',            'Triez correctement vos déchets pendant 5 jours de suite',       90,  6, 3, 5),
-- Alimentation
('Repas Veggie',          'Mangez végétarien le midi toute la semaine',                    80, 12, 1, 3),
('Local & Saison',        'Achetez uniquement des produits locaux et de saison',          100, 15, 2, 4),
('Zéro Gaspi',            'Ne jetez aucun aliment pendant toute la semaine',              110, 10, 3, 5);

-- ============================================================
-- 9. ACTIONS (3 par défi)
-- ============================================================
INSERT INTO Actions (nomAction, descriptionAction) VALUES
-- Défi 1 : Zéro Voiture
('Venir à vélo',              'Utiliser le vélo pour le trajet domicile-travail'),
('Venir à pied',              'Marcher pour venir au travail si moins de 3 km'),
('Prendre les transports',    'Utiliser bus, métro ou tram pour venir au bureau'),
-- Défi 2 : Covoiturage Express
('Proposer un trajet',        'Publier un trajet sur l''application de covoiturage'),
('Embarquer un collègue',     'Prendre un collègue dans votre véhicule'),
('Créer un groupe régulier',  'Organiser un groupe de covoiturage hebdomadaire'),
-- Défi 3 : Vélo Challenge
('Sortir le vélo 3 jours',    'Utiliser le vélo 3 jours consécutifs'),
('Utiliser le parking vélo',  'Garer son vélo au parking sécurisé du bureau'),
('Entretenir son vélo',       'Vérifier freins, pneus et chaîne avant de partir'),
-- Défi 4 : Éteignez la lumière
('Éteindre en partant',       'Éteindre toutes les lumières en quittant la pièce'),
('Lumière naturelle',         'Privilégier la lumière naturelle en journée'),
('Signaler les oublis',       'Rappeler à ses collègues d''éteindre les lumières'),
-- Défi 5 : Mode Veille Interdit
('Éteindre le PC',            'Éteindre complètement le PC en fin de journée'),
('Débrancher les chargeurs',  'Débrancher tous les chargeurs inutilisés'),
('Éteindre les écrans',       'Ne laisser aucun écran allumé la nuit'),
-- Défi 6 : Thermostat Éco
('Baisser le thermostat',     'Réduire le thermostat d''un degré'),
('Porter un pull',            'Préférer un pull à une montée du chauffage'),
('Fermer les fenêtres',       'Vérifier que les fenêtres sont fermées quand il chauffe'),
-- Défi 7 : Lunch Zéro Déchet
('Boîte repas réutilisable',  'Apporter sa lunch box pour le déjeuner'),
('Couverts réutilisables',    'Apporter ses propres couverts au bureau'),
('Gourde réutilisable',       'Utiliser une gourde plutôt qu''une bouteille plastique'),
-- Défi 8 : Semaine sans Plastique
('Refuser les sacs plastique','Refuser systématiquement un sac plastique en caisse'),
('Éviter emballages plastique','Choisir des produits sans emballage plastique'),
('Signaler les plastiques',   'Identifier les plastiques évitables au bureau'),
-- Défi 9 : Tri Master
('Trier papier/carton',       'Mettre papiers et cartons dans la bonne poubelle'),
('Trier plastique/métal',     'Trier correctement plastiques et métaux'),
('Composter',                 'Utiliser le compost pour les déchets alimentaires'),
-- Défi 10 : Repas Veggie
('Déjeuner sans viande',      'Choisir un repas végétarien le midi'),
('Découvrir une recette veggie','Essayer une nouvelle recette végétarienne'),
('Partager un plat veggie',   'Amener un plat végétarien maison à partager'),
-- Défi 11 : Local & Saison
('Acheter au marché local',   'Faire ses courses au marché local du quartier'),
('Vérifier l''origine',       'Lire les étiquettes pour choisir des produits locaux'),
('Éviter le hors-saison',     'Refuser les fruits et légumes hors saison'),
-- Défi 12 : Zéro Gaspi
('Finir son assiette',        'Ne pas jeter de nourriture dans son assiette'),
('Conserver les restes',      'Mettre les restes au réfrigérateur pour le lendemain'),
('Planifier ses repas',       'Préparer une liste de courses pour éviter le gaspillage');

-- ============================================================
-- 10. FAIRE_PARTIE
-- ============================================================
INSERT INTO Faire_partie (Id_defi, Id_actions) VALUES
(1,1),(1,2),(1,3),
(2,4),(2,5),(2,6),
(3,7),(3,8),(3,9),
(4,10),(4,11),(4,12),
(5,13),(5,14),(5,15),
(6,16),(6,17),(6,18),
(7,19),(7,20),(7,21),
(8,22),(8,23),(8,24),
(9,25),(9,26),(9,27),
(10,28),(10,29),(10,30),
(11,31),(11,32),(11,33),
(12,34),(12,35),(12,36);

-- ============================================================
-- 11. REGROUPE (trigger fn_check_ordre_consecutif actif :
--     les INSERT doivent être dans l'ordre 1 → 2 → 3 par thématique)
-- ============================================================
-- Mobilité (Id_thematique = 1)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (1, 1, '2026-04-01', 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (2, 1, '2026-04-01', 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (3, 1, '2026-04-01', 3);
-- Énergie (Id_thematique = 2)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (4, 2, '2026-04-01', 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (5, 2, '2026-04-01', 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (6, 2, '2026-04-01', 3);
-- Déchets (Id_thematique = 3)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (7, 3, '2026-04-01', 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (8, 3, '2026-04-01', 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (9, 3, '2026-04-01', 3);
-- Alimentation (Id_thematique = 4)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (10, 4, '2026-04-01', 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (11, 4, '2026-04-01', 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (12, 4, '2026-04-01', 3);

-- ============================================================
-- 12. FORUMS (un par défi, mois avril 2026)
-- ============================================================
INSERT INTO Forum (nomForum, descriptionForum, Id_defi, mois) VALUES
('Forum Zéro Voiture',        'Partagez vos expériences de mobilité douce',          1, '2026-04-01'),
('Forum Covoiturage',         'Organisez vos trajets en commun',                     2, '2026-04-01'),
('Forum Vélo',                'Conseils et astuces pour venir à vélo',               3, '2026-04-01'),
('Forum Lumières',            'Économisez l''énergie au bureau',                     4, '2026-04-01'),
('Forum Veille',              'Réduire la consommation des appareils en veille',      5, '2026-04-01'),
('Forum Thermostat',          'Optimiser le chauffage collectivement',               6, '2026-04-01'),
('Forum Lunch',               'Partagez vos idées repas zéro déchet',               7, '2026-04-01'),
('Forum Plastique',           'Alternatives au plastique à usage unique',            8, '2026-04-01'),
('Forum Tri',                 'Guide pratique du tri sélectif au bureau',            9, '2026-04-01'),
('Forum Veggie',              'Recettes et conseils végétariens',                   10, '2026-04-01'),
('Forum Local',               'Producteurs locaux et marchés recommandés',          11, '2026-04-01'),
('Forum Anti-Gaspi',          'Astuces anti-gaspillage alimentaire',                12, '2026-04-01');

-- ============================================================
-- 13. MESSAGES dans les forums
-- ============================================================
INSERT INTO Message (contenuMessage, dateMessage, Id_Employe, Id_forum) VALUES
-- Forum Zéro Voiture (forum 1)
('Je suis venue à pied ce matin, 35 minutes mais tellement agréable !',          '2026-04-17', 6,  1),
('Conseil : préparer son sac la veille pour ne pas oublier les affaires de sport.','2026-04-18',  7,  1),
('Jai pris le bus pour la première fois depuis des années, honnêtement pas si mal.', '2026-04-19', 8,  1),
('La piste cyclable rue de la République est finalement sécurisée !',            '2026-04-20', 9,  1),
('2ème semaine sans voiture, on sy habitue vraiment.',                           '2026-04-21', 10, 1),
-- Forum Covoiturage (forum 2)
('Cherche passager depuis Blagnac vers centre-ville, départ 8h.',                '2026-04-19', 14, 2),
('Je rejoins avec plaisir ! Envoyez-moi un message.',                            '2026-04-19', 15, 2),
('Notre groupe de covoiturage tourne bien, on est 4 réguliers.',                 '2026-04-22', 16, 2),
('Application de covoiturage recommandée par RH : BlaBlaCar Daily.',             '2026-04-24', 17, 2),
-- Forum Vélo (forum 3)
('Atelier réparation vélo organisé dans le parking, samedi prochain.',           '2026-04-15', 20, 3),
('Quelquun sait où louer un vélo électrique pas cher près du bureau ?',          '2026-04-17', 21, 3),
('Jai investi dans un bon casque, ça change tout mentalement.',                   '2026-04-20',  22, 3),
('3 jours de vélo bouclés ! Je suis fière.',                                     '2026-04-23',  23, 3),
-- Forum Lumières (forum 4)
('Idée : coller des petits autocollants "Pensez à éteindre" sur les interrupteurs.', '2026-04-12', 30, 4),
('Jai remarqué que la salle de réunion 2B reste souvent allumée le soir.',       '2026-04-14', 31, 4),
('On pourrait installer des détecteurs de présence sur les couloirs.',            '2026-04-16', 32, 4),
-- Forum Veille (forum 5)
('Jai éteint la multiprise chaque soir cette semaine, simple et efficace.',       '2026-04-21',  36, 5),
('Rappel : les chargeurs branchés consomment même sans appareil connecté.',       '2026-04-23',  37, 5),
-- Forum Thermostat (forum 6)
('Un degré de moins, ça fait vraiment une différence sur la facture collective.', '2026-04-19',  42, 6),
('Jai apporté un plaid pour mes journées au bureau, on est à 19° maintenant.',    '2026-04-21',  43, 6),
-- Forum Lunch (forum 7)
('Mes collègues ont adoré ma lunch box réutilisable, ils veulent la même marque.','2026-04-18',  50, 7),
('Restaurant du coin propose désormais les plats en contenant perso.',            '2026-04-20',  51, 7),
('Gourde recommandée : Klean Kanteen inox, dure depuis 3 ans.',                  '2026-04-22',  52, 7),
-- Forum Plastique (forum 8)
('Supermarché Leclerc en face propose des sacs à 0€ si on apporte les siens.',   '2026-04-16', 60, 8),
('Jai trouvé des alternatives aux emballages plastique pour mon déjeuner.',       '2026-04-19',  62, 8),
-- Forum Tri (forum 9)
('Guide de tri actualisé 2024 posté sur lintranet.',                              '2026-04-13', 66, 9),
('Les bouteilles en verre vont dans le conteneur jaune ou vert ?',               '2026-04-15', 67, 9),
('Réponse : conteneur vert uniquement pour le verre.',                            '2026-04-16', 68, 9),
-- Forum Local (forum 11)
('Marché fermier place du Capitole, mercredi et samedi matin.',                  '2026-04-18',  80, 11),
('AMAP disponible : panier de légumes locaux toutes les semaines.',              '2026-04-21',  81, 11),
-- Forum Anti-Gaspi (forum 12)
('Application Too Good To Go : récupérer les invendus des restaurants du coin.', '2026-04-19',  86, 12),
('Jai commencé à planifier mes repas sur la semaine, divise les courses par deux.','2026-04-22', 87, 12),
('Astuce : cuisiner en plus grande quantité et congeler.',                        '2026-04-24',  88, 12);

-- ============================================================
-- 14. VALIDER — une seule validation par (Id_defi, Id_Employe, mois)
--     Règle : on garde l'action validée en dernier (date_validation
--     la plus récente, et en cas d'égalité le plus grand Id_actions).
--     Colonne mois = premier jour du mois de date_validation.
--     Ordre : défi 1 avant 2, 2 avant 3 (trigger séquentiel).
-- ============================================================

-- --- MOBILITÉ ---

-- Défi 1 (Zéro Voiture)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(1, 3, 6,  '2026-04-09', '2026-04-01', 'Ticket de bus scanné'),
(1, 3, 7,  '2026-04-10', '2026-04-01', 'Abonnement bus photo'),
(1, 2, 8,  '2026-04-09', '2026-04-01', 'Trajet 2.5 km fait à pied'),
(1, 3, 9,  '2026-04-08', '2026-04-01', 'Ticket tram photo'),
(1, 3, 10, '2026-04-08', '2026-04-01', 'Ticket bus photo'),
(1, 1, 11, '2026-04-09', '2026-04-01', 'Photo vélo'),
(1, 3, 12, '2026-04-07', '2026-04-01', 'Ticket métro'),
(1, 3, 14, '2026-04-10', '2026-04-01', 'Ticket bus'),
(1, 3, 16, '2026-04-06', '2026-04-01', 'Ticket tram'),
(1, 3, 24, '2026-04-10', '2026-04-01', 'Ticket TC'),
(1, 2, 26, '2026-04-08', '2026-04-01', 'Marche constatée'),
(1, 3, 28, '2026-04-07', '2026-04-01', 'Ticket bus'),
(1, 3, 33, '2026-04-10', '2026-04-01', 'Ticket métro'),
(1, 3, 40, '2026-04-07', '2026-04-01', 'Ticket bus'),
(1, 3, 46, '2026-04-09', '2026-04-01', 'Ticket tram'),
(1, 3, 50, '2026-04-08', '2026-04-01', 'Ticket bus'),
(1, 3, 66, '2026-04-09', '2026-04-01', 'Ticket TC'),
(1, 3, 72, '2026-04-08', '2026-04-01', 'Ticket bus'),
(1, 3, 86, '2026-04-09', '2026-04-01', 'Ticket tram numérique'),
(1, 3, 93, '2026-04-07', '2026-04-01', 'Ticket bus');

-- Défi 2 (Covoiturage Express)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(2, 6, 6,  '2026-04-14', '2026-04-01', 'Groupe créé sur WhatsApp bureau'),
(2, 5, 7,  '2026-04-13', '2026-04-01', 'Collègue confirmé : Emma Leclerc'),
(2, 6, 10, '2026-04-13', '2026-04-01', 'Groupe hebdomadaire actif'),
(2, 5, 12, '2026-04-14', '2026-04-01', 'Un collègue embarqué'),
(2, 6, 14, '2026-04-13', '2026-04-01', 'Groupe de 3 organisé'),
(2, 5, 16, '2026-04-11', '2026-04-01', 'Passager : Sophie Martin'),
(2, 5, 24, '2026-04-13', '2026-04-01', 'Collègue: Tristan Gallet'),
(2, 5, 26, '2026-04-13', '2026-04-01', 'Collègue embarqué'),
(2, 5, 28, '2026-04-12', '2026-04-01', 'Passager confirmé'),
(2, 5, 33, '2026-04-13', '2026-04-01', 'Collègue: Sandrine Imbert'),
(2, 5, 40, '2026-04-12', '2026-04-01', 'Passager confirmé'),
(2, 5, 46, '2026-04-14', '2026-04-01', 'Collègue embarqué'),
(2, 5, 50, '2026-04-13', '2026-04-01', 'Deux passagers'),
(2, 5, 66, '2026-04-14', '2026-04-01', 'Collègue confirmé'),
(2, 5, 72, '2026-04-13', '2026-04-01', 'Passager: Franck Ortega'),
(2, 5, 86, '2026-04-14', '2026-04-01', 'Collègue embarqué'),
(2, 5, 93, '2026-04-13', '2026-04-01', 'Passager confirmé');

-- Défi 3 (Vélo Challenge)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(3, 9, 6,  '2026-04-21', '2026-04-01', 'Check freins et pneus effectué'),
(3, 9, 10, '2026-04-20', '2026-04-01', 'Entretien vélo fait'),
(3, 8, 14, '2026-04-20', '2026-04-01', 'Parking vélo photo'),
(3, 9, 16, '2026-04-20', '2026-04-01', 'Vélo entretenu'),
(3, 8, 33, '2026-04-20', '2026-04-01', 'Parking sécurisé utilisé'),
(3, 9, 40, '2026-04-20', '2026-04-01', 'Entretien effectué'),
(3, 7, 50, '2026-04-19', '2026-04-01', 'App vélo 3 jours'),
(3, 9, 86, '2026-04-22', '2026-04-01', 'Vélo vérifié avant départ'),
(3, 8, 93, '2026-04-20', '2026-04-01', 'Parking photo');

-- --- ÉNERGIE ---

-- Défi 4 (Éteignez la lumière)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(4, 12, 6,  '2026-04-11', '2026-04-01', 'Rappel collègues effectué'),
(4, 11, 7,  '2026-04-10', '2026-04-01', 'Lumière naturelle favorisée'),
(4, 12, 8,  '2026-04-10', '2026-04-01', 'Collègues sensibilisés'),
(4, 10, 9,  '2026-04-09', '2026-04-01', 'Check soir fait'),
(4, 11, 11, '2026-04-11', '2026-04-01', 'Lumière naturelle'),
(4, 12, 13, '2026-04-10', '2026-04-01', 'Rappel collègues'),
(4, 10, 15, '2026-04-10', '2026-04-01', 'Éteint chaque soir'),
(4, 11, 18, '2026-04-10', '2026-04-01', 'Lumière naturelle toute la journée'),
(4, 10, 20, '2026-04-08', '2026-04-01', 'Éteint en partant'),
(4, 10, 25, '2026-04-10', '2026-04-01', 'Checklist remplie'),
(4, 12, 31, '2026-04-11', '2026-04-01', 'Rappel fait à l''équipe'),
(4, 10, 36, '2026-04-09', '2026-04-01', 'Éteint le soir'),
(4, 10, 42, '2026-04-10', '2026-04-01', 'Checklist soir'),
(4, 11, 47, '2026-04-10', '2026-04-01', 'Lumière naturelle préférée'),
(4, 10, 54, '2026-04-09', '2026-04-01', 'Check fait'),
(4, 11, 67, '2026-04-09', '2026-04-01', 'Stores ouverts'),
(4, 10, 73, '2026-04-10', '2026-04-01', 'Lumières éteintes'),
(4, 10, 80, '2026-04-09', '2026-04-01', 'Checklist remplie'),
(4, 12, 87, '2026-04-10', '2026-04-01', 'Rappel collègues fait'),
(4, 10, 94, '2026-04-10', '2026-04-01', 'Éteint en partant');

-- Défi 5 (Mode Veille Interdit)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(5, 15, 6,  '2026-04-17', '2026-04-01', 'Aucun écran allumé la nuit'),
(5, 14, 7,  '2026-04-16', '2026-04-01', 'Multiprise éteinte'),
(5, 15, 8,  '2026-04-16', '2026-04-01', 'Écrans off'),
(5, 14, 11, '2026-04-16', '2026-04-01', 'Chargeurs retirés'),
(5, 15, 13, '2026-04-15', '2026-04-01', 'Pas d''écran la nuit'),
(5, 14, 18, '2026-04-16', '2026-04-01', 'Chargeurs débranchés'),
(5, 15, 31, '2026-04-16', '2026-04-01', 'Aucun écran la nuit'),
(5, 13, 36, '2026-04-15', '2026-04-01', 'PC complètement éteint'),
(5, 14, 47, '2026-04-16', '2026-04-01', 'Chargeurs retirés'),
(5, 13, 67, '2026-04-16', '2026-04-01', 'PC éteint'),
(5, 15, 87, '2026-04-17', '2026-04-01', 'Aucun écran allumé');

-- Défi 6 (Thermostat Éco)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(6, 18, 6,  '2026-04-24', '2026-04-01', 'Fenêtres vérifiées chaque matin'),
(6, 17, 7,  '2026-04-23', '2026-04-01', 'Pull au bureau'),
(6, 18, 8,  '2026-04-23', '2026-04-01', 'Fenêtres fermées le soir'),
(6, 18, 31, '2026-04-24', '2026-04-01', 'Fenêtres fermées'),
(6, 18, 87, '2026-04-24', '2026-04-01', 'Fenêtres vérifiées');

-- --- DÉCHETS ---

-- Défi 7 (Lunch Zéro Déchet)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(7, 21, 6,  '2026-04-12', '2026-04-01', 'Gourde inox utilisée'),
(7, 21, 9,  '2026-04-12', '2026-04-01', 'Gourde photo'),
(7, 20, 12, '2026-04-10', '2026-04-01', 'Couverts en bois'),
(7, 21, 17, '2026-04-11', '2026-04-01', 'Gourde inox'),
(7, 21, 21, '2026-04-11', '2026-04-01', 'Gourde photo'),
(7, 19, 27, '2026-04-10', '2026-04-01', 'Lunch box utilisée'),
(7, 20, 32, '2026-04-10', '2026-04-01', 'Couverts bambou'),
(7, 21, 39, '2026-04-11', '2026-04-01', 'Gourde'),
(7, 21, 48, '2026-04-11', '2026-04-01', 'Gourde inox photo'),
(7, 19, 53, '2026-04-10', '2026-04-01', 'Lunch box'),
(7, 20, 59, '2026-04-10', '2026-04-01', 'Couverts réutilisables'),
(7, 21, 69, '2026-04-11', '2026-04-01', 'Gourde photo'),
(7, 20, 76, '2026-04-10', '2026-04-01', 'Couverts bambou'),
(7, 21, 88, '2026-04-12', '2026-04-01', 'Gourde inox'),
(7, 21, 95, '2026-04-11', '2026-04-01', 'Gourde');

-- Défi 8 (Semaine sans Plastique)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(8, 24, 6,  '2026-04-19', '2026-04-01', 'Plastiques évitables listés'),
(8, 23, 9,  '2026-04-18', '2026-04-01', 'Pas d''emballage plastique'),
(8, 24, 12, '2026-04-18', '2026-04-01', 'Plastiques bureau identifiés'),
(8, 23, 21, '2026-04-18', '2026-04-01', 'Vrac favori'),
(8, 23, 32, '2026-04-17', '2026-04-01', 'Pas d''emballage'),
(8, 24, 48, '2026-04-19', '2026-04-01', 'Plastiques identifiés'),
(8, 22, 59, '2026-04-16', '2026-04-01', 'Sac tissu'),
(8, 23, 69, '2026-04-18', '2026-04-01', 'Emballages évités'),
(8, 24, 88, '2026-04-19', '2026-04-01', 'Plastiques bureau signalés');

-- Défi 9 (Tri Master)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(9, 27, 6,  '2026-04-26', '2026-04-01', 'Compost utilisé'),
(9, 26, 9,  '2026-04-25', '2026-04-01', 'Plastiques triés'),
(9, 27, 12, '2026-04-25', '2026-04-01', 'Compost'),
(9, 26, 48, '2026-04-25', '2026-04-01', 'Plastiques triés'),
(9, 27, 88, '2026-04-26', '2026-04-01', 'Compost utilisé');

-- --- ALIMENTATION ---

-- Défi 10 (Repas Veggie)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(10, 30, 6,  '2026-04-13', '2026-04-01', 'Plat partagé avec l''équipe'),
(10, 29, 8,  '2026-04-12', '2026-04-01', 'Nouvelle recette testée'),
(10, 30, 10, '2026-04-12', '2026-04-01', 'Plat partagé'),
(10, 29, 19, '2026-04-12', '2026-04-01', 'Recette testée'),
(10, 28, 22, '2026-04-10', '2026-04-01', 'Repas veggie'),
(10, 29, 35, '2026-04-12', '2026-04-01', 'Recette nouvelle'),
(10, 30, 38, '2026-04-12', '2026-04-01', 'Plat partagé collègues'),
(10, 28, 49, '2026-04-11', '2026-04-01', 'Menu végé'),
(10, 29, 54, '2026-04-11', '2026-04-01', 'Recette testée'),
(10, 28, 63, '2026-04-11', '2026-04-01', 'Menu cantine photo'),
(10, 30, 70, '2026-04-12', '2026-04-01', 'Plat partagé'),
(10, 28, 75, '2026-04-11', '2026-04-01', 'Menu végé photo'),
(10, 29, 82, '2026-04-11', '2026-04-01', 'Recette testée'),
(10, 30, 89, '2026-04-13', '2026-04-01', 'Plat maison partagé'),
(10, 28, 97, '2026-04-10', '2026-04-01', 'Repas veggie');

-- Défi 11 (Local & Saison)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(11, 33, 6,  '2026-04-21', '2026-04-01', 'Fraises espagnoles refusées en janvier'),
(11, 32, 8,  '2026-04-20', '2026-04-01', 'Origine produits vérifiée'),
(11, 33, 10, '2026-04-20', '2026-04-01', 'Hors-saison refusé'),
(11, 32, 35, '2026-04-20', '2026-04-01', 'Étiquettes contrôlées'),
(11, 33, 38, '2026-04-20', '2026-04-01', 'Produits de saison uniquement'),
(11, 32, 70, '2026-04-20', '2026-04-01', 'Étiquettes vérifiées'),
(11, 33, 89, '2026-04-21', '2026-04-01', 'Hors-saison refusé');

-- Défi 12 (Zéro Gaspi)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(12, 36, 6,  '2026-04-27', '2026-04-01', 'Liste de courses faite le dimanche'),
(12, 35, 8,  '2026-04-26', '2026-04-01', 'Restes en lunch box'),
(12, 36, 10, '2026-04-26', '2026-04-01', 'Planning repas semaine fait'),
(12, 36, 38, '2026-04-27', '2026-04-01', 'Liste de courses'),
(12, 35, 89, '2026-04-26', '2026-04-01', 'Restes conservés');

-- ============================================================
-- 15. RÉPONSES À LA MODÉRATION (Reponse_Defi)
-- ============================================================
INSERT INTO Reponse_Defi (Id_defi, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_reponse, date_traitement, Id_Animateur_traitement) VALUES
-- Pending
(1, 19, 'J ai pris les transports toute la semaine sans ma voiture.', 'pending', NULL, '2026-04-26 10:30:00', NULL, NULL),
(1, 22, 'Venue à vélo 4 jours sur 5, le vendredi il pleuvait.', 'pending', NULL, '2026-04-25 09:00:00', NULL, NULL),
(4, 23, 'Lumières éteintes chaque soir cette semaine, mes collègues aussi.', 'pending', NULL, '2026-04-26 10:30:00', NULL, NULL),
(7, 27, 'Lunch box et gourde utilisées toute la semaine, zéro plastique.', 'pending', NULL, '2026-04-27 08:00:00', NULL, NULL),
(10, 49, 'Menu végétarien midi toute la semaine, avec une recette maison partagée.', 'pending', NULL, '2026-04-27 06:00:00', NULL, NULL),
(2, 29, 'Groupe de covoiturage créé avec 3 collègues, trajet partagé chaque matin.', 'pending', NULL, '2026-04-26 23:00:00', NULL, NULL),
(5, 13, 'PC éteint chaque soir, chargeurs débranchés, multiprise coupée.', 'pending', NULL, '2026-04-25 09:00:00', NULL, NULL),
(8, 53, 'Semaine entière sans plastique, j ai découvert des alternatives au vrac.', 'pending', NULL, '2026-04-27 05:00:00', NULL, NULL),
-- Approved
(1, 26, 'J ai utilisé le vélo tous les jours cette semaine, 8 km aller.', 'approved', 'Super effort, continuez comme ça !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 3),
(1, 28, 'Trajet à pied 2 km chaque matin et soir.', 'approved', 'Bravo pour cet engagement quotidien.', '2026-04-21 10:00:00', '2026-04-22 11:30:00', 3),
(4, 31, 'Checklist d extinction remplie chaque soir, collègues sensibilisés.', 'approved', 'Initiative collective très appréciée.', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 4),
(7, 32, 'Lunch box et couverts bambou toute la semaine.', 'approved', 'Parfait, aucun plastique reporté !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 3),
(10, 35, 'Végétarien le midi toute la semaine, recette partagée.', 'approved', 'Excellent, et la recette a l air délicieuse !', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 4),
(2, 40, 'Groupe de covoiturage avec 4 collègues organisé, actif chaque jour.', 'approved', 'Organisation parfaite, keep it up !', '2026-04-21 10:00:00', '2026-04-22 11:30:00', 5),
(1, 46, 'Vélo et transports en commun alternés, zéro voiture.', 'approved', 'Belle combinaison de mobilité douce.', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 3),
(4, 47, 'Lumières éteintes, lumière naturelle favorisée en journée.', 'approved', 'Très bien, pensez aussi aux couloirs.', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 4),
(7, 48, 'Zéro emballage jetable cette semaine au bureau.', 'approved', 'Exemplaire !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 5),
(10, 54, 'Repas végé toute la semaine, curry pois chiches fait maison.', 'approved', 'Très motivant pour toute l équipe.', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 3),
(1, 66, 'Transports en commun toute la semaine, abonnement mensuel.', 'approved', 'Démarche cohérente et durable.', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 5),
(7, 69, 'Lunch box et gourde : aucun déchet plastique.', 'approved', 'Super, à maintenir chaque semaine !', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 3),
(10, 70, 'Végétarien midi et plat partagé avec l équipe vendredi.', 'approved', 'Superbe initiative collective !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 4),
(1, 86, 'Vélo toute la semaine, 11 km aller-retour par jour.', 'approved', 'Champion ! Belle régularité.', '2026-04-21 10:00:00', '2026-04-22 11:30:00', 5),
(4, 87, 'Tous les appareils éteints chaque soir, equipe sensibilisée.', 'approved', 'Très bonne démarche collective.', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 3),
(7, 88, 'Semaine zéro plastique, gourde, lunch box et couverts personnels.', 'approved', 'Modèle à suivre !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 4),
-- Rejected
(3, 30, 'J ai fait du vélo 2 jours, le 3ème j avais une réunion tôt.', 'rejected', 'Merci pour l effort, mais le défi exige 3 jours consécutifs. Réessayez la semaine prochaine.', '2026-04-20 09:15:00', '2026-04-21 10:00:00', 3),
(6, 34, 'J ai baissé le chauffage chez moi mais pas au bureau.', 'rejected', 'Le défi concerne le cadre professionnel, merci de recommencer en ciblant le bureau.', '2026-04-21 10:00:00', '2026-04-22 11:30:00', 4),
(9, 51, 'J ai essayé de trier mais je n étais pas sûr des consignes.', 'rejected', 'Consultez le guide de tri sur l intranet et retentez, vous pouvez le faire !', '2026-04-22 11:30:00', '2026-04-23 14:00:00', 5),
(11, 80, 'J ai acheté des tomates mais je ne sais pas si elles étaient locales.', 'rejected', 'Pensez à demander au vendeur ou à vérifier les étiquettes. Bon courage.', '2026-04-23 14:00:00', '2026-04-24 15:45:00', 3),
(3, 92, 'Vélo 1 jour seulement, il manquait de la place dans le parking.', 'rejected', 'Le parking vélo a des places réservées. Contactez l accueil pour une place dédiée.', '2026-04-24 15:45:00', '2026-04-25 09:00:00', 4);

-- ============================================================
-- 16. BADGES OBTENUS PAR LES EMPLOYÉS (Obtenir_Em)
--     Les triggers T7/T13 s'activent sur INSERT → points déjà
--     définis directement sur l'employé, badges insérés manuellement
--     pour éviter les doubles (le seed bypasse les triggers de points).
-- ============================================================
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
-- Premier Pas (badge 1) — tout le monde ayant au moins 1 action validée
(1, 6,   '2026-04-07'),
(1, 7,   '2026-04-07'),
(1, 8,   '2026-04-07'),
(1, 9,   '2026-04-07'),
(1, 10,  '2026-04-06'),
(1, 11,  '2026-04-09'),
(1, 12,  '2026-04-05'),
(1, 13,  '2026-04-09'),
(1, 14,  '2026-04-08'),
(1, 15,  '2026-04-10'),
(1, 16,  '2026-04-04'),
(1, 17,  '2026-04-09'),
(1, 18,  '2026-04-09'),
(1, 19,  '2026-04-11'),
(1, 20,  '2026-04-08'),
(1, 21,  '2026-04-09'),
(1, 22,  '2026-04-10'),
(1, 24,  '2026-04-07'),
(1, 25,  '2026-04-10'),
(1, 26,  '2026-04-07'),
(1, 27,  '2026-04-10'),
(1, 28,  '2026-04-06'),
(1, 29,  '2026-04-11'),
(1, 30,  '2026-04-08'),
(1, 31,  '2026-04-09'),
(1, 32,  '2026-04-09'),
(1, 33,  '2026-04-08'),
(1, 35,  '2026-04-11'),
(1, 36,  '2026-04-09'),
(1, 38,  '2026-04-10'),
(1, 39,  '2026-04-10'),
(1, 40,  '2026-04-05'),
(1, 42,  '2026-04-10'),
(1, 43,  '2026-04-11'),
(1, 46,  '2026-04-07'),
(1, 47,  '2026-04-09'),
(1, 48,  '2026-04-09'),
(1, 49,  '2026-04-11'),
(1, 50,  '2026-04-06'),
(1, 51,  '2026-04-06'),
(1, 53,  '2026-04-10'),
(1, 54,  '2026-04-09'),
(1, 59,  '2026-04-09'),
(1, 63,  '2026-04-11'),
(1, 66,  '2026-04-08'),
(1, 67,  '2026-04-08'),
(1, 69,  '2026-04-10'),
(1, 70,  '2026-04-10'),
(1, 72,  '2026-04-06'),
(1, 73,  '2026-04-10'),
(1, 75,  '2026-04-11'),
(1, 76,  '2026-04-09'),
(1, 80,  '2026-04-09'),
(1, 82,  '2026-04-10'),
(1, 86,  '2026-04-07'),
(1, 87,  '2026-04-08'),
(1, 88,  '2026-04-10'),
(1, 89,  '2026-04-11'),
(1, 93,  '2026-04-05'),
(1, 94,  '2026-04-10'),
(1, 95,  '2026-04-10'),
(1, 97,  '2026-04-10'),
(1, 99,  '2026-04-11')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Écolo Confirmé (badge 2) — employés avec beaucoup d'actions
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(2, 6,   '2026-04-12'),
(2, 8,   '2026-04-12'),
(2, 10,  '2026-04-11'),
(2, 12,  '2026-04-13'),
(2, 14,  '2026-04-12'),
(2, 16,  '2026-04-10'),
(2, 33,  '2026-04-13'),
(2, 40,  '2026-04-12'),
(2, 46,  '2026-04-13'),
(2, 48,  '2026-04-14'),
(2, 50,  '2026-04-12'),
(2, 86,  '2026-04-13'),
(2, 87,  '2026-04-14'),
(2, 88,  '2026-04-15'),
(2, 89,  '2026-04-14'),
(2, 93,  '2026-04-13')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Champion Vert (badge 3) — top performers
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(3, 6,   '2026-04-22'),
(3, 10,  '2026-04-21'),
(3, 16,  '2026-04-20'),
(3, 40,  '2026-04-22'),
(3, 86,  '2026-04-23'),
(3, 93,  '2026-04-22')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Zéro Carbone (badge 4) — CO2 > 100
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(4, 6,   '2026-04-17'),
(4, 10,  '2026-04-16'),
(4, 16,  '2026-04-15'),
(4, 24,  '2026-04-17'),
(4, 33,  '2026-04-18'),
(4, 40,  '2026-04-17'),
(4, 50,  '2026-04-16'),
(4, 54,  '2026-04-18'),
(4, 68,  '2026-04-17'),
(4, 72,  '2026-04-16'),
(4, 77,  '2026-04-18'),
(4, 82,  '2026-04-17'),
(4, 86,  '2026-04-19'),
(4, 89,  '2026-04-18'),
(4, 93,  '2026-04-17'),
(4, 97,  '2026-04-18')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Mobilité Douce (badge 5)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(5, 6,   '2026-04-21'),
(5, 10,  '2026-04-20'),
(5, 14,  '2026-04-21'),
(5, 16,  '2026-04-20'),
(5, 33,  '2026-04-21'),
(5, 40,  '2026-04-20'),
(5, 50,  '2026-04-21'),
(5, 86,  '2026-04-22'),
(5, 93,  '2026-04-21')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Énergie Sage (badge 6)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(6, 6,   '2026-04-24'),
(6, 7,   '2026-04-24'),
(6, 8,   '2026-04-23'),
(6, 31,  '2026-04-24'),
(6, 87,  '2026-04-25')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Zéro Déchet (badge 7)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(7, 6,   '2026-04-26'),
(7, 9,   '2026-04-26'),
(7, 12,  '2026-04-25'),
(7, 48,  '2026-04-26'),
(7, 88,  '2026-04-26')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Végéhéros (badge 8)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(8, 6,   '2026-04-27'),
(8, 8,   '2026-04-27'),
(8, 10,  '2026-04-27'),
(8, 38,  '2026-04-27'),
(8, 89,  '2026-04-27')
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- ============================================================
-- 17. BADGES ÉQUIPES (Obtenir_Eq)
-- ============================================================
INSERT INTO Obtenir_Eq (Id_equipe, Id_Badge, dateObtention) VALUES
(1, 9,  '2026-04-22'),   -- Équipe Unie : Les Colibris
(2, 9,  '2026-04-23'),   -- Équipe Unie : Team Chlorophylle
(3, 9,  '2026-04-21'),   -- Équipe Unie : Éco Warriors
(5, 9,  '2026-04-24'),   -- Équipe Unie : Green Hackers
(1, 10, '2026-04-25'),   -- Podium : Les Colibris (top 3)
(5, 10, '2026-04-26')    -- Podium : Green Hackers (top 3)
ON CONFLICT (Id_equipe, Id_Badge) DO NOTHING;

-- ============================================================
-- 18. NOTIFICATIONS manuelles (hors triggers)
-- ============================================================
INSERT INTO Notification (nomNotif, dateNotif, lienRedirection) VALUES
('Bienvenue sur GreenPulse !',                    '2026-03-28', '/accueil'),
('Nouveau défi disponible : Zéro Voiture',         '2026-04-02', '/defis/1'),
('Nouveau défi disponible : Covoiturage Express',  '2026-04-03', '/defis/2'),
('Nouveau défi disponible : Vélo Challenge',       '2026-04-04', '/defis/3'),
('Nouveau défi disponible : Éteignez la lumière',  '2026-04-05', '/defis/4'),
('Nouveau défi disponible : Mode Veille Interdit', '2026-04-06', '/defis/5'),
('Nouveau défi disponible : Thermostat Éco',       '2026-04-07', '/defis/6'),
('Nouveau défi disponible : Lunch Zéro Déchet',    '2026-04-08', '/defis/7'),
('Nouveau défi disponible : Semaine sans Plastique','2026-04-09','/defis/8'),
('Nouveau défi disponible : Tri Master',           '2026-04-10', '/defis/9'),
('Nouveau défi disponible : Repas Veggie',         '2026-04-11', '/defis/10'),
('Nouveau défi disponible : Local & Saison',       '2026-04-12', '/defis/11'),
('Nouveau défi disponible : Zéro Gaspi',           '2026-04-13', '/defis/12'),
('Classement mis à jour : Les Colibris en tête !', '2026-04-20',  '/classement'),
('Rappel : 3 jours restants pour le défi du mois', '2026-04-24',  '/defis');

-- Recevoir : diffusion des notifications de bienvenue et de défis à tous les employés
INSERT INTO Recevoir (Id_User, id_notif)
SELECT e.Id_Employe, n.id_notif
FROM Employe e
CROSS JOIN Notification n
WHERE n.id_notif IN (1,2,3,4,5,6,7,8,9,10,11,12,13)
ON CONFLICT (Id_User, id_notif) DO NOTHING;

-- Notification classement pour les membres des équipes 1 et 5
INSERT INTO Recevoir (Id_User, id_notif)
SELECT e.Id_Employe, 14
FROM Employe e
WHERE e.Id_equipe IN (1, 5)
ON CONFLICT (Id_User, id_notif) DO NOTHING;

-- Rappel défi pour tous
INSERT INTO Recevoir (Id_User, id_notif)
SELECT e.Id_Employe, 15
FROM Employe e
ON CONFLICT (Id_User, id_notif) DO NOTHING;

-- ============================================================
-- STRI1A — Romeo Andriantsiferana
-- Équipe mono-membre avec historique riche (Jan → Avr 2026)
-- 41 défis validés, 3695 pts, 446 kgCO2
-- Aucune validation en mai 2026 (mois courant)
-- ============================================================

-- Équipe STRI1A (Id_equipe = 6)
INSERT INTO Equipe (nomEquipe, nbPointsEquipe, nbCO2Equipe) VALUES
('STRI1A', 0, 0);

-- Utilisateur Romeo (Id_User = 106)
INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, inscriptionUser, Id_Entreprise) VALUES
('Andriantsiferana', 'Romeo', 'romeo.a@greenpulse.fr', 'actif',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2025-09-01', 1);

-- Employe Romeo dans équipe STRI1A (Id_Employe = 106)
INSERT INTO Employe (Id_Employe, nbPointsEmploye, nbCO2, departementEmploye, Id_equipe) VALUES
(106, 0, 0, 'Développement', 6);

-- ============================================================
-- VALIDATIONS — Janvier 2026 (11 / 12 défis)
-- Points : 980 | CO2 : 121 kg
-- ============================================================
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(1,  1,  106, '2026-01-12', '2026-01-01', 'Photo vélo, trajet maison-bureau 7 km'),
(2,  6,  106, '2026-01-15', '2026-01-01', 'Groupe WhatsApp covoiturage STRI1A créé'),
(3,  7,  106, '2026-01-22', '2026-01-01', 'App vélo : 3 jours consécutifs validés'),
(4,  10, 106, '2026-01-10', '2026-01-01', 'Check soir lumières, selfie bureau éteint'),
(5,  13, 106, '2026-01-17', '2026-01-01', 'PC complètement éteint chaque soir'),
(6,  16, 106, '2026-01-24', '2026-01-01', 'Thermostat baissé à 19°, photo affichage'),
(7,  19, 106, '2026-01-11', '2026-01-01', 'Lunch box inox + couverts bambou'),
(8,  22, 106, '2026-01-18', '2026-01-01', 'Zéro sac plastique en courses cette semaine'),
(9,  25, 106, '2026-01-25', '2026-01-01', 'Tri papier/carton rigoureux toute la semaine'),
(10, 28, 106, '2026-01-13', '2026-01-01', 'Menu végétarien midi toute la semaine'),
(11, 31, 106, '2026-01-20', '2026-01-01', 'Marché local samedi, photo des achats locaux');

-- ============================================================
-- VALIDATIONS — Février 2026 (10 / 12 défis)
-- Points : 910 | CO2 : 104 kg
-- ============================================================
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(1,  3,  106, '2026-02-10', '2026-02-01', 'Ticket bus TC semaine complète'),
(2,  5,  106, '2026-02-14', '2026-02-01', 'Collègue embarqué chaque matin'),
(3,  8,  106, '2026-02-21', '2026-02-01', 'Parking vélo sécurisé, photo'),
(4,  11, 106, '2026-02-08', '2026-02-01', 'Stores ouverts, lumière naturelle toute la journée'),
(5,  14, 106, '2026-02-16', '2026-02-01', 'Multiprise débranchée chaque soir'),
(7,  20, 106, '2026-02-12', '2026-02-01', 'Couverts réutilisables au bureau'),
(8,  23, 106, '2026-02-19', '2026-02-01', 'Vrac privilégié, zéro emballage plastique'),
(9,  26, 106, '2026-02-26', '2026-02-01', 'Plastiques et métaux bien triés'),
(10, 29, 106, '2026-02-11', '2026-02-01', 'Recette veggie découverte : dahl de lentilles'),
(12, 34, 106, '2026-02-28', '2026-02-01', 'Assiette finie chaque repas, zéro gaspillage');

-- ============================================================
-- VALIDATIONS — Mars 2026 (10 / 12 défis)
-- Points : 925 | CO2 : 115 kg
-- ============================================================
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(1,  2,  106, '2026-03-09', '2026-03-01', 'Trajet à pied 2.5 km A/R'),
(3,  9,  106, '2026-03-20', '2026-03-01', 'Vélo entretenu et inspecté avant départ'),
(4,  12, 106, '2026-03-07', '2026-03-01', 'Rappel lumières posté sur le slack équipe'),
(5,  15, 106, '2026-03-15', '2026-03-01', 'Aucun écran allumé la nuit, photo'),
(6,  18, 106, '2026-03-23', '2026-03-01', 'Fenêtres vérifiées chaque matin'),
(7,  21, 106, '2026-03-11', '2026-03-01', 'Gourde inox 1L, zéro bouteille plastique'),
(8,  24, 106, '2026-03-17', '2026-03-01', 'Plastiques évitables listés et signalés'),
(10, 30, 106, '2026-03-12', '2026-03-01', 'Plat veggie maison partagé avec collègues'),
(11, 33, 106, '2026-03-19', '2026-03-01', 'Hors-saison systématiquement refusé'),
(12, 36, 106, '2026-03-26', '2026-03-01', 'Planning repas hebdomadaire tenu 4 semaines');

-- ============================================================
-- VALIDATIONS — Avril 2026 (10 / 12 défis)
-- Points : 880 | CO2 : 106 kg
-- ============================================================
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, mois, preuve) VALUES
(1,  3,  106, '2026-04-08', '2026-04-01', 'Abonnement TC, ticket scanné'),
(2,  6,  106, '2026-04-14', '2026-04-01', 'Groupe covoiturage hebdomadaire, 3 membres'),
(3,  7,  106, '2026-04-21', '2026-04-01', 'App vélo : 3 jours validés consécutifs'),
(4,  10, 106, '2026-04-10', '2026-04-01', 'Check lumières chaque soir de la semaine'),
(5,  13, 106, '2026-04-17', '2026-04-01', 'PC éteint, chargeurs retirés'),
(6,  16, 106, '2026-04-24', '2026-04-01', 'Thermostat 19° maintenu toute la semaine'),
(7,  19, 106, '2026-04-12', '2026-04-01', 'Lunch box + gourde, zéro déchet'),
(8,  22, 106, '2026-04-18', '2026-04-01', 'Sac tissu utilisé toute la semaine'),
(9,  25, 106, '2026-04-25', '2026-04-01', 'Tri rigoureux 5 jours, guide intranet suivi'),
(10, 28, 106, '2026-04-13', '2026-04-01', 'Midi végétarien 5 jours, photo cantine');

-- Mise à jour des points de Romeo (totalise les 4 mois)
-- Jan(11) + Fév(10) + Mar(10) + Avr(10) = 41 défis
-- 980+910+925+880 = 3695 pts | 121+104+115+106 = 446 kgCO2
UPDATE Employe SET nbPointsEmploye = 3695, nbCO2 = 446 WHERE Id_Employe = 106;

-- Mise à jour équipe STRI1A
UPDATE Equipe SET
    nbPointsEquipe = (SELECT COALESCE(SUM(nbPointsEmploye),0) FROM Employe WHERE Id_equipe = 6),
    nbCO2Equipe    = (SELECT COALESCE(SUM(nbCO2),0)           FROM Employe WHERE Id_equipe = 6)
WHERE Id_equipe = 6;

-- ============================================================
-- Réponses à la modération — Avril 2026
-- ============================================================
INSERT INTO Reponse_Defi (Id_defi, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_reponse, date_traitement, Id_Animateur_traitement) VALUES
(1,  106, 'J ai pris les transports en commun chaque matin, abonnement TC photo jointe.', 'approved', 'Excellent engagement, continuez ainsi !',             '2026-04-09 08:30:00', '2026-04-10 09:00:00', 3),
(3,  106, 'Vélo 3 jours consécutifs, screenshot application vélo fourni.',                'approved', 'Bravo pour la régularité, super performance !',        '2026-04-22 10:00:00', '2026-04-23 11:30:00', 4),
(7,  106, 'Lunch box, couverts bambou et gourde inox toute la semaine, zéro plastique.',  'approved', 'Exemplaire ! Continuez à inspirer vos collègues.',     '2026-04-13 09:00:00', '2026-04-14 10:00:00', 5),
(10, 106, 'Menu végétarien 5 jours consécutifs, recette maison partagée avec l équipe.', 'approved', 'Superbe effort, belle initiative collective !',         '2026-04-14 08:00:00', '2026-04-15 09:00:00', 3),
(2,  106, 'Groupe covoiturage créé avec 2 collègues de STRI1A, trajets partagés chaque matin.', 'pending', NULL, '2026-04-15 07:30:00', NULL, NULL);

-- ============================================================
-- Messages de Romeo dans les forums (Avril 2026)
-- ============================================================
INSERT INTO Message (contenuMessage, dateMessage, Id_Employe, Id_forum) VALUES
('Je viens à vélo depuis Toulouse centre, 7 km, c est vraiment agréable le matin !',  '2026-04-09', 106, 1),
('Mon vélo est prêt : freins, pneus et chaîne vérifiés. C est parti pour 3 jours !',  '2026-04-21', 106, 3),
('Astuce : éteignez votre multiprise en partant, ça supprime les veilles fantômes.',   '2026-04-17', 106, 5),
('Planning repas de la semaine affiché en cuisine : divise le gaspillage par 2.',      '2026-04-26', 106, 12);

-- ============================================================
-- Badges de Romeo
-- ============================================================
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(1, 106, '2026-01-10'),   -- Premier Pas
(2, 106, '2026-01-17'),   -- Écolo Confirmé  (10+ actions)
(3, 106, '2026-01-25'),   -- Champion Vert   (25+ actions)
(5, 106, '2026-01-25'),   -- Zéro Carbone    (121 kgCO2 dès janvier)
(6, 106, '2026-01-22'),   -- Mobilité Douce  (défis 1,2,3 validés en janvier)
(7, 106, '2026-01-24'),   -- Énergie Sage    (défis 4,5,6 validés en janvier)
(8, 106, '2026-01-25'),   -- Zéro Déchet     (défis 7,8,9 validés en janvier)
(9, 106, '2026-02-28')    -- Végéhéros       (défi 12 complété en février)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Badge équipe STRI1A (Équipe Unie — Romeo seul membre, valide chaque défi)
INSERT INTO Obtenir_Eq (Id_equipe, Id_Badge, dateObtention) VALUES
(6, 9, '2026-01-25')
ON CONFLICT (Id_equipe, Id_Badge) DO NOTHING;

-- ============================================================
-- Notifications pour Romeo
-- ============================================================
INSERT INTO Recevoir (Id_User, id_notif)
SELECT 106, n.id_notif
FROM Notification n
WHERE n.id_notif IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15)
ON CONFLICT (Id_User, id_notif) DO NOTHING;


insert into appartenir (id_defi, id_thematique) values (1, 1);
insert into appartenir (id_defi, id_thematique) values (2, 1);
insert into appartenir (id_defi, id_thematique) values (3, 1);
insert into appartenir (id_defi, id_thematique) values (4, 2);
insert into appartenir (id_defi, id_thematique) values (5, 2);
insert into appartenir (id_defi, id_thematique) values (6, 2);
insert into appartenir (id_defi, id_thematique) values (7, 3);
insert into appartenir (id_defi, id_thematique) values (8, 3);
insert into appartenir (id_defi, id_thematique) values (9, 3);
insert into appartenir (id_defi, id_thematique) values (10, 4);
insert into appartenir (id_defi, id_thematique) values (11, 4);
insert into appartenir (id_defi, id_thematique) values (12, 4);
