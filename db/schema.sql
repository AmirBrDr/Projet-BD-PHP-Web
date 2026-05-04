-- ============================================================
-- Script de création des tables - Application Gamification RSE
-- Base : PostgreSQL | Cours SQL - Université Toulouse III
-- ============================================================

-- ============================================================
-- 0. NETTOYAGE (permet de relancer le script sans erreur)
-- Les tables sont supprimées dans l'ordre inverse des dépendances.
-- CASCADE propage la suppression aux contraintes FK associées.
-- ============================================================

-- Triggers : supprimés automatiquement avec leurs tables.
-- Fonctions et procédures : supprimées explicitement.
DROP PROCEDURE IF EXISTS sp_cleanup_expired_forums()              CASCADE;
DROP FUNCTION  IF EXISTS fn_notif_badge_employe()                 CASCADE;
DROP FUNCTION  IF EXISTS fn_notif_action_validee()                CASCADE;
DROP FUNCTION  IF EXISTS fn_check_ordre_update()                  CASCADE;
DROP FUNCTION  IF EXISTS fn_check_ordre_consecutif()              CASCADE;
DROP FUNCTION  IF EXISTS fn_award_equipe_badges()                 CASCADE;
DROP FUNCTION  IF EXISTS fn_award_employe_badges()                CASCADE;
DROP FUNCTION  IF EXISTS fn_equipe_a_valide_defi(INT, INT)        CASCADE;
DROP FUNCTION  IF EXISTS fn_update_equipe_points()                CASCADE;
DROP FUNCTION  IF EXISTS fn_update_employe_points()               CASCADE;
DROP FUNCTION  IF EXISTS fn_check_defi_order()                    CASCADE;
DROP FUNCTION  IF EXISTS fn_check_single_team()                   CASCADE;
DROP FUNCTION  IF EXISTS fn_check_role_exclusivity()              CASCADE;

-- Tables : ordre inverse des dépendances (enfants avant parents)
DROP TABLE IF EXISTS Recevoir      CASCADE;
DROP TABLE IF EXISTS Obtenir_Eq    CASCADE;
DROP TABLE IF EXISTS Obtenir_Em    CASCADE;
DROP TABLE IF EXISTS Reponse_Defi  CASCADE;
DROP TABLE IF EXISTS Valider       CASCADE;
DROP TABLE IF EXISTS Faire_partie  CASCADE;
DROP TABLE IF EXISTS Regroupe      CASCADE;
DROP TABLE IF EXISTS Message       CASCADE;
DROP TABLE IF EXISTS Forum         CASCADE;
DROP TABLE IF EXISTS Defi          CASCADE;
DROP TABLE IF EXISTS Animateur     CASCADE;
DROP TABLE IF EXISTS Admin         CASCADE;
DROP TABLE IF EXISTS Employe       CASCADE;
DROP TABLE IF EXISTS Utilisateur   CASCADE;
DROP TABLE IF EXISTS Notification  CASCADE;
DROP TABLE IF EXISTS Badge         CASCADE;
DROP TABLE IF EXISTS Thematique    CASCADE;
DROP TABLE IF EXISTS Actions       CASCADE;
DROP TABLE IF EXISTS Equipe        CASCADE;
DROP TABLE IF EXISTS Entreprise    CASCADE;

-- ============================================================
-- 1. ENTITÉS PRINCIPALES
-- ============================================================

CREATE TABLE Entreprise (
    Id_Entreprise     SERIAL        CONSTRAINT pk_Entreprise PRIMARY KEY,
    nomEntreprise     VARCHAR(100)  CONSTRAINT nn_nom_Entreprise NOT NULL,
    secteurEntreprise VARCHAR(100)
);

CREATE TABLE Equipe (
    Id_equipe      SERIAL        CONSTRAINT pk_Equipe PRIMARY KEY,
    nomEquipe      VARCHAR(100)  CONSTRAINT nn_nom_Equipe NOT NULL
                                 CONSTRAINT u_nom_Equipe UNIQUE,
    pdpEquipe      VARCHAR(255),
    nbPointsEquipe INT           DEFAULT 0
                                 CONSTRAINT ck_pts_Equipe CHECK (nbPointsEquipe >= 0),
    nbCO2Equipe    INT           DEFAULT 0
                                 CONSTRAINT ck_co2_Equipe CHECK (nbCO2Equipe >= 0)
);

CREATE TABLE Actions (
    Id_actions        SERIAL        CONSTRAINT pk_Actions PRIMARY KEY,
    nomAction         VARCHAR(150)  CONSTRAINT nn_nom_Actions NOT NULL,
    descriptionAction TEXT
);

CREATE TABLE Thematique (
    Id_thematique    SERIAL        CONSTRAINT pk_Thematique PRIMARY KEY,
    nomTheme         VARCHAR(100)  CONSTRAINT nn_nom_Thematique NOT NULL,
    descriptionTheme TEXT
);

CREATE TABLE Badge (
    Id_Badge         SERIAL        CONSTRAINT pk_Badge PRIMARY KEY,
    nomBadge         VARCHAR(100)  CONSTRAINT nn_nom_Badge NOT NULL,
    descriptionBadge TEXT,
    iconeBadge       TEXT
);

CREATE TABLE Notification (
    id_notif        SERIAL        CONSTRAINT pk_Notification PRIMARY KEY,
    nomNotif        VARCHAR(150)  CONSTRAINT nn_nom_Notif NOT NULL,
    dateNotif       DATE          CONSTRAINT nn_date_Notif NOT NULL,
    lienRedirection VARCHAR(255)
);

-- ============================================================
-- 2. UTILISATEURS ET RÔLES
-- Héritage par spécialisation (tables filles référencent Utilisateur)
-- ============================================================

CREATE TABLE Utilisateur (
    Id_User         SERIAL        CONSTRAINT pk_Utilisateur PRIMARY KEY,
    nomUser         VARCHAR(100)  CONSTRAINT nn_nom_User NOT NULL,
    prenomUser      VARCHAR(100)  CONSTRAINT nn_prenom_User NOT NULL,
    pdpUser         VARCHAR(255),
    email           VARCHAR(150)  CONSTRAINT nn_email_User NOT NULL
                                  CONSTRAINT u_email_User UNIQUE,
    statutUser      VARCHAR(20)   CONSTRAINT nn_statut_User NOT NULL
                                  CONSTRAINT ck_statut_User CHECK (statutUser IN ('actif', 'inactif', 'suspendu')),
    mdp             VARCHAR(255)  CONSTRAINT nn_mdp_User NOT NULL,
    inscriptionUser DATE          DEFAULT CURRENT_DATE
                                  CONSTRAINT nn_inscription_User NOT NULL,
    Id_Entreprise   INT           CONSTRAINT nn_Entreprise_User NOT NULL
                                  CONSTRAINT fk_User_Entreprise REFERENCES Entreprise(Id_Entreprise)
);

-- Spécialisation : Employé (hérite de Utilisateur)
CREATE TABLE Employe (
    Id_Employe         INT           CONSTRAINT pk_Employe PRIMARY KEY
                                     CONSTRAINT fk_Employe_User REFERENCES Utilisateur(Id_User),
    nbPointsEmploye    INT           DEFAULT 0
                                     CONSTRAINT ck_pts_Employe CHECK (nbPointsEmploye >= 0),
    nbCO2              INT           DEFAULT 0
                                     CONSTRAINT ck_co2_Employe CHECK (nbCO2 >= 0),
    departementEmploye VARCHAR(100),
    Id_equipe          INT           CONSTRAINT fk_Employe_Equipe REFERENCES Equipe(Id_equipe)
);

-- Spécialisation : Administrateur (hérite de Utilisateur)
CREATE TABLE Admin (
    Id_Admin INT CONSTRAINT pk_Admin PRIMARY KEY
                 CONSTRAINT fk_Admin_User REFERENCES Utilisateur(Id_User)
);

-- Spécialisation : Animateur (hérite de Utilisateur)
CREATE TABLE Animateur (
    Id_Animateur INT CONSTRAINT pk_Animateur PRIMARY KEY
                     CONSTRAINT fk_Animateur_User REFERENCES Utilisateur(Id_User)
);

-- ============================================================
-- 3. GAMIFICATION ET INTERACTION
-- ============================================================

CREATE TABLE Defi (
    Id_defi         SERIAL        CONSTRAINT pk_Defi PRIMARY KEY,
    nomDefi         VARCHAR(150)  CONSTRAINT nn_nom_Defi NOT NULL,
    descriptionDefi TEXT,
    nbPointsDefi    INT           CONSTRAINT nn_pts_Defi NOT NULL
                                  CONSTRAINT ck_pts_Defi CHECK (nbPointsDefi > 0),
    nbCO2Defi       INT           CONSTRAINT nn_co2_Defi NOT NULL
                                  CONSTRAINT ck_co2_Defi CHECK (nbCO2Defi >= 0),
    niveauDefi      INT           CONSTRAINT nn_niveau_Defi NOT NULL
                                  CONSTRAINT ck_niveau_Defi CHECK (niveauDefi > 0),
    Id_Animateur    INT           CONSTRAINT nn_Animateur_Defi NOT NULL
                                  CONSTRAINT fk_Defi_Animateur REFERENCES Animateur(Id_Animateur)
);

CREATE TABLE Forum (
    Id_forum         SERIAL        CONSTRAINT pk_Forum PRIMARY KEY,
    nomForum         VARCHAR(150)  CONSTRAINT nn_nom_Forum NOT NULL,
    descriptionForum TEXT,
    Id_defi          INT           CONSTRAINT fk_Forum_Defi REFERENCES Defi(Id_defi)
);

CREATE TABLE Message (
    Id_Message     SERIAL  CONSTRAINT pk_Message PRIMARY KEY,
    contenuMessage TEXT    CONSTRAINT nn_contenu_Message NOT NULL,
    dateMessage    DATE    DEFAULT CURRENT_DATE
                           CONSTRAINT nn_date_Message NOT NULL,
    Id_Employe     INT     CONSTRAINT nn_Employe_Message NOT NULL
                           CONSTRAINT fk_Message_Employe REFERENCES Employe(Id_Employe),
    Id_forum       INT     CONSTRAINT nn_Forum_Message NOT NULL
                           CONSTRAINT fk_Message_Forum REFERENCES Forum(Id_forum)
);

-- ============================================================
-- 4. TABLES DE LIAISON ET ASSOCIATION
-- ============================================================

-- Regroupe : un défi appartient à une thématique avec un ordre
CREATE TABLE Regroupe (
    Id_defi       INT  CONSTRAINT fk_Regroupe_Defi       REFERENCES Defi(Id_defi),
    Id_thematique INT  CONSTRAINT fk_Regroupe_Thematique REFERENCES Thematique(Id_thematique),
    mois          DATE CONSTRAINT nn_mois_Regroupe NOT NULL,
    ordre         INT  CONSTRAINT nn_ordre_Regroupe NOT NULL
                       CONSTRAINT ck_ordre_Regroupe CHECK (ordre > 0),
    CONSTRAINT pk_Regroupe PRIMARY KEY (Id_defi, Id_thematique),
    CONSTRAINT u_ordre_thematique UNIQUE (Id_thematique, ordre)
);

-- Faire_partie : actions associées à un défi
CREATE TABLE Faire_partie (
    Id_defi    INT CONSTRAINT fk_FP_Defi     REFERENCES Defi(Id_defi),
    Id_actions INT CONSTRAINT fk_FP_Actions  REFERENCES Actions(Id_actions),
    CONSTRAINT pk_Faire_partie PRIMARY KEY (Id_defi, Id_actions)
);

-- Reponse_Defi : reponses employees en attente de moderation animateur
CREATE TABLE Reponse_Defi (
    Id_reponse             SERIAL       CONSTRAINT pk_Reponse_Defi PRIMARY KEY,
    Id_defi                INT          CONSTRAINT nn_Reponse_Defi_Defi NOT NULL
                                        CONSTRAINT fk_Reponse_Defi_Defi REFERENCES Defi(Id_defi),
    Id_Employe             INT          CONSTRAINT nn_Reponse_Defi_Employe NOT NULL
                                        CONSTRAINT fk_Reponse_Defi_Employe REFERENCES Employe(Id_Employe),
    Id_actions             INT,
    reponse_text           TEXT         CONSTRAINT nn_Reponse_Defi_Text NOT NULL,
    statut_reponse         VARCHAR(20)  DEFAULT 'pending'
                                        CONSTRAINT nn_Reponse_Defi_Statut NOT NULL
                                        CONSTRAINT ck_Reponse_Defi_Statut CHECK (statut_reponse IN ('pending', 'approved', 'rejected')),
    commentaire_animateur  TEXT,
    date_reponse           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
                                        CONSTRAINT nn_Reponse_Defi_Date NOT NULL,
    date_traitement        TIMESTAMP,
    Id_Animateur_traitement INT         CONSTRAINT fk_Reponse_Defi_Animateur REFERENCES Animateur(Id_Animateur),
    CONSTRAINT fk_Reponse_Defi_Action FOREIGN KEY (Id_defi, Id_actions)
        REFERENCES Faire_partie(Id_defi, Id_actions)
);

-- Defi_Employe_Block : blocage d'un employe sur un defi par l'animateur
CREATE TABLE Defi_Employe_Block (
    Id_defi        INT        CONSTRAINT nn_Block_Defi NOT NULL
                           CONSTRAINT fk_Block_Defi REFERENCES Defi(Id_defi),
    Id_Employe     INT        CONSTRAINT nn_Block_Employe NOT NULL
                           CONSTRAINT fk_Block_Employe REFERENCES Employe(Id_Employe),
    Id_Animateur   INT        CONSTRAINT nn_Block_Animateur NOT NULL
                           CONSTRAINT fk_Block_Animateur REFERENCES Animateur(Id_Animateur),
    motif          TEXT,
    date_blocage   TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
                           CONSTRAINT nn_Block_Date NOT NULL,
    CONSTRAINT pk_Block PRIMARY KEY (Id_defi, Id_Employe)
);

-- Valider : validation d'une action d'un défi par un employé
CREATE TABLE Valider (
    Id_defi         INT  CONSTRAINT fk_Valider_Defi    REFERENCES Defi(Id_defi),
    Id_actions      INT  CONSTRAINT fk_Valider_Actions REFERENCES Actions(Id_actions),
    Id_Employe      INT  CONSTRAINT fk_Valider_Employe REFERENCES Employe(Id_Employe),
    date_validation DATE DEFAULT CURRENT_DATE
                         CONSTRAINT nn_date_Valider NOT NULL,
    preuve          TEXT,
    CONSTRAINT pk_Valider PRIMARY KEY (Id_defi, Id_actions, Id_Employe),
    -- L'action doit appartenir au défi
    CONSTRAINT fk_Valider_Faire_partie FOREIGN KEY (Id_defi, Id_actions)
        REFERENCES Faire_partie(Id_defi, Id_actions)
);

-- Obtenir_Em : badges obtenus par un employé
CREATE TABLE Obtenir_Em (
    Id_Badge   INT  CONSTRAINT fk_ObtEm_Badge    REFERENCES Badge(Id_Badge),
    Id_Employe INT  CONSTRAINT fk_ObtEm_Employe  REFERENCES Employe(Id_Employe),
    dateObtention DATE DEFAULT CURRENT_DATE
                         CONSTRAINT nn_date_ObtEm NOT NULL,
    CONSTRAINT pk_Obtenir_Em PRIMARY KEY (Id_Badge, Id_Employe)
);

-- Obtenir_Eq : badges obtenus par une équipe
CREATE TABLE Obtenir_Eq (
    Id_equipe     INT  CONSTRAINT fk_ObtEq_Equipe REFERENCES Equipe(Id_equipe),
    Id_Badge      INT  CONSTRAINT fk_ObtEq_Badge  REFERENCES Badge(Id_Badge),
    dateObtention DATE DEFAULT CURRENT_DATE
                        CONSTRAINT nn_date_ObtEq NOT NULL,
    CONSTRAINT pk_Obtenir_Eq PRIMARY KEY (Id_equipe, Id_Badge)
);

-- Recevoir : notifications reçues par les utilisateurs
CREATE TABLE Recevoir (
    Id_User  INT CONSTRAINT fk_Recevoir_User  REFERENCES Utilisateur(Id_User),
    id_notif INT CONSTRAINT fk_Recevoir_Notif REFERENCES Notification(id_notif),
    CONSTRAINT pk_Recevoir PRIMARY KEY (Id_User, id_notif)
);


-- ============================================================
-- Triggers & Procédures - Application Gamification RSE (GreenPulse)
-- Base : PostgreSQL | Cours SQL - Université Toulouse III
-- ============================================================
-- T1.  Exclusivité des rôles (Employé / Animateur / Admin)
-- T2.  Un employé ne peut changer d'équipe qu'hors défi actif
-- T3.  Validation séquentielle des défis (ordre N-1 requis avant N)
-- T4.  Points & CO₂ de l'employé après validation d'une action
-- T5.  Points & CO₂ de l'équipe = agrégation des membres
-- T6.  Fonction utilitaire : tous les membres ont validé un défi
-- T7.  Attribution automatique des badges (employé)
-- T8.  Attribution automatique des badges (équipe)
-- T9.  Consécutivité des ordres dans une thématique
-- T10. Suppression du forum et des messages en fin de mois
-- T11. Cohérence unicité ordre dans thématique au UPDATE
-- T12. Notification à l'employé après validation d'action
-- T13. Notification lors du déblocage d'un badge (employé)
-- ============================================================


-- ============================================================
-- T1. EXCLUSIVITÉ DES RÔLES
-- Un utilisateur ne peut apparaître que dans UNE SEULE table
-- de spécialisation (Employe, Animateur, Admin).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_role_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'employe' THEN
        IF EXISTS (SELECT 1 FROM Admin     WHERE Id_Admin    = NEW.Id_Employe)
        OR EXISTS (SELECT 1 FROM Animateur WHERE Id_Animateur = NEW.Id_Employe) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Admin ou Animateur).',
                NEW.Id_Employe;
        END IF;

    ELSIF TG_TABLE_NAME = 'admin' THEN
        IF EXISTS (SELECT 1 FROM Employe   WHERE Id_Employe   = NEW.Id_Admin)
        OR EXISTS (SELECT 1 FROM Animateur WHERE Id_Animateur = NEW.Id_Admin) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Employé ou Animateur).',
                NEW.Id_Admin;
        END IF;

    ELSIF TG_TABLE_NAME = 'animateur' THEN
        IF EXISTS (SELECT 1 FROM Employe WHERE Id_Employe = NEW.Id_Animateur)
        OR EXISTS (SELECT 1 FROM Admin   WHERE Id_Admin   = NEW.Id_Animateur) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Employé ou Admin).',
                NEW.Id_Animateur;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_role_exclusivity_employe
    BEFORE INSERT ON Employe
    FOR EACH ROW EXECUTE FUNCTION fn_check_role_exclusivity();

CREATE TRIGGER trg_role_exclusivity_admin
    BEFORE INSERT ON Admin
    FOR EACH ROW EXECUTE FUNCTION fn_check_role_exclusivity();

CREATE TRIGGER trg_role_exclusivity_animateur
    BEFORE INSERT ON Animateur
    FOR EACH ROW EXECUTE FUNCTION fn_check_role_exclusivity();


-- ============================================================
-- T2. CHANGEMENT D'ÉQUIPE BLOQUÉ SI DÉFI ACTIF EN COURS
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_single_team()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.Id_equipe IS NOT NULL
       AND NEW.Id_equipe IS DISTINCT FROM OLD.Id_equipe THEN
        IF EXISTS (
            SELECT 1
            FROM   Valider v
            JOIN   Regroupe r ON r.Id_defi = v.Id_defi
            WHERE  v.Id_Employe = NEW.Id_Employe
              AND  date_trunc('month', r.mois) = date_trunc('month', CURRENT_DATE)
        ) THEN
            RAISE EXCEPTION
                'L''employé % a des participations actives ce mois-ci. Changement d''équipe impossible.',
                NEW.Id_Employe;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_team
    BEFORE UPDATE OF Id_equipe ON Employe
    FOR EACH ROW EXECUTE FUNCTION fn_check_single_team();


-- ============================================================
-- T3. VALIDATION SÉQUENTIELLE DES DÉFIS
-- Le défi d'ordre N ne peut être soumis que si le défi
-- d'ordre N-1 (dans la même thématique) est déjà validé
-- par l'employé concerné.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_defi_order()
RETURNS TRIGGER AS $$
DECLARE
    v_ordre      INT;
    v_thematique INT;
    v_defi_prec  INT;
BEGIN
    SELECT r.ordre, r.Id_thematique
    INTO   v_ordre, v_thematique
    FROM   Regroupe r
    WHERE  r.Id_defi = NEW.Id_defi
    LIMIT 1;

    IF v_ordre IS NULL OR v_ordre <= 1 THEN
        RETURN NEW;
    END IF;

    SELECT r2.Id_defi
    INTO   v_defi_prec
    FROM   Regroupe r2
    WHERE  r2.Id_thematique = v_thematique
      AND  r2.ordre = v_ordre - 1;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM   Valider v
        WHERE  v.Id_Employe = NEW.Id_Employe
          AND  v.Id_defi    = v_defi_prec
    ) THEN
        RAISE EXCEPTION
            'Le défi d''ordre % (thématique %) doit être validé avant de soumettre le défi d''ordre %.',
            v_ordre - 1, v_thematique, v_ordre;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_defi_sequential_order
    BEFORE INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_check_defi_order();


-- ============================================================
-- T4. MISE À JOUR DES POINTS & CO₂ DE L'EMPLOYÉ
-- ATTENTION : les points du défi sont crédités à chaque action
-- validée. Si un défi comporte N actions, l'employé reçoit
-- nbPointsDefi × N points au total. Ajustez si vous souhaitez
-- un crédit unique par défi (déplacer la logique sur T6).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_employe_points()
RETURNS TRIGGER AS $$
DECLARE
    v_pts INT;
    v_co2 INT;
BEGIN
    SELECT nbPointsDefi, nbCO2Defi
    INTO   v_pts, v_co2
    FROM   Defi
    WHERE  Id_defi = NEW.Id_defi;

    UPDATE Employe
    SET    nbPointsEmploye = nbPointsEmploye + v_pts,
           nbCO2           = nbCO2           + v_co2
    WHERE  Id_Employe = NEW.Id_Employe;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nommé "trg_employe_..." pour s'exécuter avant "trg_equipe_..." (ordre alphabétique),
-- garantissant que T5 lit des points déjà mis à jour.
CREATE TRIGGER trg_employe_points_after_validation
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_update_employe_points();


-- ============================================================
-- T5. MISE À JOUR DES POINTS & CO₂ DE L'ÉQUIPE
-- Agrège les points de tous les membres de l'équipe.
-- S'exécute après T4 (ordre alphabétique des noms de triggers).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_equipe_points()
RETURNS TRIGGER AS $$
DECLARE
    v_equipe INT;
BEGIN
    SELECT Id_equipe INTO v_equipe
    FROM   Employe
    WHERE  Id_Employe = NEW.Id_Employe;

    IF v_equipe IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE Equipe
    SET    nbPointsEquipe = (
               SELECT COALESCE(SUM(e.nbPointsEmploye), 0)
               FROM   Employe e
               WHERE  e.Id_equipe = v_equipe
           ),
           nbCO2Equipe = (
               SELECT COALESCE(SUM(e.nbCO2), 0)
               FROM   Employe e
               WHERE  e.Id_equipe = v_equipe
           )
    WHERE  Id_equipe = v_equipe;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipe_points_after_validation
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_update_equipe_points();


-- ============================================================
-- T6. FONCTION UTILITAIRE
-- Retourne TRUE si tous les membres actifs d'une équipe ont
-- validé au moins une action du défi donné.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_equipe_a_valide_defi(
    p_equipe INT,
    p_defi   INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_nb_membres INT;
    v_nb_valides INT;
BEGIN
    SELECT COUNT(*)
    INTO   v_nb_membres
    FROM   Employe e
    JOIN   Utilisateur u ON u.Id_User = e.Id_Employe
    WHERE  e.Id_equipe  = p_equipe
      AND  u.statutUser = 'actif';

    IF v_nb_membres = 0 THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(DISTINCT v.Id_Employe)
    INTO   v_nb_valides
    FROM   Valider v
    JOIN   Employe e ON e.Id_Employe = v.Id_Employe
    WHERE  e.Id_equipe = p_equipe
      AND  v.Id_defi   = p_defi;

    RETURN v_nb_valides >= v_nb_membres;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- T7. ATTRIBUTION AUTOMATIQUE DES BADGES (EMPLOYÉ)
-- Badges basés sur le nombre total d'actions validées et sur
-- le nombre de défis validés par thématique.
-- Les noms de badges/thématiques doivent correspondre exactement
-- aux données insérées en base.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_award_employe_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_total_actions  INT;
    v_badge_id       INT;
    v_mobilite_count INT;
    v_dechets_count  INT;
    v_energie_count  INT;
BEGIN
    SELECT COUNT(*)
    INTO   v_total_actions
    FROM   Valider
    WHERE  Id_Employe = NEW.Id_Employe;

    -- Badge "Premier Pas" (1 action)
    IF v_total_actions >= 1 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Premier Pas' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- Badge "Engagé" (5 actions)
    IF v_total_actions >= 5 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Engagé' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- Badge "Champion RSE" (20 actions)
    IF v_total_actions >= 20 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Champion RSE' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- Badge "Éco-Mobilité" (3 défis thématique Mobilité)
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_mobilite_count
    FROM   Valider v
    JOIN   Regroupe r   ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Mobilité';

    IF v_mobilite_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Éco-Mobilité' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- Badge "Zéro Déchet" (3 défis thématique Déchets)
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_dechets_count
    FROM   Valider v
    JOIN   Regroupe r   ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Déchets';

    IF v_dechets_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Zéro Déchet' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- Badge "Éco-Énergie" (3 défis thématique Énergie)
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_energie_count
    FROM   Valider v
    JOIN   Regroupe r   ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Énergie';

    IF v_energie_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Éco-Énergie' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_employe_badges
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_award_employe_badges();


-- ============================================================
-- T8. ATTRIBUTION AUTOMATIQUE DES BADGES (ÉQUIPE)
-- Badge "Équipe Unie" : tous les membres actifs ont validé le défi.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_award_equipe_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_equipe   INT;
    v_badge_id INT;
BEGIN
    SELECT Id_equipe INTO v_equipe
    FROM   Employe
    WHERE  Id_Employe = NEW.Id_Employe;

    IF v_equipe IS NULL THEN
        RETURN NEW;
    END IF;

    IF fn_equipe_a_valide_defi(v_equipe, NEW.Id_defi) THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Équipe Unie' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Eq WHERE Id_equipe = v_equipe AND Id_Badge = v_badge_id
        ) THEN
            INSERT INTO Obtenir_Eq (Id_equipe, Id_Badge) VALUES (v_equipe, v_badge_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_equipe_badges
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_award_equipe_badges();


-- ============================================================
-- T9. CONSÉCUTIVITÉ DES ORDRES DANS UNE THÉMATIQUE
-- Le nouvel ordre doit être exactement MAX(ordre)+1 pour
-- la thématique, ou 1 si aucun défi n'y existe encore.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_ordre_consecutif()
RETURNS TRIGGER AS $$
DECLARE
    v_max_ordre INT;
BEGIN
    SELECT COALESCE(MAX(ordre), 0)
    INTO   v_max_ordre
    FROM   Regroupe
    WHERE  Id_thematique = NEW.Id_thematique;

    IF NEW.ordre <> v_max_ordre + 1 THEN
        RAISE EXCEPTION
            'L''ordre % est invalide pour la thématique %. L''ordre attendu est %.',
            NEW.ordre, NEW.Id_thematique, v_max_ordre + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ordre_consecutif
    BEFORE INSERT ON Regroupe
    FOR EACH ROW EXECUTE FUNCTION fn_check_ordre_consecutif();


-- ============================================================
-- T10. SUPPRESSION DU FORUM ET DES MESSAGES EN FIN DE MOIS
-- À appeler via un job planifié chaque 1er du mois.
-- Exemple pg_cron :
--   SELECT cron.schedule('cleanup-forums', '0 0 1 * *',
--          'CALL sp_cleanup_expired_forums();');
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_cleanup_expired_forums()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM Message
    WHERE Id_forum IN (
        SELECT f.Id_forum
        FROM   Forum f
        JOIN   Regroupe r ON r.Id_defi = f.Id_defi
        WHERE  date_trunc('month', r.mois) < date_trunc('month', CURRENT_DATE)
    );

    DELETE FROM Forum
    WHERE Id_defi IN (
        SELECT r.Id_defi
        FROM   Regroupe r
        WHERE  date_trunc('month', r.mois) < date_trunc('month', CURRENT_DATE)
    );
END;
$$;


-- ============================================================
-- T11. COHÉRENCE DE L'UNICITÉ DE L'ORDRE EN CAS D'UPDATE
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_ordre_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ordre <> OLD.ordre OR NEW.Id_thematique <> OLD.Id_thematique THEN
        IF EXISTS (
            SELECT 1 FROM Regroupe
            WHERE  Id_thematique = NEW.Id_thematique
              AND  ordre         = NEW.ordre
              AND  NOT (Id_defi = OLD.Id_defi AND Id_thematique = OLD.Id_thematique)
        ) THEN
            RAISE EXCEPTION
                'L''ordre % est déjà utilisé dans la thématique %. Modification impossible.',
                NEW.ordre, NEW.Id_thematique;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ordre_update_check
    BEFORE UPDATE ON Regroupe
    FOR EACH ROW EXECUTE FUNCTION fn_check_ordre_update();


-- ============================================================
-- T12. NOTIFICATION APRÈS VALIDATION D'UNE ACTION
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notif_action_validee()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id INT;
    v_nom_defi VARCHAR(150);
BEGIN
    SELECT nomDefi INTO v_nom_defi FROM Defi WHERE Id_defi = NEW.Id_defi;

    INSERT INTO Notification (nomNotif, dateNotif, lienRedirection)
    VALUES (
        'Action validée pour le défi : ' || COALESCE(v_nom_defi, 'inconnu'),
        CURRENT_DATE,
        '/defis/' || NEW.Id_defi
    )
    RETURNING id_notif INTO v_notif_id;

    INSERT INTO Recevoir (Id_User, id_notif)
    VALUES (NEW.Id_Employe, v_notif_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notif_action_validee
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_notif_action_validee();


-- ============================================================
-- T13. NOTIFICATION LORS DU DÉBLOCAGE D'UN BADGE (EMPLOYÉ)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notif_badge_employe()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id  INT;
    v_nom_badge VARCHAR(100);
BEGIN
    SELECT nomBadge INTO v_nom_badge FROM Badge WHERE Id_Badge = NEW.Id_Badge;

    INSERT INTO Notification (nomNotif, dateNotif, lienRedirection)
    VALUES (
        'Nouveau badge débloqué : ' || COALESCE(v_nom_badge, 'Badge'),
        CURRENT_DATE,
        '/profil/badges'
    )
    RETURNING id_notif INTO v_notif_id;

    INSERT INTO Recevoir (Id_User, id_notif)
    VALUES (NEW.Id_Employe, v_notif_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notif_badge_employe
    AFTER INSERT ON Obtenir_Em
    FOR EACH ROW EXECUTE FUNCTION fn_notif_badge_employe();


-- ============================================================
-- RÉCAPITULATIF DES CONTRAINTES MÉTIER
-- ============================================================
--
-- Contrainte                               | Solution
-- -----------------------------------------|-----------------------------
-- Exclusivité des rôles                    | T1  trg_role_exclusivity_*
-- Changement d'équipe hors défi actif      | T2  trg_single_team
-- Ordre N-1 validé avant N                 | T3  trg_defi_sequential_order
-- Points employé après validation          | T4  trg_employe_points_*
-- Points équipe = agrégation membres       | T5  trg_equipe_points_*
-- Badge conditionnel (employé)             | T7  trg_award_employe_badges
-- Badge conditionnel (équipe)              | T8  trg_award_equipe_badges
-- Ordres consécutifs dans une thématique   | T9  trg_ordre_consecutif
-- Suppression forum/messages fin de mois   | T10 sp_cleanup_expired_forums
-- Unicité ordre au UPDATE                  | T11 trg_ordre_update_check
-- Notification validation action           | T12 trg_notif_action_validee
-- Notification déblocage badge             | T13 trg_notif_badge_employe
--
-- Contraintes couvertes par DDL :
--   - PK Valider : une action validée une seule fois par employé/défi
--   - FK Faire_partie depuis Valider : l'action doit appartenir au défi
--   - UNIQUE (Id_thematique, ordre) : unicité de l'ordre dans une thématique
--   - CHECK >= 0 sur points et CO2
-- ============================================================