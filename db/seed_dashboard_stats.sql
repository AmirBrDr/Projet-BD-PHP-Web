-- Seed additions to affect dashboard KPIs
-- Inserts several Valider rows and approved Reponse_Defi to increase:
--  - CO2 total évité (through trigger updates to Employe.nbCO2)
--  - Taux de participation global (employees with validations)
--  - Actions validées (count in Valider)

-- Insert validations for first 3 employees across some defis/actions
WITH emps AS (
  SELECT Id_Employe FROM Employe ORDER BY Id_Employe LIMIT 3
),
pairs AS (
  SELECT d.Id_defi, fp.Id_actions
  FROM Defi d
  JOIN Faire_partie fp ON fp.Id_defi = d.Id_defi
  WHERE d.Id_defi IN (1,2,3,4)
  ORDER BY d.Id_defi, fp.Id_actions
  LIMIT 6
)
INSERT INTO Valider (Id_defi, Id_actions, Id_Employe, date_validation, preuve)
SELECT p.Id_defi, p.Id_actions, e.Id_Employe, CURRENT_DATE, 'preuve demo'
FROM pairs p
CROSS JOIN emps e
ON CONFLICT (Id_defi, Id_actions, Id_Employe) DO NOTHING;

-- Add a few approved Reponse_Defi to reflect moderated proof submissions
INSERT INTO Reponse_Defi (
  Id_defi, Id_Employe, reponse_text, statut_reponse, commentaire_animateur, date_reponse, date_traitement, Id_Animateur_traitement
)
SELECT d.Id_defi, e.Id_Employe,
  'Photo de ma participation (demo)',
  'approved',
  'Merci, validée par demo',
  CURRENT_TIMESTAMP - interval '3 days',
  CURRENT_TIMESTAMP - interval '2 days',
  a.Id_Animateur
FROM Defi d
CROSS JOIN (SELECT Id_Employe FROM Employe ORDER BY Id_Employe LIMIT 3) e
CROSS JOIN (SELECT Id_Animateur FROM Animateur ORDER BY Id_Animateur LIMIT 1) a
WHERE d.Id_defi IN (1,2,3)
LIMIT 3;

-- Optionally, update some employe departement to ensure they appear in charts
UPDATE Employe SET departementEmploye = 'IT' WHERE Id_Employe IN (SELECT Id_Employe FROM Employe ORDER BY Id_Employe LIMIT 1);
UPDATE Employe SET departementEmploye = 'Marketing' WHERE Id_Employe IN (SELECT Id_Employe FROM Employe ORDER BY Id_Employe OFFSET 1 LIMIT 1);

-- End of dashboard seeds
