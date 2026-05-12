param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "greenpulse",
    [string]$DbUser = "greenpulse",
    [string]$DbPass = "Greenpulse1234"  # Development password
)

# Chemin vers psql (PostgreSQL 18)
$PsqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (!(Test-Path $PsqlPath)) {
    Write-Host "psql introuvable a cet emplacement :" -ForegroundColor Red
    Write-Host $PsqlPath
    exit 1
}

$env:PGPASSWORD      = $DbPass
$env:PGCLIENTENCODING = "UTF8"

$SchemaPath    = Join-Path $PSScriptRoot "schema.sql"
$MigrationsDir = Join-Path $PSScriptRoot "migrations"
$SeedPath      = Join-Path $PSScriptRoot "seed_new.sql"

Write-Host "=== Initialisation de la base de données GreenPulse ===" -ForegroundColor Green

try {
    # Créer la base si elle n'existe pas
    Write-Host "Création de la base de données '$DbName'..."
    $CheckResult = & $PsqlPath -h $DbHost -p $DbPort -U $DbUser -tc "SELECT 1 FROM pg_database WHERE datname = '$DbName'" 2>&1

    if (-not ($CheckResult -match "1")) {
        & $PsqlPath -v "ON_ERROR_STOP=1" -h $DbHost -p $DbPort -U $DbUser -c "CREATE DATABASE $DbName;"
        if ($LASTEXITCODE -ne 0) { throw "Échec de la création de la base de données" }
    }

    # Appliquer le schéma
    Write-Host "Application du schéma..."
    if (!(Test-Path $SchemaPath)) { throw "Fichier schema.sql introuvable : $SchemaPath" }
    & $PsqlPath -v "ON_ERROR_STOP=1" -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaPath
    if ($LASTEXITCODE -ne 0) { throw "Échec de l'application du schéma" }

    # Appliquer les migrations
    Write-Host "Application des migrations..."
    if (Test-Path $MigrationsDir) {
        $Migrations = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
        foreach ($Migration in $Migrations) {
            Write-Host " - $($Migration.Name)"
            & $PsqlPath -v "ON_ERROR_STOP=1" -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $Migration.FullName
            if ($LASTEXITCODE -ne 0) { throw "Échec de la migration : $($Migration.Name)" }
        }
    }

    # Appliquer le seed si présent
    if (Test-Path $SeedPath) {
        Write-Host "Application du seed (seed_new.sql)..."
        & $PsqlPath -v "ON_ERROR_STOP=1" -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SeedPath
        if ($LASTEXITCODE -ne 0) { throw "Échec de l'application du seed" }

        Write-Host "Vérification post-seed..."
        $VerifSql = @'
DO $$
DECLARE
    v_users INTEGER;
    v_employes INTEGER;
    v_orphan_employes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_users FROM Utilisateur;
    SELECT COUNT(*) INTO v_employes FROM Employe;

    SELECT COUNT(*)
      INTO v_orphan_employes
      FROM Employe e
 LEFT JOIN Utilisateur u ON u.id_user = e.id_employe
     WHERE u.id_user IS NULL;

    IF v_users <> 106 THEN
        RAISE EXCEPTION 'Vérification seed échouée: Utilisateur attendu=106, obtenu=%', v_users;
    END IF;

    IF v_employes <> 101 THEN
        RAISE EXCEPTION 'Vérification seed échouée: Employe attendu=101, obtenu=%', v_employes;
    END IF;

    IF v_orphan_employes <> 0 THEN
        RAISE EXCEPTION 'Vérification seed échouée: % employé(s) sans utilisateur associé', v_orphan_employes;
    END IF;

    RAISE NOTICE 'Vérification post-seed OK (Utilisateur=%, Employe=%).', v_users, v_employes;
END
$$;
'@
        $VerifSql | & $PsqlPath -v "ON_ERROR_STOP=1" -h $DbHost -p $DbPort -U $DbUser -d $DbName
        if ($LASTEXITCODE -ne 0) { throw "Échec de la vérification post-seed" }
    } else {
        Write-Host "Aucun fichier de seed (seed_new.sql) trouvé."
    }

    Write-Host "Base de données initialisée avec succès!" -ForegroundColor Green
}
catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
    exit 1
}
finally {
    $env:PGPASSWORD      = ""
    $env:PGCLIENTENCODING = ""
}
