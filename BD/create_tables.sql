-- ============================================================
-- Script de création des tables - Application Gamification RSE
-- Base : PostgreSQL | Cours SQL - Université Toulouse III
-- ============================================================

-- ============================================================
-- 1. ENTITÉS PRINCIPALES
-- ============================================================

CREATE TABLE Entreprise (
    Id_Entreprise   SERIAL          CONSTRAINT pk_Entreprise PRIMARY KEY,
    nomEntreprise   VARCHAR(100)    CONSTRAINT nn_nom_Entreprise NOT NULL,
    secteurEntreprise VARCHAR(100)
);

CREATE TABLE Equipe (
    Id_equipe       SERIAL          CONSTRAINT pk_Equipe PRIMARY KEY,
    nomEquipe       VARCHAR(100)    CONSTRAINT nn_nom_Equipe NOT NULL
                                    CONSTRAINT u_nom_Equipe UNIQUE,
    pdpEquipe       VARCHAR(255),
    nbPointsEquipe  INT             CONSTRAINT ck_pts_Equipe CHECK (nbPointsEquipe >= 0)
                                    DEFAULT 0,
    nbCO2Equipe     INT             CONSTRAINT ck_co2_Equipe CHECK (nbCO2Equipe >= 0)
                                    DEFAULT 0
);

CREATE TABLE Actions (
    Id_actions          SERIAL          CONSTRAINT pk_Actions PRIMARY KEY,
    nomAction           VARCHAR(150)    CONSTRAINT nn_nom_Actions NOT NULL,
    descriptionAction   TEXT
);

CREATE TABLE Thematique (
    Id_thematique       SERIAL          CONSTRAINT pk_Thematique PRIMARY KEY,
    nomTheme            VARCHAR(100)    CONSTRAINT nn_nom_Thematique NOT NULL,
    descriptionTheme    TEXT
);

CREATE TABLE Badge (
    Id_Badge            SERIAL          CONSTRAINT pk_Badge PRIMARY KEY,
    nomBadge            VARCHAR(100)    CONSTRAINT nn_nom_Badge NOT NULL,
    descriptionBadge    TEXT,
    iconeBadge          VARCHAR(255)
);

CREATE TABLE Notification (
    id_notif        SERIAL          CONSTRAINT pk_Notification PRIMARY KEY,
    nomNotif        VARCHAR(150)    CONSTRAINT nn_nom_Notif NOT NULL,
    dateNotif       DATE            CONSTRAINT nn_date_Notif NOT NULL,
    lienRedirection VARCHAR(255)
);

-- ============================================================
-- 2. UTILISATEURS ET RÔLES
-- Héritage par spécialisation (tables filles référencent UTILISATEUR)
-- ============================================================

CREATE TABLE Utilisateur (
    Id_User         SERIAL          CONSTRAINT pk_Utilisateur PRIMARY KEY,
    nomUser         VARCHAR(100)    CONSTRAINT nn_nom_User NOT NULL,
    prenomUser      VARCHAR(100)    CONSTRAINT nn_prenom_User NOT NULL,
    pdpUser         VARCHAR(255),
    email           VARCHAR(150)    CONSTRAINT nn_email_User NOT NULL
                                    CONSTRAINT u_email_User UNIQUE,
    statutUser      VARCHAR(20)     CONSTRAINT nn_statut_User NOT NULL
                                    CONSTRAINT ck_statut_User CHECK (statutUser IN ('actif', 'inactif', 'suspendu')),
    mdp             VARCHAR(255)    CONSTRAINT nn_mdp_User NOT NULL,
    inscriptionUser DATE            CONSTRAINT nn_inscription_User NOT NULL
                                    DEFAULT CURRENT_DATE,
    Id_Entreprise   INT             CONSTRAINT fk_User_Entreprise REFERENCES Entreprise(Id_Entreprise) NOT NULL
);

-- Spécialisation : Employé (hérite de Utilisateur)
CREATE TABLE Employe (
    Id_Employe          INT             CONSTRAINT pk_Employe PRIMARY KEY
                                        CONSTRAINT fk_Employe_User REFERENCES Utilisateur(Id_User),
    nbPointsEmploye     INT             CONSTRAINT ck_pts_Employe CHECK (nbPointsEmploye >= 0)
                                        DEFAULT 0,
    nbCO2              INT             CONSTRAINT ck_co2_Employe CHECK (nbCO2 >= 0)
                                        DEFAULT 0,
    departementEmploye  VARCHAR(100),
    Id_equipe           INT             CONSTRAINT fk_Employe_Equipe REFERENCES Equipe(Id_equipe)
);

-- Spécialisation : Administrateur (hérite de Utilisateur)
CREATE TABLE Admin (
    Id_Admin    INT     CONSTRAINT pk_Admin PRIMARY KEY
                        CONSTRAINT fk_Admin_User REFERENCES Utilisateur(Id_User)
);

-- Spécialisation : Animateur (hérite de Utilisateur)
CREATE TABLE Animateur (
    Id_Animateur    INT     CONSTRAINT pk_Animateur PRIMARY KEY
                            CONSTRAINT fk_Animateur_User REFERENCES Utilisateur(Id_User)
);

-- ============================================================
-- 3. GAMIFICATION ET INTERACTION
-- ============================================================

CREATE TABLE Defi (
    Id_defi             SERIAL          CONSTRAINT pk_Defi PRIMARY KEY,
    nomDefi             VARCHAR(150)    CONSTRAINT nn_nom_Defi NOT NULL,
    descriptionDefi     TEXT,
    nbPointsDefi        INT             CONSTRAINT nn_pts_Defi NOT NULL
                                        CONSTRAINT ck_pts_Defi CHECK (nbPointsDefi > 0),
    nbCO2Defi           INT             CONSTRAINT nn_co2_Defi NOT NULL
                                        CONSTRAINT ck_co2_Defi CHECK (nbCO2Defi >= 0),
    niveauDefi          INT             CONSTRAINT nn_niveau_Defi NOT NULL
                                        CONSTRAINT ck_niveau_Defi CHECK (niveauDefi > 0),
    Id_Animateur        INT             CONSTRAINT fk_Defi_Animateur REFERENCES Animateur(Id_Animateur) NOT NULL
);

CREATE TABLE Forum (
    Id_forum        SERIAL          CONSTRAINT pk_Forum PRIMARY KEY,
    nomForum        VARCHAR(150)    CONSTRAINT nn_nom_Forum NOT NULL,
    descriptionForum TEXT,
    Id_defi         INT             CONSTRAINT fk_Forum_Defi REFERENCES Defi(Id_defi)
);

CREATE TABLE Message (
    Id_Message      SERIAL      CONSTRAINT pk_Message PRIMARY KEY,
    contenuMessage  TEXT        CONSTRAINT nn_contenu_Message NOT NULL,
    dateMessage     DATE        CONSTRAINT nn_date_Message NOT NULL
                                DEFAULT CURRENT_DATE,
    Id_Employe      INT         CONSTRAINT fk_Message_Employe REFERENCES Employe(Id_Employe) NOT NULL,
    Id_forum        INT         CONSTRAINT fk_Message_Forum REFERENCES Forum(Id_forum) NOT NULL
);

-- ============================================================
-- 4. TABLES DE LIAISON ET ASSOCIATION
-- ============================================================

-- Regroupe : Un défi appartient à une thématique avec un ordre
-- Contrainte : unicité de l'ordre dans une thématique (Regroupe pk couvre les deux)
CREATE TABLE Regroupe (
    Id_defi         INT         CONSTRAINT fk_Regroupe_Defi REFERENCES Defi(Id_defi),
    Id_thematique   INT         CONSTRAINT fk_Regroupe_Thematique REFERENCES Thematique(Id_thematique),
    mois            DATE        CONSTRAINT nn_mois_Regroupe NOT NULL,
    ordre           INT         CONSTRAINT nn_ordre_Regroupe NOT NULL
                                CONSTRAINT ck_ordre_Regroupe CHECK (ordre > 0),
    CONSTRAINT pk_Regroupe PRIMARY KEY (Id_defi, Id_thematique),
    -- Unicité de l'ordre dans une thématique
    CONSTRAINT u_ordre_thematique UNIQUE (Id_thematique, ordre)
);

-- Faire_partie : actions associées à un défi
CREATE TABLE Faire_partie (
    Id_defi         INT     CONSTRAINT fk_FP_Defi REFERENCES Defi(Id_defi),
    Id_actions      INT     CONSTRAINT fk_FP_Actions REFERENCES Actions(Id_actions),
    CONSTRAINT pk_Faire_partie PRIMARY KEY (Id_defi, Id_actions)
);

-- Valider : validation d'une action d'un défi par un employé
-- Contrainte : une action ne peut être validée qu'une seule fois par utilisateur et par défi
CREATE TABLE Valider (
    Id_defi         INT         CONSTRAINT fk_Valider_Defi REFERENCES Defi(Id_defi),
    Id_actions      INT         CONSTRAINT fk_Valider_Actions REFERENCES Actions(Id_actions),
    Id_Employe      INT         CONSTRAINT fk_Valider_Employe REFERENCES Employe(Id_Employe),
    date_validation DATE        CONSTRAINT nn_date_Valider NOT NULL
                                DEFAULT CURRENT_DATE,
    preuve          TEXT,
    CONSTRAINT pk_Valider PRIMARY KEY (Id_defi, Id_actions, Id_Employe),
    -- L'action doit appartenir au défi
    CONSTRAINT fk_Valider_Faire_partie FOREIGN KEY (Id_defi, Id_actions)
        REFERENCES Faire_partie(Id_defi, Id_actions)
);

-- Obtenir_Em : badges obtenus par un employé
CREATE TABLE Obtenir_Em (
    Id_Badge        INT     CONSTRAINT fk_ObtEm_Badge REFERENCES Badge(Id_Badge),
    Id_Employe      INT     CONSTRAINT fk_ObtEm_Employe REFERENCES Employe(Id_Employe),
    dateObtention   DATE    CONSTRAINT nn_date_ObtEm NOT NULL
                            DEFAULT CURRENT_DATE,
    CONSTRAINT pk_Obtenir_Em PRIMARY KEY (Id_Badge, Id_Employe)
);

-- Obtenir_Eq : badges obtenus par une équipe
CREATE TABLE Obtenir_Eq (
    Id_equipe       INT     CONSTRAINT fk_ObtEq_Equipe REFERENCES Equipe(Id_equipe),
    Id_Badge        INT     CONSTRAINT fk_ObtEq_Badge REFERENCES Badge(Id_Badge),
    dateObtention   DATE    CONSTRAINT nn_date_ObtEq NOT NULL
                            DEFAULT CURRENT_DATE,
    CONSTRAINT pk_Obtenir_Eq PRIMARY KEY (Id_equipe, Id_Badge)
);

-- Recevoir : notifications reçues par les utilisateurs
CREATE TABLE Recevoir (
    Id_User     INT     CONSTRAINT fk_Recevoir_User REFERENCES Utilisateur(Id_User),
    id_notif    INT     CONSTRAINT fk_Recevoir_Notif REFERENCES Notification(id_notif),
    CONSTRAINT pk_Recevoir PRIMARY KEY (Id_User, id_notif)
);

-- ============================================================
-- COMMENTAIRES SUR LES CONTRAINTES MÉTIER NON IMPOSABLES EN DDL
-- ============================================================
-- 1. Exclusivité des rôles (Employé / Admin / Animateur) :
--    À enforcer via un trigger ou la logique applicative.
--    Un utilisateur ne doit apparaître que dans une seule table de spécialisation.
--
-- 2. Défi d'ordre N non validable si N-1 non validé :
--    À enforcer via un trigger BEFORE INSERT sur Valider.
--
-- 3. Suppression du forum/messages en fin de mois :
--    À enforcer via un job planifié (pg_cron ou applicatif).
--
-- 4. Consécutivité des ordres dans une thématique (sans trous) :
--    À enforcer via un trigger BEFORE INSERT/UPDATE sur Regroupe.
--
-- 5. Badge attribué uniquement si conditions satisfaites :
--    À enforcer via un trigger BEFORE INSERT sur Obtenir_Em et Obtenir_Eq.
--
-- 6. Points d'équipe = agrégation des points des membres :
--    À enforcer via un trigger AFTER INSERT sur Valider.
-- ============================================================
