param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "greenpulse",
    [string]$DbUser = "postgres",
    [string]$DbPass = ""
)

# Chemin vers psql (PostgreSQL 18)
$PsqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (!(Test-Path $PsqlPath)) {
    Write-Host "psql introuvable a cet emplacement :" -ForegroundColor Red
    Write-Host $PsqlPath
    exit 1
}

Write-Host "=== Initialisation GreenPulse ===" -ForegroundColor Green

try {
    Write-Host "Verification PostgreSQL..."

    # Vérifier si la base existe
    Write-Host "Verification de la base '$DbName'..."
    $CheckDbCmd = "SELECT 1 FROM pg_database WHERE datname = '$DbName'"

    $Result = & $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d postgres -tc $CheckDbCmd 2>&1

    if (-not ($Result -match "1")) {
        Write-Host "Creation de la base..."
        & $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d postgres -c "CREATE DATABASE $DbName;" | Out-Null
        Write-Host "Base creee" -ForegroundColor Green
    }
    else {
        Write-Host "Base deja existante" -ForegroundColor Green
    }

    # Appliquer le schema
    Write-Host "Application du schema..."
    $SchemaPath = Join-Path (Get-Location) "schema.sql"

    if (Test-Path $SchemaPath) {
        & $PsqlPath -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaPath | Out-Null
        Write-Host "Schema applique" -ForegroundColor Green
    }
    else {
        Write-Host "Fichier schema.sql introuvable" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Initialisation terminee" -ForegroundColor Green
}
catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
    exit 1
}