-- ============================================================
-- SEED COMPLET - GreenPulse RSE
-- Données significatives pour toutes les tables
-- ~100 employés, 5 équipes, 3 animateurs, 2 admins
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
('Champion Vert',    'Valider 25 actions au total',                  '🏆'),
('Zéro Carbone',     'Atteindre 100 kg CO₂ économisé',              '💚'),
('Mobilité Douce',   'Valider toutes les actions mobilité',          '🚲'),
('Énergie Sage',     'Valider toutes les actions énergie',           '⚡'),
('Zéro Déchet',      'Valider toutes les actions déchets',           '♻️'),
('Végéhéros',        'Valider toutes les actions alimentation',      '🥗'),
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
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (1, 1, DATE_TRUNC('month', CURRENT_DATE), 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (2, 1, DATE_TRUNC('month', CURRENT_DATE), 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (3, 1, DATE_TRUNC('month', CURRENT_DATE), 3);
-- Énergie (Id_thematique = 2)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (4, 2, DATE_TRUNC('month', CURRENT_DATE), 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (5, 2, DATE_TRUNC('month', CURRENT_DATE), 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (6, 2, DATE_TRUNC('month', CURRENT_DATE), 3);
-- Déchets (Id_thematique = 3)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (7, 3, DATE_TRUNC('month', CURRENT_DATE), 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (8, 3, DATE_TRUNC('month', CURRENT_DATE), 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (9, 3, DATE_TRUNC('month', CURRENT_DATE), 3);
-- Alimentation (Id_thematique = 4)
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (10, 4, DATE_TRUNC('month', CURRENT_DATE), 1);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (11, 4, DATE_TRUNC('month', CURRENT_DATE), 2);
INSERT INTO Regroupe (Id_defi, Id_thematique, mois, ordre) VALUES (12, 4, DATE_TRUNC('month', CURRENT_DATE), 3);

-- ============================================================
-- 12. FORUMS (un par défi)
-- ============================================================
INSERT INTO Forum (nomForum, descriptionForum, Id_defi) VALUES
('Forum Zéro Voiture',        'Partagez vos expériences de mobilité douce',          1),
('Forum Covoiturage',         'Organisez vos trajets en commun',                     2),
('Forum Vélo',                'Conseils et astuces pour venir à vélo',               3),
('Forum Lumières',            'Économisez l''énergie au bureau',                     4),
('Forum Veille',              'Réduire la consommation des appareils en veille',      5),
('Forum Thermostat',          'Optimiser le chauffage collectivement',               6),
('Forum Lunch',               'Partagez vos idées repas zéro déchet',               7),
('Forum Plastique',           'Alternatives au plastique à usage unique',            8),
('Forum Tri',                 'Guide pratique du tri sélectif au bureau',            9),
('Forum Veggie',              'Recettes et conseils végétariens',                   10),
('Forum Local',               'Producteurs locaux et marchés recommandés',          11),
('Forum Anti-Gaspi',          'Astuces anti-gaspillage alimentaire',                12);

-- ============================================================
-- 13. MESSAGES dans les forums
-- ============================================================
INSERT INTO Message (contenuMessage, dateMessage, Id_Employe, Id_forum) VALUES
-- Forum Zéro Voiture (forum 1)
('Je suis venue à pied ce matin, 35 minutes mais tellement agréable !',          CURRENT_DATE - 10, 6,  1),
('Conseil : préparer son sac la veille pour ne pas oublier les affaires de sport.',CURRENT_DATE - 9,  7,  1),
('Jai pris le bus pour la première fois depuis des années, honnêtement pas si mal.', CURRENT_DATE - 8, 8,  1),
('La piste cyclable rue de la République est finalement sécurisée !',            CURRENT_DATE - 7, 9,  1),
('2ème semaine sans voiture, on sy habitue vraiment.',                           CURRENT_DATE - 6, 10, 1),
-- Forum Covoiturage (forum 2)
('Cherche passager depuis Blagnac vers centre-ville, départ 8h.',                CURRENT_DATE - 8, 14, 2),
('Je rejoins avec plaisir ! Envoyez-moi un message.',                            CURRENT_DATE - 8, 15, 2),
('Notre groupe de covoiturage tourne bien, on est 4 réguliers.',                 CURRENT_DATE - 5, 16, 2),
('Application de covoiturage recommandée par RH : BlaBlaCar Daily.',             CURRENT_DATE - 3, 17, 2),
-- Forum Vélo (forum 3)
('Atelier réparation vélo organisé dans le parking, samedi prochain.',           CURRENT_DATE - 12, 20, 3),
('Quelquun sait où louer un vélo électrique pas cher près du bureau ?',          CURRENT_DATE - 10, 21, 3),
('Jai investi dans un bon casque, ça change tout mentalement.',                   CURRENT_DATE - 7,  22, 3),
('3 jours de vélo bouclés ! Je suis fière.',                                     CURRENT_DATE - 4,  23, 3),
-- Forum Lumières (forum 4)
('Idée : coller des petits autocollants "Pensez à éteindre" sur les interrupteurs.', CURRENT_DATE - 15, 30, 4),
('Jai remarqué que la salle de réunion 2B reste souvent allumée le soir.',       CURRENT_DATE - 13, 31, 4),
('On pourrait installer des détecteurs de présence sur les couloirs.',            CURRENT_DATE - 11, 32, 4),
-- Forum Veille (forum 5)
('Jai éteint la multiprise chaque soir cette semaine, simple et efficace.',       CURRENT_DATE - 6,  36, 5),
('Rappel : les chargeurs branchés consomment même sans appareil connecté.',       CURRENT_DATE - 4,  37, 5),
-- Forum Thermostat (forum 6)
('Un degré de moins, ça fait vraiment une différence sur la facture collective.', CURRENT_DATE - 8,  42, 6),
('Jai apporté un plaid pour mes journées au bureau, on est à 19° maintenant.',    CURRENT_DATE - 6,  43, 6),
-- Forum Lunch (forum 7)
('Mes collègues ont adoré ma lunch box réutilisable, ils veulent la même marque.',CURRENT_DATE - 9,  50, 7),
('Restaurant du coin propose désormais les plats en contenant perso.',            CURRENT_DATE - 7,  51, 7),
('Gourde recommandée : Klean Kanteen inox, dure depuis 3 ans.',                  CURRENT_DATE - 5,  52, 7),
-- Forum Plastique (forum 8)
('Supermarché Leclerc en face propose des sacs à 0€ si on apporte les siens.',   CURRENT_DATE - 11, 60, 8),
('Jai trouvé des alternatives aux emballages plastique pour mon déjeuner.',       CURRENT_DATE - 8,  62, 8),
-- Forum Tri (forum 9)
('Guide de tri actualisé 2024 posté sur lintranet.',                              CURRENT_DATE - 14, 66, 9),
('Les bouteilles en verre vont dans le conteneur jaune ou vert ?',               CURRENT_DATE - 12, 67, 9),
('Réponse : conteneur vert uniquement pour le verre.',                            CURRENT_DATE - 11, 68, 9),
-- Forum Veggie (forum 10)
('Recette partagée : curry de pois chiches, 20 minutes et bluffant.',            CURRENT_DATE - 10, 72, 10),
('Challenge : manger veggie toute la semaine. Qui est partant ?',                CURRENT_DATE - 8,  73, 10),
('Je suis partant ! On se retrouve à la cantine lundi.',                         CURRENT_DATE - 7,  74, 10),
('La cantine propose désormais une option végé quotidienne.',                     CURRENT_DATE - 5,  75, 10),
-- Forum Local (forum 11)
('Marché fermier place du Capitole, mercredi et samedi matin.',                  CURRENT_DATE - 9,  80, 11),
('AMAP disponible : panier de légumes locaux toutes les semaines.',              CURRENT_DATE - 6,  81, 11),
-- Forum Anti-Gaspi (forum 12)
('Application Too Good To Go : récupérer les invendus des restaurants du coin.', CURRENT_DATE - 8,  86, 12),
('Jai commencé à planifier mes repas sur la semaine, divise les courses par deux.',CURRENT_DATE - 5, 87, 12),
('Astuce : cuisiner en plus grande quantité et congeler.',                        CURRENT_DATE - 3,  88, 12);

-- ============================================================
-- 14. VALIDER — actions validées par les employés
--     Ordre impératif (trigger T3 : défi d'ordre N-1 avant N)
--     On valide le défi 1 (ordre 1) avant le 2, le 2 avant le 3
--     pour chaque thématique.
-- ============================================================

-- --- MOBILITÉ : défi 1 d'abord, puis 2, puis 3 ---

-- Défi 1 (Zéro Voiture) — validé par de nombreux employés
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(1, 1, 6,  CURRENT_DATE - 20, 'Photo de mon vélo devant le bureau'),
(1, 2, 6,  CURRENT_DATE - 19, 'Arrivé à pied en 30 min'),
(1, 3, 6,  CURRENT_DATE - 18, 'Ticket de bus scanné'),
(1, 1, 7,  CURRENT_DATE - 20, 'Selfie sur le trajet vélo'),
(1, 2, 7,  CURRENT_DATE - 19, 'Itinéraire pédestre partagé'),
(1, 3, 7,  CURRENT_DATE - 17, 'Abonnement bus photo'),
(1, 1, 8,  CURRENT_DATE - 20, 'Compteur vélo : 8 km'),
(1, 2, 8,  CURRENT_DATE - 18, 'Trajet 2.5 km fait à pied'),
(1, 1, 9,  CURRENT_DATE - 20, 'Photo vélo garé'),
(1, 3, 9,  CURRENT_DATE - 19, 'Ticket tram photo'),
(1, 1, 10, CURRENT_DATE - 21, 'Application Strava : trajet vélo validé'),
(1, 2, 10, CURRENT_DATE - 20, 'Marche 2 km domicile-bureau'),
(1, 3, 10, CURRENT_DATE - 19, 'Ticket bus photo'),
(1, 1, 11, CURRENT_DATE - 18, 'Photo vélo'),
(1, 1, 12, CURRENT_DATE - 22, 'Trajet vélo 12 km'),
(1, 2, 12, CURRENT_DATE - 21, 'Marche 1.8 km'),
(1, 3, 12, CURRENT_DATE - 20, 'Ticket métro'),
(1, 1, 14, CURRENT_DATE - 19, 'Photo vélo bureau'),
(1, 2, 14, CURRENT_DATE - 18, 'Trajet 2 km à pied'),
(1, 3, 14, CURRENT_DATE - 17, 'Ticket bus'),
(1, 1, 16, CURRENT_DATE - 23, 'Compteur vélo 9 km'),
(1, 2, 16, CURRENT_DATE - 22, 'Pédestre 3 km'),
(1, 3, 16, CURRENT_DATE - 21, 'Ticket tram'),
(1, 1, 24, CURRENT_DATE - 20, 'Photo vélo parking'),
(1, 2, 24, CURRENT_DATE - 19, 'Marche constatée'),
(1, 3, 24, CURRENT_DATE - 17, 'Ticket TC'),
-- Equipe 2
(1, 1, 26, CURRENT_DATE - 20, 'Photo vélo'),
(1, 2, 26, CURRENT_DATE - 19, 'Marche constatée'),
(1, 1, 28, CURRENT_DATE - 21, 'Compteur 7 km'),
(1, 3, 28, CURRENT_DATE - 20, 'Ticket bus'),
(1, 1, 33, CURRENT_DATE - 19, 'Photo vélo parking'),
(1, 2, 33, CURRENT_DATE - 18, 'Marche 2.8 km'),
(1, 3, 33, CURRENT_DATE - 17, 'Ticket métro'),
(1, 1, 40, CURRENT_DATE - 22, 'Selfie vélo'),
(1, 2, 40, CURRENT_DATE - 21, 'Trajet pédestre'),
(1, 3, 40, CURRENT_DATE - 20, 'Ticket bus'),
-- Equipe 3
(1, 1, 46, CURRENT_DATE - 20, 'Photo vélo'),
(1, 2, 46, CURRENT_DATE - 19, 'Marche 1.5 km'),
(1, 3, 46, CURRENT_DATE - 18, 'Ticket tram'),
(1, 1, 50, CURRENT_DATE - 21, 'Strava vélo 10 km'),
(1, 2, 50, CURRENT_DATE - 20, 'Marche constatée'),
(1, 3, 50, CURRENT_DATE - 19, 'Ticket bus'),
-- Equipe 4
(1, 1, 66, CURRENT_DATE - 19, 'Photo vélo'),
(1, 3, 66, CURRENT_DATE - 18, 'Ticket TC'),
(1, 1, 72, CURRENT_DATE - 21, 'Compteur vélo'),
(1, 2, 72, CURRENT_DATE - 20, 'Marche 2 km'),
(1, 3, 72, CURRENT_DATE - 19, 'Ticket bus'),
-- Equipe 5
(1, 1, 86, CURRENT_DATE - 20, 'Photo vélo parking sécurisé'),
(1, 2, 86, CURRENT_DATE - 19, 'Marche chrono'),
(1, 3, 86, CURRENT_DATE - 18, 'Ticket tram numérique'),
(1, 1, 93, CURRENT_DATE - 22, 'Strava vélo 11 km'),
(1, 2, 93, CURRENT_DATE - 21, 'Trajet pédestre 2 km'),
(1, 3, 93, CURRENT_DATE - 20, 'Ticket bus');

-- Défi 2 (Covoiturage Express) — employés ayant déjà validé défi 1
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(2, 4, 6,  CURRENT_DATE - 15, 'Trajet publié sur BlaBlaCar Daily'),
(2, 5, 6,  CURRENT_DATE - 14, 'Collègue embarqué : Marc Bernard'),
(2, 6, 6,  CURRENT_DATE - 13, 'Groupe créé sur WhatsApp bureau'),
(2, 4, 7,  CURRENT_DATE - 15, 'Trajet posté application'),
(2, 5, 7,  CURRENT_DATE - 14, 'Collègue confirmé : Emma Leclerc'),
(2, 4, 10, CURRENT_DATE - 16, 'Trajet publié'),
(2, 5, 10, CURRENT_DATE - 15, 'Deux collègues embarqués'),
(2, 6, 10, CURRENT_DATE - 14, 'Groupe hebdomadaire actif'),
(2, 4, 12, CURRENT_DATE - 14, 'Trajet covoiturage partagé'),
(2, 5, 12, CURRENT_DATE - 13, 'Un collègue embarqué'),
(2, 4, 14, CURRENT_DATE - 16, 'Publication trajet faite'),
(2, 5, 14, CURRENT_DATE - 15, 'Collègue validé'),
(2, 6, 14, CURRENT_DATE - 14, 'Groupe de 3 organisé'),
(2, 4, 16, CURRENT_DATE - 17, 'Trajet BlaBlaCar Daily'),
(2, 5, 16, CURRENT_DATE - 16, 'Passager : Sophie Martin'),
(2, 4, 24, CURRENT_DATE - 15, 'Trajet publié'),
(2, 5, 24, CURRENT_DATE - 14, 'Collègue: Tristan Gallet'),
(2, 4, 26, CURRENT_DATE - 15, 'Trajet partagé'),
(2, 5, 26, CURRENT_DATE - 14, 'Collègue embarqué'),
(2, 4, 28, CURRENT_DATE - 16, 'Publication app covoiturage'),
(2, 5, 28, CURRENT_DATE - 15, 'Passager confirmé'),
(2, 4, 33, CURRENT_DATE - 15, 'Trajet publié'),
(2, 5, 33, CURRENT_DATE - 14, 'Collègue: Sandrine Imbert'),
(2, 4, 40, CURRENT_DATE - 16, 'Trajet BlaBlaCar Daily'),
(2, 5, 40, CURRENT_DATE - 15, 'Passager confirmé'),
(2, 4, 46, CURRENT_DATE - 14, 'Trajet publié sur app'),
(2, 5, 46, CURRENT_DATE - 13, 'Collègue embarqué'),
(2, 4, 50, CURRENT_DATE - 15, 'Publication trajet'),
(2, 5, 50, CURRENT_DATE - 14, 'Deux passagers'),
(2, 4, 66, CURRENT_DATE - 14, 'Trajet partagé'),
(2, 5, 66, CURRENT_DATE - 13, 'Collègue confirmé'),
(2, 4, 72, CURRENT_DATE - 15, 'BlaBlaCar Daily trajet'),
(2, 5, 72, CURRENT_DATE - 14, 'Passager: Franck Ortega'),
(2, 4, 86, CURRENT_DATE - 14, 'Trajet covoiturage publié'),
(2, 5, 86, CURRENT_DATE - 13, 'Collègue embarqué'),
(2, 4, 93, CURRENT_DATE - 15, 'Publication trajet'),
(2, 5, 93, CURRENT_DATE - 14, 'Passager confirmé');

-- Défi 3 (Vélo Challenge) — sous-groupe ayant validé défi 2
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(3, 7, 6,  CURRENT_DATE - 8, 'Strava : 3 jours consécutifs validés'),
(3, 8, 6,  CURRENT_DATE - 7, 'Parking vélo utilisé J1, J2, J3'),
(3, 9, 6,  CURRENT_DATE - 6, 'Check freins et pneus effectué'),
(3, 7, 10, CURRENT_DATE - 9, '3 jours vélo confirmés sur app'),
(3, 8, 10, CURRENT_DATE - 8, 'Place parking vélo sécurisée'),
(3, 9, 10, CURRENT_DATE - 7, 'Entretien vélo fait'),
(3, 7, 14, CURRENT_DATE - 8, 'Strava 3 jours'),
(3, 8, 14, CURRENT_DATE - 7, 'Parking vélo photo'),
(3, 7, 16, CURRENT_DATE - 9, 'Strava vélo challenge'),
(3, 8, 16, CURRENT_DATE - 8, 'Parking photo'),
(3, 9, 16, CURRENT_DATE - 7, 'Vélo entretenu'),
(3, 7, 33, CURRENT_DATE - 8, '3 jours vélo bouclés'),
(3, 8, 33, CURRENT_DATE - 7, 'Parking sécurisé utilisé'),
(3, 7, 40, CURRENT_DATE - 9, 'Strava 3 jours validés'),
(3, 8, 40, CURRENT_DATE - 8, 'Photo parking vélo'),
(3, 9, 40, CURRENT_DATE - 7, 'Entretien effectué'),
(3, 7, 50, CURRENT_DATE - 8, 'App vélo 3 jours'),
(3, 7, 86, CURRENT_DATE - 7, 'Strava : 3 jours vélo'),
(3, 8, 86, CURRENT_DATE - 6, 'Parking sécurisé photo'),
(3, 9, 86, CURRENT_DATE - 5, 'Vélo vérifié avant départ'),
(3, 7, 93, CURRENT_DATE - 8, 'Strava validé'),
(3, 8, 93, CURRENT_DATE - 7, 'Parking photo');

-- --- ÉNERGIE ---

-- Défi 4 (Éteignez la lumière)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(4, 10, 6,  CURRENT_DATE - 18, 'Checklist soir remplie'),
(4, 11, 6,  CURRENT_DATE - 17, 'Stores ouverts toute la journée'),
(4, 12, 6,  CURRENT_DATE - 16, 'Rappel collègues effectué'),
(4, 10, 7,  CURRENT_DATE - 18, 'Lumières éteintes en partant'),
(4, 11, 7,  CURRENT_DATE - 17, 'Lumière naturelle favorisée'),
(4, 10, 8,  CURRENT_DATE - 19, 'Éteint chaque soir'),
(4, 11, 8,  CURRENT_DATE - 18, 'Stores utilisés en journée'),
(4, 12, 8,  CURRENT_DATE - 17, 'Collègues sensibilisés'),
(4, 10, 9,  CURRENT_DATE - 18, 'Check soir fait'),
(4, 10, 11, CURRENT_DATE - 17, 'Lumières éteintes'),
(4, 11, 11, CURRENT_DATE - 16, 'Lumière naturelle'),
(4, 10, 13, CURRENT_DATE - 18, 'Checklist remplie'),
(4, 12, 13, CURRENT_DATE - 17, 'Rappel collègues'),
(4, 10, 15, CURRENT_DATE - 17, 'Éteint chaque soir'),
(4, 10, 18, CURRENT_DATE - 18, 'Check effectué'),
(4, 11, 18, CURRENT_DATE - 17, 'Lumière naturelle toute la journée'),
(4, 10, 20, CURRENT_DATE - 19, 'Éteint en partant'),
(4, 10, 25, CURRENT_DATE - 17, 'Checklist remplie'),
(4, 10, 31, CURRENT_DATE - 18, 'Lumières éteintes chaque soir'),
(4, 11, 31, CURRENT_DATE - 17, 'Stores utilisés'),
(4, 12, 31, CURRENT_DATE - 16, 'Rappel fait à l''équipe'),
(4, 10, 36, CURRENT_DATE - 18, 'Éteint le soir'),
(4, 10, 42, CURRENT_DATE - 17, 'Checklist soir'),
(4, 10, 47, CURRENT_DATE - 18, 'Éteint chaque soir cette semaine'),
(4, 11, 47, CURRENT_DATE - 17, 'Lumière naturelle préférée'),
(4, 10, 54, CURRENT_DATE - 18, 'Check fait'),
(4, 10, 67, CURRENT_DATE - 19, 'Éteint chaque soir'),
(4, 11, 67, CURRENT_DATE - 18, 'Stores ouverts'),
(4, 10, 73, CURRENT_DATE - 17, 'Lumières éteintes'),
(4, 10, 80, CURRENT_DATE - 18, 'Checklist remplie'),
(4, 10, 87, CURRENT_DATE - 19, 'Check chaque soir'),
(4, 11, 87, CURRENT_DATE - 18, 'Lumière naturelle'),
(4, 12, 87, CURRENT_DATE - 17, 'Rappel collègues fait'),
(4, 10, 94, CURRENT_DATE - 17, 'Éteint en partant');

-- Défi 5 (Mode Veille Interdit) — nécessite défi 4 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(5, 13, 6,  CURRENT_DATE - 12, 'PC éteint chaque soir'),
(5, 14, 6,  CURRENT_DATE - 11, 'Chargeurs débranchés'),
(5, 15, 6,  CURRENT_DATE - 10, 'Aucun écran allumé la nuit'),
(5, 13, 7,  CURRENT_DATE - 12, 'PC complètement éteint'),
(5, 14, 7,  CURRENT_DATE - 11, 'Multiprise éteinte'),
(5, 13, 8,  CURRENT_DATE - 13, 'PC éteint confirmé'),
(5, 14, 8,  CURRENT_DATE - 12, 'Chargeurs débranchés'),
(5, 15, 8,  CURRENT_DATE - 11, 'Écrans off'),
(5, 13, 11, CURRENT_DATE - 12, 'PC éteint'),
(5, 14, 11, CURRENT_DATE - 11, 'Chargeurs retirés'),
(5, 13, 13, CURRENT_DATE - 13, 'PC hors tension'),
(5, 15, 13, CURRENT_DATE - 12, 'Pas d''écran la nuit'),
(5, 13, 18, CURRENT_DATE - 12, 'PC éteint'),
(5, 14, 18, CURRENT_DATE - 11, 'Chargeurs débranchés'),
(5, 13, 31, CURRENT_DATE - 13, 'PC éteint chaque soir'),
(5, 14, 31, CURRENT_DATE - 12, 'Multiprise coupée'),
(5, 15, 31, CURRENT_DATE - 11, 'Aucun écran la nuit'),
(5, 13, 36, CURRENT_DATE - 12, 'PC complètement éteint'),
(5, 13, 47, CURRENT_DATE - 12, 'PC off chaque soir'),
(5, 14, 47, CURRENT_DATE - 11, 'Chargeurs retirés'),
(5, 13, 67, CURRENT_DATE - 11, 'PC éteint'),
(5, 13, 87, CURRENT_DATE - 12, 'PC hors tension chaque soir'),
(5, 14, 87, CURRENT_DATE - 11, 'Multiprise éteinte'),
(5, 15, 87, CURRENT_DATE - 10, 'Aucun écran allumé');

-- Défi 6 (Thermostat Éco) — nécessite défi 5 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(6, 16, 6,  CURRENT_DATE - 5, 'Thermostat réduit d''un degré'),
(6, 17, 6,  CURRENT_DATE - 4, 'Pull porté toute la semaine'),
(6, 18, 6,  CURRENT_DATE - 3, 'Fenêtres vérifiées chaque matin'),
(6, 16, 7,  CURRENT_DATE - 5, 'Thermostat baissé'),
(6, 17, 7,  CURRENT_DATE - 4, 'Pull au bureau'),
(6, 16, 8,  CURRENT_DATE - 6, 'Réglage thermostat confirmé'),
(6, 17, 8,  CURRENT_DATE - 5, 'Pull et plaid utilisés'),
(6, 18, 8,  CURRENT_DATE - 4, 'Fenêtres fermées le soir'),
(6, 16, 31, CURRENT_DATE - 5, 'Thermostat réduit'),
(6, 17, 31, CURRENT_DATE - 4, 'Pull porté'),
(6, 18, 31, CURRENT_DATE - 3, 'Fenêtres fermées'),
(6, 16, 87, CURRENT_DATE - 5, 'Réglage thermostat'),
(6, 17, 87, CURRENT_DATE - 4, 'Pull au travail'),
(6, 18, 87, CURRENT_DATE - 3, 'Fenêtres vérifiées');

-- --- DÉCHETS ---

-- Défi 7 (Lunch Zéro Déchet)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(7, 19, 6,  CURRENT_DATE - 17, 'Lunch box utilisée chaque jour'),
(7, 20, 6,  CURRENT_DATE - 16, 'Couverts bambou apportés'),
(7, 21, 6,  CURRENT_DATE - 15, 'Gourde inox utilisée'),
(7, 19, 9,  CURRENT_DATE - 17, 'Lunch box photo'),
(7, 20, 9,  CURRENT_DATE - 16, 'Couverts personnels'),
(7, 21, 9,  CURRENT_DATE - 15, 'Gourde photo'),
(7, 19, 12, CURRENT_DATE - 18, 'Boîte repas réutilisable'),
(7, 20, 12, CURRENT_DATE - 17, 'Couverts en bois'),
(7, 19, 17, CURRENT_DATE - 17, 'Lunch box'),
(7, 21, 17, CURRENT_DATE - 16, 'Gourde inox'),
(7, 19, 21, CURRENT_DATE - 18, 'Boîte repas photo'),
(7, 20, 21, CURRENT_DATE - 17, 'Couverts réutilisables'),
(7, 21, 21, CURRENT_DATE - 16, 'Gourde photo'),
(7, 19, 27, CURRENT_DATE - 17, 'Lunch box utilisée'),
(7, 19, 32, CURRENT_DATE - 18, 'Boîte repas'),
(7, 20, 32, CURRENT_DATE - 17, 'Couverts bambou'),
(7, 19, 39, CURRENT_DATE - 17, 'Lunch box photo'),
(7, 21, 39, CURRENT_DATE - 16, 'Gourde'),
(7, 19, 48, CURRENT_DATE - 18, 'Boîte repas réutilisable'),
(7, 20, 48, CURRENT_DATE - 17, 'Couverts personnels'),
(7, 21, 48, CURRENT_DATE - 16, 'Gourde inox photo'),
(7, 19, 53, CURRENT_DATE - 17, 'Lunch box'),
(7, 19, 59, CURRENT_DATE - 18, 'Boîte repas'),
(7, 20, 59, CURRENT_DATE - 17, 'Couverts réutilisables'),
(7, 19, 69, CURRENT_DATE - 17, 'Lunch box photo'),
(7, 21, 69, CURRENT_DATE - 16, 'Gourde photo'),
(7, 19, 76, CURRENT_DATE - 18, 'Boîte repas'),
(7, 20, 76, CURRENT_DATE - 17, 'Couverts bambou'),
(7, 19, 88, CURRENT_DATE - 17, 'Lunch box utilisée'),
(7, 20, 88, CURRENT_DATE - 16, 'Couverts personnels'),
(7, 21, 88, CURRENT_DATE - 15, 'Gourde inox'),
(7, 19, 95, CURRENT_DATE - 18, 'Boîte repas photo'),
(7, 21, 95, CURRENT_DATE - 16, 'Gourde');

-- Défi 8 (Semaine sans Plastique) — nécessite défi 7 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(8, 22, 6,  CURRENT_DATE - 10, 'Sac tissu systématique'),
(8, 23, 6,  CURRENT_DATE - 9,  'Vrac utilisé cette semaine'),
(8, 24, 6,  CURRENT_DATE - 8,  'Plastiques évitables listés'),
(8, 22, 9,  CURRENT_DATE - 10, 'Sac réutilisable'),
(8, 23, 9,  CURRENT_DATE - 9,  'Pas d''emballage plastique'),
(8, 22, 12, CURRENT_DATE - 11, 'Sac tissu'),
(8, 23, 12, CURRENT_DATE - 10, 'Produits sans plastique choisis'),
(8, 24, 12, CURRENT_DATE - 9,  'Plastiques bureau identifiés'),
(8, 22, 21, CURRENT_DATE - 10, 'Sac réutilisable'),
(8, 23, 21, CURRENT_DATE - 9,  'Vrac favori'),
(8, 22, 32, CURRENT_DATE - 11, 'Sac tissu'),
(8, 23, 32, CURRENT_DATE - 10, 'Pas d''emballage'),
(8, 22, 48, CURRENT_DATE - 10, 'Sac réutilisable'),
(8, 23, 48, CURRENT_DATE - 9,  'Produits vrac'),
(8, 24, 48, CURRENT_DATE - 8,  'Plastiques identifiés'),
(8, 22, 59, CURRENT_DATE - 11, 'Sac tissu'),
(8, 22, 69, CURRENT_DATE - 10, 'Sac réutilisable'),
(8, 23, 69, CURRENT_DATE - 9,  'Emballages évités'),
(8, 22, 88, CURRENT_DATE - 10, 'Sac tissu'),
(8, 23, 88, CURRENT_DATE - 9,  'Vrac utilisé'),
(8, 24, 88, CURRENT_DATE - 8,  'Plastiques bureau signalés');

-- Défi 9 (Tri Master) — nécessite défi 8 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(9, 25, 6,  CURRENT_DATE - 3, 'Tri papier/carton chaque jour'),
(9, 26, 6,  CURRENT_DATE - 2, 'Plastiques et métaux triés'),
(9, 27, 6,  CURRENT_DATE - 1, 'Compost utilisé'),
(9, 25, 9,  CURRENT_DATE - 3, 'Tri papier bon'),
(9, 26, 9,  CURRENT_DATE - 2, 'Plastiques triés'),
(9, 25, 12, CURRENT_DATE - 4, 'Carton trié'),
(9, 26, 12, CURRENT_DATE - 3, 'Plastique métal tri'),
(9, 27, 12, CURRENT_DATE - 2, 'Compost'),
(9, 25, 48, CURRENT_DATE - 3, 'Papier carton trié'),
(9, 26, 48, CURRENT_DATE - 2, 'Plastiques triés'),
(9, 25, 88, CURRENT_DATE - 3, 'Tri effectué'),
(9, 26, 88, CURRENT_DATE - 2, 'Métal trié'),
(9, 27, 88, CURRENT_DATE - 1, 'Compost utilisé');

-- --- ALIMENTATION ---

-- Défi 10 (Repas Veggie)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(10, 28, 6,  CURRENT_DATE - 16, 'Menu végé cantine photo'),
(10, 29, 6,  CURRENT_DATE - 15, 'Recette curry pois chiches testée'),
(10, 30, 6,  CURRENT_DATE - 14, 'Plat partagé avec l''équipe'),
(10, 28, 8,  CURRENT_DATE - 16, 'Repas végétarien midi'),
(10, 29, 8,  CURRENT_DATE - 15, 'Nouvelle recette testée'),
(10, 28, 10, CURRENT_DATE - 17, 'Menu cantine végé'),
(10, 29, 10, CURRENT_DATE - 16, 'Recette veggie testée'),
(10, 30, 10, CURRENT_DATE - 15, 'Plat partagé'),
(10, 28, 19, CURRENT_DATE - 16, 'Menu végé photo'),
(10, 29, 19, CURRENT_DATE - 15, 'Recette testée'),
(10, 28, 22, CURRENT_DATE - 17, 'Repas veggie'),
(10, 28, 35, CURRENT_DATE - 16, 'Cantine menu végé'),
(10, 29, 35, CURRENT_DATE - 15, 'Recette nouvelle'),
(10, 28, 38, CURRENT_DATE - 17, 'Repas végétarien'),
(10, 29, 38, CURRENT_DATE - 16, 'Recette testée'),
(10, 30, 38, CURRENT_DATE - 15, 'Plat partagé collègues'),
(10, 28, 49, CURRENT_DATE - 16, 'Menu végé'),
(10, 28, 54, CURRENT_DATE - 17, 'Repas veggie midi'),
(10, 29, 54, CURRENT_DATE - 16, 'Recette testée'),
(10, 28, 63, CURRENT_DATE - 16, 'Menu cantine photo'),
(10, 28, 70, CURRENT_DATE - 17, 'Repas végétarien'),
(10, 29, 70, CURRENT_DATE - 16, 'Recette veggie'),
(10, 30, 70, CURRENT_DATE - 15, 'Plat partagé'),
(10, 28, 75, CURRENT_DATE - 16, 'Menu végé photo'),
(10, 28, 82, CURRENT_DATE - 17, 'Repas végétarien midi'),
(10, 29, 82, CURRENT_DATE - 16, 'Recette testée'),
(10, 28, 89, CURRENT_DATE - 16, 'Menu cantine végé'),
(10, 29, 89, CURRENT_DATE - 15, 'Recette testée'),
(10, 30, 89, CURRENT_DATE - 14, 'Plat maison partagé'),
(10, 28, 97, CURRENT_DATE - 17, 'Repas veggie');

-- Défi 11 (Local & Saison) — nécessite défi 10 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(11, 31, 6,  CURRENT_DATE - 8, 'Marché local samedi matin'),
(11, 32, 6,  CURRENT_DATE - 7, 'Étiquettes vérifiées'),
(11, 33, 6,  CURRENT_DATE - 6, 'Fraises espagnoles refusées en janvier'),
(11, 31, 8,  CURRENT_DATE - 8, 'Marché du quartier'),
(11, 32, 8,  CURRENT_DATE - 7, 'Origine produits vérifiée'),
(11, 31, 10, CURRENT_DATE - 9, 'Marché local fréquenté'),
(11, 32, 10, CURRENT_DATE - 8, 'Étiquettes lues'),
(11, 33, 10, CURRENT_DATE - 7, 'Hors-saison refusé'),
(11, 31, 35, CURRENT_DATE - 8, 'Marché Capitole'),
(11, 32, 35, CURRENT_DATE - 7, 'Étiquettes contrôlées'),
(11, 31, 38, CURRENT_DATE - 9, 'Marché local'),
(11, 32, 38, CURRENT_DATE - 8, 'Origine vérifiée'),
(11, 33, 38, CURRENT_DATE - 7, 'Produits de saison uniquement'),
(11, 31, 70, CURRENT_DATE - 8, 'Marché local fréquenté'),
(11, 32, 70, CURRENT_DATE - 7, 'Étiquettes vérifiées'),
(11, 31, 89, CURRENT_DATE - 8, 'Marché du quartier'),
(11, 32, 89, CURRENT_DATE - 7, 'Étiquettes contrôlées'),
(11, 33, 89, CURRENT_DATE - 6, 'Hors-saison refusé');

-- Défi 12 (Zéro Gaspi) — nécessite défi 11 validé
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve) VALUES
(12, 34, 6,  CURRENT_DATE - 2, 'Assiette finie chaque jour'),
(12, 35, 6,  CURRENT_DATE - 1, 'Restes conservés au frigo'),
(12, 36, 6,  CURRENT_DATE,     'Liste de courses faite le dimanche'),
(12, 34, 8,  CURRENT_DATE - 2, 'Rien jeté cette semaine'),
(12, 35, 8,  CURRENT_DATE - 1, 'Restes en lunch box'),
(12, 34, 10, CURRENT_DATE - 3, 'Assiette terminée'),
(12, 35, 10, CURRENT_DATE - 2, 'Restes conservés'),
(12, 36, 10, CURRENT_DATE - 1, 'Planning repas semaine fait'),
(12, 34, 38, CURRENT_DATE - 2, 'Rien gaspillé'),
(12, 35, 38, CURRENT_DATE - 1, 'Restes frigo'),
(12, 36, 38, CURRENT_DATE,     'Liste de courses'),
(12, 34, 89, CURRENT_DATE - 2, 'Assiette finie'),
(12, 35, 89, CURRENT_DATE - 1, 'Restes conservés');

-- ============================================================
-- 15. RÉPONSES À LA MODÉRATION (Reponse_Defi)
-- ============================================================
INSERT INTO Reponse_Defi (Id_defi, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_reponse, date_traitement, Id_Animateur_traitement) VALUES
-- Pending
(1, 19, 'J ai pris les transports toute la semaine sans ma voiture.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, NULL),
(1, 22, 'Venue à vélo 4 jours sur 5, le vendredi il pleuvait.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL),
(4, 23, 'Lumières éteintes chaque soir cette semaine, mes collègues aussi.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, NULL),
(7, 27, 'Lunch box et gourde utilisées toute la semaine, zéro plastique.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '3 hours', NULL, NULL),
(10, 49, 'Menu végétarien midi toute la semaine, avec une recette maison partagée.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '5 hours', NULL, NULL),
(2, 29, 'Groupe de covoiturage créé avec 3 collègues, trajet partagé chaque matin.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '12 hours', NULL, NULL),
(5, 13, 'PC éteint chaque soir, chargeurs débranchés, multiprise coupée.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL),
(8, 53, 'Semaine entière sans plastique, j ai découvert des alternatives au vrac.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '6 hours', NULL, NULL),
-- Approved
(1, 26, 'J ai utilisé le vélo tous les jours cette semaine, 8 km aller.', 'approved', 'Super effort, continuez comme ça !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 3),
(1, 28, 'Trajet à pied 2 km chaque matin et soir.', 'approved', 'Bravo pour cet engagement quotidien.', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 3),
(4, 31, 'Checklist d extinction remplie chaque soir, collègues sensibilisés.', 'approved', 'Initiative collective très appréciée.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 4),
(7, 32, 'Lunch box et couverts bambou toute la semaine.', 'approved', 'Parfait, aucun plastique reporté !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 3),
(10, 35, 'Végétarien le midi toute la semaine, recette partagée.', 'approved', 'Excellent, et la recette a l air délicieuse !', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 4),
(2, 40, 'Groupe de covoiturage avec 4 collègues organisé, actif chaque jour.', 'approved', 'Organisation parfaite, keep it up !', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 5),
(1, 46, 'Vélo et transports en commun alternés, zéro voiture.', 'approved', 'Belle combinaison de mobilité douce.', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 3),
(4, 47, 'Lumières éteintes, lumière naturelle favorisée en journée.', 'approved', 'Très bien, pensez aussi aux couloirs.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 4),
(7, 48, 'Zéro emballage jetable cette semaine au bureau.', 'approved', 'Exemplaire !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 5),
(10, 54, 'Repas végé toute la semaine, curry pois chiches fait maison.', 'approved', 'Très motivant pour toute l équipe.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3),
(1, 66, 'Transports en commun toute la semaine, abonnement mensuel.', 'approved', 'Démarche cohérente et durable.', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 5),
(7, 69, 'Lunch box et gourde : aucun déchet plastique.', 'approved', 'Super, à maintenir chaque semaine !', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3),
(10, 70, 'Végétarien midi et plat partagé avec l équipe vendredi.', 'approved', 'Superbe initiative collective !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 4),
(1, 86, 'Vélo toute la semaine, 11 km aller-retour par jour.', 'approved', 'Champion ! Belle régularité.', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 5),
(4, 87, 'Tous les appareils éteints chaque soir, equipe sensibilisée.', 'approved', 'Très bonne démarche collective.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3),
(7, 88, 'Semaine zéro plastique, gourde, lunch box et couverts personnels.', 'approved', 'Modèle à suivre !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 4),
-- Rejected
(3, 30, 'J ai fait du vélo 2 jours, le 3ème j avais une réunion tôt.', 'rejected', 'Merci pour l effort, mais le défi exige 3 jours consécutifs. Réessayez la semaine prochaine.', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days', 3),
(6, 34, 'J ai baissé le chauffage chez moi mais pas au bureau.', 'rejected', 'Le défi concerne le cadre professionnel, merci de recommencer en ciblant le bureau.', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 4),
(9, 51, 'J ai essayé de trier mais je n étais pas sûr des consignes.', 'rejected', 'Consultez le guide de tri sur l intranet et retentez, vous pouvez le faire !', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 5),
(11, 80, 'J ai acheté des tomates mais je ne sais pas si elles étaient locales.', 'rejected', 'Pensez à demander au vendeur ou à vérifier les étiquettes. Bon courage.', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3),
(3, 92, 'Vélo 1 jour seulement, il manquait de la place dans le parking.', 'rejected', 'Le parking vélo a des places réservées. Contactez l accueil pour une place dédiée.', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 4);

-- ============================================================
-- 16. BADGES OBTENUS PAR LES EMPLOYÉS (Obtenir_Em)
--     Les triggers T7/T13 s'activent sur INSERT → points déjà
--     définis directement sur l'employé, badges insérés manuellement
--     pour éviter les doubles (le seed bypasse les triggers de points).
-- ============================================================
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
-- Premier Pas (badge 1) — tout le monde ayant au moins 1 action validée
(1, 6,   CURRENT_DATE - 20),
(1, 7,   CURRENT_DATE - 20),
(1, 8,   CURRENT_DATE - 20),
(1, 9,   CURRENT_DATE - 20),
(1, 10,  CURRENT_DATE - 21),
(1, 11,  CURRENT_DATE - 18),
(1, 12,  CURRENT_DATE - 22),
(1, 13,  CURRENT_DATE - 18),
(1, 14,  CURRENT_DATE - 19),
(1, 15,  CURRENT_DATE - 17),
(1, 16,  CURRENT_DATE - 23),
(1, 17,  CURRENT_DATE - 18),
(1, 18,  CURRENT_DATE - 18),
(1, 19,  CURRENT_DATE - 16),
(1, 20,  CURRENT_DATE - 19),
(1, 21,  CURRENT_DATE - 18),
(1, 22,  CURRENT_DATE - 17),
(1, 24,  CURRENT_DATE - 20),
(1, 25,  CURRENT_DATE - 17),
(1, 26,  CURRENT_DATE - 20),
(1, 27,  CURRENT_DATE - 17),
(1, 28,  CURRENT_DATE - 21),
(1, 29,  CURRENT_DATE - 16),
(1, 30,  CURRENT_DATE - 19),
(1, 31,  CURRENT_DATE - 18),
(1, 32,  CURRENT_DATE - 18),
(1, 33,  CURRENT_DATE - 19),
(1, 35,  CURRENT_DATE - 16),
(1, 36,  CURRENT_DATE - 18),
(1, 38,  CURRENT_DATE - 17),
(1, 39,  CURRENT_DATE - 17),
(1, 40,  CURRENT_DATE - 22),
(1, 42,  CURRENT_DATE - 17),
(1, 43,  CURRENT_DATE - 16),
(1, 46,  CURRENT_DATE - 20),
(1, 47,  CURRENT_DATE - 18),
(1, 48,  CURRENT_DATE - 18),
(1, 49,  CURRENT_DATE - 16),
(1, 50,  CURRENT_DATE - 21),
(1, 51,  CURRENT_DATE - 21),
(1, 53,  CURRENT_DATE - 17),
(1, 54,  CURRENT_DATE - 18),
(1, 59,  CURRENT_DATE - 18),
(1, 63,  CURRENT_DATE - 16),
(1, 66,  CURRENT_DATE - 19),
(1, 67,  CURRENT_DATE - 19),
(1, 69,  CURRENT_DATE - 17),
(1, 70,  CURRENT_DATE - 17),
(1, 72,  CURRENT_DATE - 21),
(1, 73,  CURRENT_DATE - 17),
(1, 75,  CURRENT_DATE - 16),
(1, 76,  CURRENT_DATE - 18),
(1, 80,  CURRENT_DATE - 18),
(1, 82,  CURRENT_DATE - 17),
(1, 86,  CURRENT_DATE - 20),
(1, 87,  CURRENT_DATE - 19),
(1, 88,  CURRENT_DATE - 17),
(1, 89,  CURRENT_DATE - 16),
(1, 93,  CURRENT_DATE - 22),
(1, 94,  CURRENT_DATE - 17),
(1, 95,  CURRENT_DATE - 17),
(1, 97,  CURRENT_DATE - 17),
(1, 99,  CURRENT_DATE - 16)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Écolo Confirmé (badge 2) — employés avec beaucoup d'actions
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(2, 6,   CURRENT_DATE - 15),
(2, 8,   CURRENT_DATE - 15),
(2, 10,  CURRENT_DATE - 16),
(2, 12,  CURRENT_DATE - 14),
(2, 14,  CURRENT_DATE - 15),
(2, 16,  CURRENT_DATE - 17),
(2, 33,  CURRENT_DATE - 14),
(2, 40,  CURRENT_DATE - 15),
(2, 46,  CURRENT_DATE - 14),
(2, 48,  CURRENT_DATE - 13),
(2, 50,  CURRENT_DATE - 15),
(2, 86,  CURRENT_DATE - 14),
(2, 87,  CURRENT_DATE - 13),
(2, 88,  CURRENT_DATE - 12),
(2, 89,  CURRENT_DATE - 13),
(2, 93,  CURRENT_DATE - 14)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Champion Vert (badge 3) — top performers
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(3, 6,   CURRENT_DATE - 5),
(3, 10,  CURRENT_DATE - 6),
(3, 16,  CURRENT_DATE - 7),
(3, 40,  CURRENT_DATE - 5),
(3, 86,  CURRENT_DATE - 4),
(3, 93,  CURRENT_DATE - 5)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Zéro Carbone (badge 4) — CO2 > 100
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(4, 6,   CURRENT_DATE - 10),
(4, 10,  CURRENT_DATE - 11),
(4, 16,  CURRENT_DATE - 12),
(4, 24,  CURRENT_DATE - 10),
(4, 33,  CURRENT_DATE - 9),
(4, 40,  CURRENT_DATE - 10),
(4, 50,  CURRENT_DATE - 11),
(4, 54,  CURRENT_DATE - 9),
(4, 68,  CURRENT_DATE - 10),
(4, 72,  CURRENT_DATE - 11),
(4, 77,  CURRENT_DATE - 9),
(4, 82,  CURRENT_DATE - 10),
(4, 86,  CURRENT_DATE - 8),
(4, 89,  CURRENT_DATE - 9),
(4, 93,  CURRENT_DATE - 10),
(4, 97,  CURRENT_DATE - 9)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Mobilité Douce (badge 5)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(5, 6,   CURRENT_DATE - 6),
(5, 10,  CURRENT_DATE - 7),
(5, 14,  CURRENT_DATE - 6),
(5, 16,  CURRENT_DATE - 7),
(5, 33,  CURRENT_DATE - 6),
(5, 40,  CURRENT_DATE - 7),
(5, 50,  CURRENT_DATE - 6),
(5, 86,  CURRENT_DATE - 5),
(5, 93,  CURRENT_DATE - 6)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Énergie Sage (badge 6)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(6, 6,   CURRENT_DATE - 3),
(6, 7,   CURRENT_DATE - 3),
(6, 8,   CURRENT_DATE - 4),
(6, 31,  CURRENT_DATE - 3),
(6, 87,  CURRENT_DATE - 2)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Zéro Déchet (badge 7)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(7, 6,   CURRENT_DATE - 1),
(7, 9,   CURRENT_DATE - 1),
(7, 12,  CURRENT_DATE - 2),
(7, 48,  CURRENT_DATE - 1),
(7, 88,  CURRENT_DATE - 1)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- Végéhéros (badge 8)
INSERT INTO Obtenir_Em (Id_Badge, Id_Employe, dateObtention) VALUES
(8, 6,   CURRENT_DATE),
(8, 8,   CURRENT_DATE),
(8, 10,  CURRENT_DATE),
(8, 38,  CURRENT_DATE),
(8, 89,  CURRENT_DATE)
ON CONFLICT (Id_Badge, Id_Employe) DO NOTHING;

-- ============================================================
-- 17. BADGES ÉQUIPES (Obtenir_Eq)
-- ============================================================
INSERT INTO Obtenir_Eq (Id_equipe, Id_Badge, dateObtention) VALUES
(1, 9,  CURRENT_DATE - 5),   -- Équipe Unie : Les Colibris
(2, 9,  CURRENT_DATE - 4),   -- Équipe Unie : Team Chlorophylle
(3, 9,  CURRENT_DATE - 6),   -- Équipe Unie : Éco Warriors
(5, 9,  CURRENT_DATE - 3),   -- Équipe Unie : Green Hackers
(1, 10, CURRENT_DATE - 2),   -- Podium : Les Colibris (top 3)
(5, 10, CURRENT_DATE - 1)    -- Podium : Green Hackers (top 3)
ON CONFLICT (Id_equipe, Id_Badge) DO NOTHING;

-- ============================================================
-- 18. NOTIFICATIONS manuelles (hors triggers)
-- ============================================================
INSERT INTO Notification (nomNotif, dateNotif, lienRedirection) VALUES
('Bienvenue sur GreenPulse !',                    CURRENT_DATE - 30, '/accueil'),
('Nouveau défi disponible : Zéro Voiture',         CURRENT_DATE - 25, '/defis/1'),
('Nouveau défi disponible : Covoiturage Express',  CURRENT_DATE - 24, '/defis/2'),
('Nouveau défi disponible : Vélo Challenge',       CURRENT_DATE - 23, '/defis/3'),
('Nouveau défi disponible : Éteignez la lumière',  CURRENT_DATE - 22, '/defis/4'),
('Nouveau défi disponible : Mode Veille Interdit', CURRENT_DATE - 21, '/defis/5'),
('Nouveau défi disponible : Thermostat Éco',       CURRENT_DATE - 20, '/defis/6'),
('Nouveau défi disponible : Lunch Zéro Déchet',    CURRENT_DATE - 19, '/defis/7'),
('Nouveau défi disponible : Semaine sans Plastique',CURRENT_DATE - 18,'/defis/8'),
('Nouveau défi disponible : Tri Master',           CURRENT_DATE - 17, '/defis/9'),
('Nouveau défi disponible : Repas Veggie',         CURRENT_DATE - 16, '/defis/10'),
('Nouveau défi disponible : Local & Saison',       CURRENT_DATE - 15, '/defis/11'),
('Nouveau défi disponible : Zéro Gaspi',           CURRENT_DATE - 14, '/defis/12'),
('Classement mis à jour : Les Colibris en tête !', CURRENT_DATE - 7,  '/classement'),
('Rappel : 3 jours restants pour le défi du mois', CURRENT_DATE - 3,  '/defis');

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
