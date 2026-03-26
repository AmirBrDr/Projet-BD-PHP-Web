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
-- Triggers & Procédures - Application Gamification RSE (GreenPulse)
-- Base : PostgreSQL | Cours SQL - Université Toulouse III
-- ============================================================
-- TABLE DES MATIÈRES
-- T1.  Exclusivité des rôles (Employé / Animateur / Admin)
-- T2.  Un employé ne peut appartenir qu'à une seule équipe
-- T3.  Validation séquentielle des défis (ordre N-1 requis avant N)
-- T4.  Points & CO₂ de l'employé après validation d'une action
-- T5.  Points & CO₂ de l'équipe = agrégation des membres
-- T6.  Recalcul du classement après chaque validation
-- T7.  Attribution automatique des badges (employé)
-- T8.  Attribution automatique des badges (équipe)
-- T9.  Consécutivité des ordres dans une thématique
-- T10. Suppression du forum et des messages en fin de mois
-- T11. Cohérence unicité ordre dans thématique au UPDATE
-- T12. Notification à l'employé après validation/rejet d'action
-- T13. Notification lors du déblocage d'un badge
-- ============================================================


-- ============================================================
-- T1. EXCLUSIVITÉ DES RÔLES
-- Un utilisateur ne peut apparaître que dans UNE SEULE table
-- de spécialisation (Employe, Animateur, Admin).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_role_exclusivity()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifie qu'aucun autre rôle n'existe déjà pour cet utilisateur
    IF TG_TABLE_NAME = 'employe' THEN
        IF EXISTS (SELECT 1 FROM Admin      WHERE Id_Admin    = NEW.Id_Employe)
        OR EXISTS (SELECT 1 FROM Animateur  WHERE Id_Animateur = NEW.Id_Employe) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Admin ou Animateur). Un utilisateur ne peut avoir qu''un seul rôle.',
                NEW.Id_Employe;
        END IF;

    ELSIF TG_TABLE_NAME = 'admin' THEN
        IF EXISTS (SELECT 1 FROM Employe   WHERE Id_Employe   = NEW.Id_Admin)
        OR EXISTS (SELECT 1 FROM Animateur WHERE Id_Animateur = NEW.Id_Admin) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Employé ou Animateur). Un utilisateur ne peut avoir qu''un seul rôle.',
                NEW.Id_Admin;
        END IF;

    ELSIF TG_TABLE_NAME = 'animateur' THEN
        IF EXISTS (SELECT 1 FROM Employe WHERE Id_Employe = NEW.Id_Animateur)
        OR EXISTS (SELECT 1 FROM Admin   WHERE Id_Admin   = NEW.Id_Animateur) THEN
            RAISE EXCEPTION
                'L''utilisateur % possède déjà un rôle (Employé ou Admin). Un utilisateur ne peut avoir qu''un seul rôle.',
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
-- T2. UN EMPLOYÉ N'APPARTIENT QU'À UNE SEULE ÉQUIPE
-- (Contrainte déjà couverte par le modèle, mais on bloque aussi
--  toute tentative d'UPDATE qui affecterait l'équipe sans
--  désaffecter l'ancienne.)
-- Note : la colonne Id_equipe dans Employe étant une FK simple,
-- le changement est autorisé par le DDL. On ajoute ici une
-- vérification métier : un employé ne peut changer d'équipe
-- qu'après avoir terminé les défis en cours de son équipe.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_single_team()
RETURNS TRIGGER AS $$
BEGIN
    -- Bloque le changement d'équipe si l'employé a des actions en cours
    -- (soumises mais non encore validées/rejetées) dans l'équipe courante.
    -- "En cours" = lignes dans Valider dont l'action appartient à un défi actif du mois.
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
    v_ordre         INT;
    v_thematique    INT;
    v_defi_prec     INT;
BEGIN
    -- Récupère l'ordre et la thématique du défi en cours de validation
    SELECT r.ordre, r.Id_thematique
    INTO   v_ordre, v_thematique
    FROM   Regroupe r
    WHERE  r.Id_defi = NEW.Id_defi
    LIMIT 1;   -- Un défi appartient à une thématique

    -- Si ordre = 1, aucun prérequis
    IF v_ordre IS NULL OR v_ordre <= 1 THEN
        RETURN NEW;
    END IF;

    -- Trouve le défi de l'ordre précédent dans la même thématique
    SELECT r2.Id_defi
    INTO   v_defi_prec
    FROM   Regroupe r2
    WHERE  r2.Id_thematique = v_thematique
      AND  r2.ordre = v_ordre - 1;

    IF NOT FOUND THEN
        RETURN NEW;  -- Pas de prédécesseur trouvé (ne devrait pas arriver grâce à T9)
    END IF;

    -- Vérifie que l'employé a validé AU MOINS UNE action du défi précédent
    IF NOT EXISTS (
        SELECT 1
        FROM   Valider v
        WHERE  v.Id_Employe = NEW.Id_Employe
          AND  v.Id_defi    = v_defi_prec
    ) THEN
        RAISE EXCEPTION
            'Le défi d''ordre % (thématique %) doit être validé avant de pouvoir soumettre le défi d''ordre %.',
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
-- Après l'insertion d'une ligne dans Valider, on crédite
-- l'employé des points et du CO₂ du défi correspondant.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_employe_points()
RETURNS TRIGGER AS $$
DECLARE
    v_pts   INT;
    v_co2   INT;
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

CREATE TRIGGER trg_employe_points_after_validation
    AFTER INSERT ON Valider
    FOR EACH ROW EXECUTE FUNCTION fn_update_employe_points();


-- ============================================================
-- T5. MISE À JOUR DES POINTS & CO₂ DE L'ÉQUIPE
-- Les points d'une équipe = somme des points de ses membres.
-- On recalcule après chaque INSERT sur Valider.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_equipe_points()
RETURNS TRIGGER AS $$
DECLARE
    v_equipe INT;
BEGIN
    -- Récupère l'équipe de l'employé
    SELECT Id_equipe INTO v_equipe
    FROM   Employe
    WHERE  Id_Employe = NEW.Id_Employe;

    IF v_equipe IS NULL THEN
        RETURN NEW;
    END IF;

    -- Recalcule les totaux de l'équipe en agrégeant les membres
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
-- T6. VÉRIFICATION : TOUS LES MEMBRES D'UNE ÉQUIPE ONT
--     VALIDÉ AU MOINS UNE ACTION DU DÉFI POUR QUE L'ÉQUIPE
--     SOIT CONSIDÉRÉE COMME AYANT RELEVÉ LE DÉFI
-- Fonction utilitaire (appelée par l'applicatif ou T7/T8).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_equipe_a_valide_defi(
    p_equipe INT,
    p_defi   INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_nb_membres  INT;
    v_nb_valides  INT;
BEGIN
    -- Nombre de membres actifs dans l'équipe
    SELECT COUNT(*)
    INTO   v_nb_membres
    FROM   Employe e
    JOIN   Utilisateur u ON u.Id_User = e.Id_Employe
    WHERE  e.Id_equipe  = p_equipe
      AND  u.statutUser = 'actif';

    IF v_nb_membres = 0 THEN
        RETURN FALSE;
    END IF;

    -- Nombre de membres ayant validé au moins une action du défi
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
-- Après chaque validation d'action, on vérifie les conditions
-- d'obtention des badges non encore débloqués.
--
-- Règles de badge implémentées :
--   - "Premier Pas"      : 1ère action validée (tous défis confondus)
--   - "Engagé"           : 5 actions validées
--   - "Champion RSE"     : 20 actions validées
--   - "Éco-Mobilité"     : 3 défis de thématique "Mobilité" validés
--   - "Zéro Déchet"      : 3 défis de thématique "Déchets" validés
--   - "Éco-Énergie"      : 3 défis de thématique "Énergie" validés
--
-- REMARQUE : Les noms de badges et thématiques doivent correspondre
-- exactement aux données insérées en base. Ajustez selon vos données.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_award_employe_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_total_actions     INT;
    v_badge_id          INT;

    -- Compteurs thématiques
    v_mobilite_count    INT;
    v_dechets_count     INT;
    v_energie_count     INT;
BEGIN
    -- Compte total des actions validées par cet employé
    SELECT COUNT(*)
    INTO   v_total_actions
    FROM   Valider
    WHERE  Id_Employe = NEW.Id_Employe;

    -- ---- Badge "Premier Pas" (1 action) ----
    IF v_total_actions >= 1 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Premier Pas' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- ---- Badge "Engagé" (5 actions) ----
    IF v_total_actions >= 5 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Engagé' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- ---- Badge "Champion RSE" (20 actions) ----
    IF v_total_actions >= 20 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Champion RSE' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- ---- Badge thématique "Éco-Mobilité" (3 défis Mobilité) ----
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_mobilite_count
    FROM   Valider v
    JOIN   Regroupe r  ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Mobilité';

    IF v_mobilite_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Éco-Mobilité' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- ---- Badge thématique "Zéro Déchet" (3 défis Déchets) ----
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_dechets_count
    FROM   Valider v
    JOIN   Regroupe r  ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Déchets';

    IF v_dechets_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Zéro Déchet' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
        ) THEN
            INSERT INTO Obtenir_Em (Id_Badge, Id_Employe) VALUES (v_badge_id, NEW.Id_Employe);
        END IF;
    END IF;

    -- ---- Badge thématique "Éco-Énergie" (3 défis Énergie) ----
    SELECT COUNT(DISTINCT v.Id_defi)
    INTO   v_energie_count
    FROM   Valider v
    JOIN   Regroupe r  ON r.Id_defi       = v.Id_defi
    JOIN   Thematique t ON t.Id_thematique = r.Id_thematique
    WHERE  v.Id_Employe = NEW.Id_Employe
      AND  t.nomTheme   = 'Énergie';

    IF v_energie_count >= 3 THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Éco-Énergie' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Em
            WHERE Id_Badge = v_badge_id AND Id_Employe = NEW.Id_Employe
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
-- Déclenché après INSERT sur Valider.
-- Badge "Équipe Unie" : tous les membres ont validé ce défi.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_award_equipe_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_equipe    INT;
    v_badge_id  INT;
BEGIN
    SELECT Id_equipe INTO v_equipe
    FROM   Employe
    WHERE  Id_Employe = NEW.Id_Employe;

    IF v_equipe IS NULL THEN
        RETURN NEW;
    END IF;

    -- Badge "Équipe Unie" : toute l'équipe a validé ce défi
    IF fn_equipe_a_valide_defi(v_equipe, NEW.Id_defi) THEN
        SELECT Id_Badge INTO v_badge_id FROM Badge WHERE nomBadge = 'Équipe Unie' LIMIT 1;
        IF FOUND AND NOT EXISTS (
            SELECT 1 FROM Obtenir_Eq
            WHERE Id_equipe = v_equipe AND Id_Badge = v_badge_id
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
-- Lors d'un INSERT dans Regroupe, l'ordre du nouveau défi doit
-- être exactement max(ordre)+1 pour la thématique concernée,
-- ou bien 1 s'il n'existe encore aucun défi dans cette thématique.
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
-- Cette fonction est destinée à être appelée par un job planifié
-- (pg_cron, cron système + psql, ou tâche applicative) chaque
-- 1er du mois.
-- Elle supprime les forums et messages associés aux défis dont
-- le mois est révolu.
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_cleanup_expired_forums()
LANGUAGE plpgsql AS $$
BEGIN
    -- Supprime les messages liés aux forums des défis du mois précédent
    DELETE FROM Message
    WHERE Id_forum IN (
        SELECT f.Id_forum
        FROM   Forum f
        JOIN   Regroupe r ON r.Id_defi = f.Id_defi
        WHERE  date_trunc('month', r.mois) < date_trunc('month', CURRENT_DATE)
    );

    -- Supprime les forums des défis dont le mois est révolu
    DELETE FROM Forum
    WHERE Id_defi IN (
        SELECT r.Id_defi
        FROM   Regroupe r
        WHERE  date_trunc('month', r.mois) < date_trunc('month', CURRENT_DATE)
    );
END;
$$;

-- Exemple d'appel manuel :
-- CALL sp_cleanup_expired_forums();

-- Si pg_cron est disponible, planifier ainsi :
-- SELECT cron.schedule('cleanup-forums', '0 0 1 * *', 'CALL sp_cleanup_expired_forums();');


-- ============================================================
-- T11. COHÉRENCE DE L'UNICITÉ DE L'ORDRE EN CAS D'UPDATE
-- Empêche un UPDATE sur Regroupe de créer un doublon d'ordre
-- dans une même thématique (la contrainte UNIQUE couvre l'INSERT,
-- mais on ajoute un message explicite pour l'UPDATE).
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
-- Crée une notification dans la table Notification et l'associe
-- à l'employé via Recevoir, dès qu'une ligne est insérée
-- dans Valider.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notif_action_validee()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id  INT;
    v_nom_defi  VARCHAR(150);
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
-- Crée une notification dès qu'un badge est attribué à un employé.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notif_badge_employe()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id   INT;
    v_nom_badge  VARCHAR(100);
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
-- RÉCAPITULATIF DES CONTRAINTES MÉTIER NON COUVERTES PAR DDL
-- (et leur solution dans ce fichier)
-- ============================================================
--
-- Contrainte                                  | Solution
-- --------------------------------------------|----------------------------
-- Exclusivité des rôles                        | T1  trg_role_exclusivity_*
-- Employé dans une seule équipe               | T2  trg_single_team
-- Ordre N-1 validé avant N                    | T3  trg_defi_sequential_order
-- Points employé = cumul actions validées     | T4  trg_employe_points_*
-- Points équipe = agrégation membres          | T5  trg_equipe_points_*
-- Badge conditionnel (employé)                | T7  trg_award_employe_badges
-- Badge conditionnel (équipe)                 | T8  trg_award_equipe_badges
-- Ordres consécutifs dans une thématique      | T9  trg_ordre_consecutif
-- Suppression forum/messages fin de mois      | T10 sp_cleanup_expired_forums (job)
-- Unicité ordre au UPDATE                     | T11 trg_ordre_update_check
-- Notification validation action              | T12 trg_notif_action_validee
-- Notification déblocage badge                | T13 trg_notif_badge_employe
--
-- Contraintes couvertes directement par DDL (create_tables.sql) :
--   - Une action validée une seule fois par utilisateur et par défi (PK Valider)
--   - L'action doit appartenir au défi (FK vers Faire_partie)
--   - Unicité de l'ordre dans une thématique (UNIQUE sur Regroupe)
--   - Points >= 0, CO2 >= 0 (CHECK constraints)
-- ============================================================