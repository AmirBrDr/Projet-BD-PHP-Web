<?php

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_send_json(405, ['message' => 'Méthode non autorisée']);
}

$body = gp_read_json_body();

$nomUser = trim((string)($body['nomUser'] ?? $body['nom_user'] ?? ''));
$prenomUser = trim((string)($body['prenomUser'] ?? $body['prenom_user'] ?? ''));
$email = trim((string)($body['email'] ?? ''));
$statutUser = trim((string)($body['statutUser'] ?? $body['statut_user'] ?? 'actif'));
$mdp = (string)($body['mdp'] ?? '');
$role = gp_normalize_role((string)($body['role'] ?? 'employe'));
$pdpUser = $body['pdpUser'] ?? $body['pdp_user'] ?? null;
$inscriptionUser = $body['inscriptionUser'] ?? $body['inscription_user'] ?? null;
$idEntreprise = $body['idEntreprise'] ?? $body['id_entreprise'] ?? $body['Id_Entreprise'] ?? null;
$nomEntreprise = trim((string)($body['nomEntreprise'] ?? $body['nom_entreprise'] ?? $body['entreprise'] ?? ''));
$secteurEntreprise = trim((string)($body['secteurEntreprise'] ?? $body['secteur_entreprise'] ?? $body['departement'] ?? $body['department'] ?? ''));

if ($nomUser === '' || $prenomUser === '' || $email === '' || $mdp === '') {
    gp_send_json(400, ['message' => 'Champs requis manquants']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    gp_send_json(400, ['message' => 'Email invalide']);
}

if (strlen($mdp) < 6) {
    gp_send_json(400, ['message' => 'Mot de passe trop court']);
}

$allowedStatuts = ['actif', 'inactif', 'suspendu'];
if (!in_array($statutUser, $allowedStatuts, true)) {
    gp_send_json(400, ['message' => 'Statut utilisateur invalide']);
}

if (!gp_is_valid_role($role)) {
    gp_send_json(400, ['message' => 'Rôle utilisateur invalide']);
}

try {
    $pdo = gp_pdo($config);

    $resolvedEntrepriseId = null;

    if (is_numeric($idEntreprise) && (int)$idEntreprise > 0) {
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE id_entreprise = :id LIMIT 1');
        $stmt->execute([':id' => (int)$idEntreprise]);
        $existingEntreprise = $stmt->fetch();

        if (!$existingEntreprise) {
            gp_send_json(400, ['message' => 'Entreprise inconnue']);
        }

        $resolvedEntrepriseId = (int)$existingEntreprise['id_entreprise'];
    } elseif ($nomEntreprise !== '') {
        $stmt = $pdo->prepare('SELECT id_entreprise FROM entreprise WHERE LOWER(nomentreprise) = LOWER(:nom) LIMIT 1');
        $stmt->execute([':nom' => $nomEntreprise]);
        $existingEntreprise = $stmt->fetch();

        if ($existingEntreprise) {
            $resolvedEntrepriseId = (int)$existingEntreprise['id_entreprise'];
        } else {
            $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, :secteur) RETURNING id_entreprise');
            $stmt->execute([
                ':nom' => $nomEntreprise,
                ':secteur' => $secteurEntreprise !== '' ? $secteurEntreprise : null,
            ]);
            $rowEntreprise = $stmt->fetch();
            $resolvedEntrepriseId = (int)($rowEntreprise['id_entreprise'] ?? 0);
        }
    } else {
        $stmt = $pdo->query('SELECT id_entreprise FROM entreprise ORDER BY id_entreprise ASC LIMIT 1');
        $existingEntreprise = $stmt->fetch();

        if ($existingEntreprise) {
            $resolvedEntrepriseId = (int)$existingEntreprise['id_entreprise'];
        } else {
            $defaultEntrepriseName = 'Entreprise par défaut';
            $stmt = $pdo->prepare('INSERT INTO entreprise (nomentreprise, secteurentreprise) VALUES (:nom, :secteur) RETURNING id_entreprise');
            $stmt->execute([
                ':nom' => $defaultEntrepriseName,
                ':secteur' => $secteurEntreprise !== '' ? $secteurEntreprise : null,
            ]);
            $rowEntreprise = $stmt->fetch();
            $resolvedEntrepriseId = (int)($rowEntreprise['id_entreprise'] ?? 0);
        }
    }

    if ($resolvedEntrepriseId <= 0) {
        gp_send_json(500, ['message' => 'Impossible de déterminer l\'entreprise']);
    }

    $stmt = $pdo->prepare('SELECT id_user FROM utilisateur WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $exists = $stmt->fetch();
    if ($exists) {
        gp_send_json(409, ['message' => 'Email déjà utilisé']);
    }

    $hash = password_hash($mdp, PASSWORD_DEFAULT);

    $dateValue = null;
    if (is_string($inscriptionUser) && trim($inscriptionUser) !== '') {
        $dateValue = substr($inscriptionUser, 0, 10);
    }

    $pdo->beginTransaction();

    try {
        $sql = 'INSERT INTO utilisateur (nomuser, pdpuser, prenomuser, email, statutuser, mdp, inscriptionuser, id_entreprise)
                VALUES (:nomuser, :pdpuser, :prenomuser, :email, :statutuser, :mdp, COALESCE(:inscriptionuser, CURRENT_DATE), :id_entreprise)
                RETURNING id_user';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nomuser' => $nomUser,
            ':pdpuser' => $pdpUser,
            ':prenomuser' => $prenomUser,
            ':email' => $email,
            ':statutuser' => $statutUser,
            ':mdp' => $hash,
            ':inscriptionuser' => $dateValue,
            ':id_entreprise' => $resolvedEntrepriseId,
        ]);

        $row = $stmt->fetch();
        $idUser = (int)($row['id_user'] ?? 0);

        if ($idUser <= 0) {
            throw new RuntimeException('Impossible de créer l\'utilisateur');
        }

        gp_insert_user_role($pdo, $idUser, $role);
        $pdo->commit();
    } catch (Throwable $inner) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $inner;
    }

    $token = gp_jwt_sign([
        'sub' => (string)$idUser,
        'email' => $email,
        'statutUser' => $statutUser,
        'role' => $role,
    ], $config['jwt']);

    gp_send_json(201, [
        'message' => 'Inscription réussie',
        'token' => $token,
        'user' => [
            'idUser' => $idUser,
            'nomUser' => $nomUser,
            'prenomUser' => $prenomUser,
            'email' => $email,
            'statutUser' => $statutUser,
            'pdpUser' => $pdpUser,
            'idEntreprise' => $resolvedEntrepriseId,
            'role' => $role,
        ],
    ]);
} catch (Throwable $e) {
    $msg = (!empty($config['debug'])) ? ($e->getMessage() ?: 'Erreur serveur') : 'Erreur serveur';
    gp_send_json(500, ['message' => $msg]);
}
