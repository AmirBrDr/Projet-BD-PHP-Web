# Script PowerShell pour initialiser PostgreSQL et la base GreenPulse
# Usage: .\db\init-postgres.ps1

param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "greenpulse",
    [string]$DbUser = "postgres",
    [string]$DbPass = ""
)

Write-Host "=== Initialisation de la base de données GreenPulse ===" -ForegroundColor Green

# Construire la chaîne de connexion
$ConnStr = "Server=$DbHost;Port=$DbPort;User Id=$DbUser"
if ($DbPass) {
    $ConnStr += ";Password=$DbPass"
}

try {
    Write-Host "Vérification de la connection PostgreSQL..."
    $TempConnStr = "$ConnStr;Database=postgres"
    
    # Vérifier si la base existe
    Write-Host "Vérification de la base de données '$DbName'..."
    $CheckDbCmd = "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
    $Result = & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -tc $CheckDbCmd 2>&1
    
    if ($Result -notMatch "1") {
        Write-Host "Création de la base de données '$DbName'..."
        & psql -h $DbHost -p $DbPort -U $DbUser -d postgres -c "CREATE DATABASE $DbName;" 2>&1 | Out-Null
        Write-Host "✓ Base créée" -ForegroundColor Green
    } else {
        Write-Host "✓ Base existante détectée" -ForegroundColor Green
    }
    
    # Appliquer le schéma
    Write-Host "Application du schéma..."
    $SchemaPath = Join-Path (Get-Location) "db\schema.sql"
    if (Test-Path $SchemaPath) {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $SchemaPath 2>&1 | Out-Null
        Write-Host "✓ Schéma appliqué avec succès" -ForegroundColor Green
    } else {
        Write-Host "✗ Fichier schema.sql non trouvé" -ForegroundColor Red
    }
    
    Write-Host "`n✓ Initialisation terminée!" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant relancer votre application."
    
} catch {
    Write-Host "✗ Erreur: $_" -ForegroundColor Red
    Write-Host "`nAssurez-vous que PostgreSQL est installé et en cours d'exécution." -ForegroundColor Yellow
    exit 1
}
