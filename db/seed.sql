-- Nettoyage complet
DELETE FROM Recevoir;
DELETE FROM Obtenir_Eq;
DELETE FROM Obtenir_Em;
DELETE FROM Valider;
DELETE FROM Reponse_Defi;
DELETE FROM Message;
DO $$
BEGIN
	IF to_regclass('public.defi_proposition_acteur') IS NOT NULL THEN
		EXECUTE 'DELETE FROM defi_proposition_acteur';
	END IF;
END $$;
DELETE FROM Faire_partie;
DELETE FROM Forum;
DELETE FROM Regroupe;
DELETE FROM Actions;
DELETE FROM Defi;
DELETE FROM Thematique;

ALTER SEQUENCE defi_id_defi_seq RESTART WITH 1;
ALTER SEQUENCE thematique_id_thematique_seq RESTART WITH 1;
ALTER SEQUENCE actions_id_actions_seq RESTART WITH 1;
ALTER SEQUENCE forum_id_forum_seq RESTART WITH 1;
DO $$
BEGIN
	IF to_regclass('public.reponse_defi_id_reponse_seq') IS NOT NULL THEN
		EXECUTE 'ALTER SEQUENCE reponse_defi_id_reponse_seq RESTART WITH 1';
	END IF;
END $$;

-- Comptes de base pour tester le flux employe -> moderation
-- Mot de passe commun: password
DO $$
DECLARE
	v_ent_id INT;
	v_anim_id INT;
	v_emp1_id INT;
	v_emp2_id INT;
BEGIN
	SELECT Id_Entreprise
	INTO v_ent_id
	FROM Entreprise
	ORDER BY Id_Entreprise
	LIMIT 1;

	IF v_ent_id IS NULL THEN
		INSERT INTO Entreprise (nomEntreprise, secteurEntreprise)
		VALUES ('GreenPulse Demo', 'Services')
		RETURNING Id_Entreprise INTO v_ent_id;
	END IF;

	SELECT a.Id_Animateur
	INTO v_anim_id
	FROM Animateur a
	ORDER BY a.Id_Animateur
	LIMIT 1;

	IF v_anim_id IS NULL THEN
		INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, Id_Entreprise)
		VALUES (
			'Animateur',
			'Demo',
			'animateur.demo@greenpulse.local',
			'actif',
			'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
			v_ent_id
		)
		RETURNING Id_User INTO v_anim_id;

		INSERT INTO Animateur (Id_Animateur) VALUES (v_anim_id);
	END IF;

	SELECT e.Id_Employe
	INTO v_emp1_id
	FROM Employe e
	ORDER BY e.Id_Employe
	LIMIT 1;

	IF v_emp1_id IS NULL THEN
		INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, Id_Entreprise)
		VALUES (
			'Employe',
			'One',
			'employe.one@greenpulse.local',
			'actif',
			'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
			v_ent_id
		)
		RETURNING Id_User INTO v_emp1_id;

		INSERT INTO Employe (Id_Employe, Id_equipe) VALUES (v_emp1_id, NULL);
	END IF;

	SELECT e.Id_Employe
	INTO v_emp2_id
	FROM Employe e
	WHERE e.Id_Employe <> v_emp1_id
	ORDER BY e.Id_Employe
	LIMIT 1;

	IF v_emp2_id IS NULL THEN
		INSERT INTO Utilisateur (nomUser, prenomUser, email, statutUser, mdp, Id_Entreprise)
		VALUES (
			'Employe',
			'Two',
			'employe.two@greenpulse.local',
			'actif',
			'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
			v_ent_id
		)
		RETURNING Id_User INTO v_emp2_id;

		INSERT INTO Employe (Id_Employe, Id_equipe) VALUES (v_emp2_id, NULL);
	END IF;
END $$;

-- Thematiques
INSERT INTO Thematique (nomTheme, descriptionTheme) VALUES 
('Mobilite', 'Reduire impact carbone des deplacements'),
('Energie', 'Economiser energie au bureau'),
('Dechets', 'Reduire et trier les dechets'),
('Alimentation', 'Manger plus responsable');

-- Defis
INSERT INTO Defi (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi, Id_Animateur)
SELECT
	data.nomDefi,
	data.descriptionDefi,
	data.nbPointsDefi,
	data.nbCO2Defi,
	data.niveauDefi,
	anim.Id_Animateur
FROM (
	VALUES
		('Zero Voiture', 'Venez au travail sans voiture cette semaine', 100, 15, 1),
		('Covoiturage Express', 'Organisez un covoiturage avec un collegue', 75, 10, 2),
		('Velo Challenge', 'Venez au bureau a velo 3 jours de suite', 150, 20, 3),
		('Eteins la lumiere', 'Eteignez les lumieres en quittant une piece', 50, 8, 1),
		('Mode Veille Interdit', 'Ne laissez aucun appareil en veille le soir', 60, 10, 2),
		('Thermostat Eco', 'Reduisez le chauffage de 1 degre cette semaine', 80, 12, 3),
		('Lunch zero dechet', 'Apportez votre repas sans emballage plastique', 75, 5, 1),
		('Semaine sans plastique', 'Aucun plastique usage unique cette semaine', 120, 8, 2),
		('Tri Master', 'Triez correctement vos dechets pendant 5 jours', 90, 6, 3),
		('Repas Veggie', 'Mangez vegetarien le midi toute la semaine', 80, 12, 1),
		('Local et Saison', 'Achetez uniquement des produits locaux de saison', 100, 15, 2),
		('Zero Gaspi', 'Ne jetez aucun aliment cette semaine', 110, 10, 3)
) AS data (nomDefi, descriptionDefi, nbPointsDefi, nbCO2Defi, niveauDefi)
CROSS JOIN (
	SELECT Id_Animateur
	FROM Animateur
	ORDER BY Id_Animateur
	LIMIT 1
) AS anim;

-- Actions
INSERT INTO Actions (nomAction, descriptionAction) VALUES
-- Defi 1 : Zero Voiture (1,2,3)
('Venir a velo', 'Utiliser le velo pour le trajet domicile-travail'),
('Venir a pied', 'Marcher pour venir au travail si moins de 3km'),
('Prendre les transports', 'Utiliser bus metro ou tram pour venir'),
-- Defi 2 : Covoiturage Express (4,5,6)
('Proposer un trajet', 'Publier un trajet sur lapplication de covoiturage'),
('Accepter un collegue', 'Prendre un collegue dans votre voiture'),
('Organiser un groupe', 'Creer un groupe de covoiturage regulier'),
-- Defi 3 : Velo Challenge (7,8,9)
('Sortir le velo', 'Utiliser le velo 3 jours consecutifs'),
('Garer au parking velo', 'Utiliser le parking velo securise du bureau'),
('Entretenir son velo', 'Verifier freins pneus et chaine avant de partir'),
-- Defi 4 : Eteins la lumiere (10,11,12)
('Eteindre en partant', 'Eteindre toutes les lumieres en quittant la piece'),
('Utiliser la lumiere naturelle', 'Privilegier la lumiere naturelle en journee'),
('Signaler les oublis', 'Rappeler a ses collegues detteindre les lumieres'),
-- Defi 5 : Mode Veille Interdit (13,14,15)
('Eteindre le PC', 'Eteindre completement le PC en fin de journee'),
('Debrancher les chargeurs', 'Debrancher tous les chargeurs inutilises'),
('Eteindre les ecrans', 'Ne laisser aucun ecran allume la nuit'),
-- Defi 6 : Thermostat Eco (16,17,18)
('Baisser le thermostat', 'Reduire le thermostat de 1 degre'),
('Porter un pull', 'Mettre un pull plutot que monter le chauffage'),
('Fermer les fenetres', 'Verifier que les fenetres sont fermees quand chauffe'),
-- Defi 7 : Lunch zero dechet (19,20,21)
('Boite repas reutilisable', 'Apporter sa lunch box pour le repas du midi'),
('Couverts reutilisables', 'Apporter ses propres couverts au bureau'),
('Bouteille reutilisable', 'Utiliser une gourde plutot quune bouteille plastique'),
-- Defi 8 : Semaine sans plastique (22,23,24)
('Refuser les sacs plastique', 'Toujours refuser un sac plastique en caisse'),
('Eviter emballages plastique', 'Choisir des produits sans emballage plastique'),
('Signaler les plastiques', 'Identifier les plastiques evitables au bureau'),
-- Defi 9 : Tri Master (25,26,27)
('Trier papier carton', 'Mettre papiers et cartons dans la bonne poubelle'),
('Trier plastique metal', 'Trier correctement plastiques et metaux'),
('Trier dechets organiques', 'Utiliser le compost pour les dechets alimentaires'),
-- Defi 10 : Repas Veggie (28,29,30)
('Dejeuner sans viande', 'Choisir un repas vegetarien le midi'),
('Decouvrir une recette veggie', 'Essayer une nouvelle recette vegetarienne'),
('Partager un repas veggie', 'Amener un plat vegetarien fait maison a partager'),
-- Defi 11 : Local et Saison (31,32,33)
('Acheter au marche local', 'Faire ses courses au marche local du quartier'),
('Verifier origine produits', 'Lire les etiquettes pour choisir local'),
('Eviter produits hors saison', 'Refuser les fruits et legumes hors saison'),
-- Defi 12 : Zero Gaspi (34,35,36)
('Finir son assiette', 'Ne pas jeter de nourriture dans son assiette'),
('Conserver les restes', 'Mettre les restes au frigo pour le lendemain'),
('Planifier ses repas', 'Preparer une liste de courses pour eviter le gaspillage');

-- Faire_partie : lier actions aux defis
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

-- Forums pour tous les defis
INSERT INTO Forum (nomForum, descriptionForum, Id_defi) VALUES
('Forum Zero Voiture', 'Partagez vos experiences de mobilite douce', 1),
('Forum Covoiturage', 'Organisez vos trajets ensemble', 2),
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

-- Reponses de demonstration pour la moderation
INSERT INTO Reponse_Defi (Id_defi, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_reponse)
SELECT
	d.Id_defi,
	e.Id_Employe,
	'J ai pris le velo 3 jours cette semaine pour venir au bureau.',
	'pending',
	NULL,
	CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM (SELECT Id_defi FROM Defi ORDER BY Id_defi ASC LIMIT 1) d
CROSS JOIN (SELECT Id_Employe FROM Employe ORDER BY Id_Employe ASC LIMIT 1) e;

INSERT INTO Reponse_Defi (
	Id_defi,
	Id_Employe,
	reponse_text,
	statut_reponse,
	commentaire_animateur,
	date_reponse,
	date_traitement,
	Id_Animateur_traitement
)
SELECT
	d.Id_defi,
	e.Id_Employe,
	'J ai remplace les bouteilles plastiques par une gourde reutilisable.',
	'approved',
	'Super initiative, continue comme ca.',
	CURRENT_TIMESTAMP - INTERVAL '2 days',
	CURRENT_TIMESTAMP - INTERVAL '1 day',
	a.Id_Animateur
FROM (SELECT Id_defi FROM Defi ORDER BY Id_defi ASC OFFSET 1 LIMIT 1) d
CROSS JOIN (
	SELECT Id_Employe
	FROM Employe
	ORDER BY Id_Employe ASC
	OFFSET 1
	LIMIT 1
) e
CROSS JOIN (SELECT Id_Animateur FROM Animateur ORDER BY Id_Animateur ASC LIMIT 1) a;

INSERT INTO Reponse_Defi (
	Id_defi,
	Id_Employe,
	reponse_text,
	statut_reponse,
	commentaire_animateur,
	date_reponse,
	date_traitement,
	Id_Animateur_traitement
)
SELECT
	d.Id_defi,
	e.Id_Employe,
	'J ai essaye mais je nai pas encore termine le defi complet.',
	'rejected',
	'Merci pour lessai, ajoute des details et renvoie une preuve plus complete.',
	CURRENT_TIMESTAMP - INTERVAL '3 days',
	CURRENT_TIMESTAMP - INTERVAL '2 days',
	a.Id_Animateur
FROM (SELECT Id_defi FROM Defi ORDER BY Id_defi ASC OFFSET 2 LIMIT 1) d
CROSS JOIN (SELECT Id_Employe FROM Employe ORDER BY Id_Employe ASC LIMIT 1) e
CROSS JOIN (SELECT Id_Animateur FROM Animateur ORDER BY Id_Animateur ASC LIMIT 1) a;