# Skrypt do trwałego ustawienia JAVA_HOME na Java 17 (wymaga uprawnień administratora)
# Uruchom w PowerShell jako Administrator: .\set-java17-permanent.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Trwałe ustawienie Java 17 dla systemu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź uprawnienia administratora
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] Ten skrypt wymaga uprawnień administratora!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Uruchom PowerShell jako Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Kliknij prawym przyciskiem na PowerShell" -ForegroundColor Yellow
    Write-Host "  2. Wybierz 'Uruchom jako administrator'" -ForegroundColor Yellow
    Write-Host "  3. Uruchom: .\set-java17-permanent.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Szukaj Java 17
$java17Paths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files (x86)\Java\jdk-17*",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17*"
)

$foundJava17 = $null

foreach ($path in $java17Paths) {
    $dirs = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer }
    if ($dirs) {
        $foundJava17 = $dirs[0].FullName
        break
    }
}

if (-not $foundJava17) {
    Write-Host "[ERROR] Java 17 nie została znaleziona!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Zainstaluj Java 17:" -ForegroundColor Yellow
    Write-Host "  1. Pobierz z: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
    Write-Host "  2. Wybierz: Windows x64, JDK, .msi installer" -ForegroundColor Yellow
    Write-Host "  3. Zainstaluj" -ForegroundColor Yellow
    Write-Host "  4. Uruchom ten skrypt ponownie" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "[OK] Znaleziono Java 17 w: $foundJava17" -ForegroundColor Green
Write-Host ""

# Ustaw JAVA_HOME w zmiennych środowiskowych systemowych
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $foundJava17, [System.EnvironmentVariableTarget]::Machine)

# Zaktualizuj PATH jeśli potrzeba
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::Machine)
$javaBinPath = Join-Path $foundJava17 "bin"

if ($currentPath -notlike "*$javaBinPath*") {
    $newPath = "$javaBinPath;$currentPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, [System.EnvironmentVariableTarget]::Machine)
    Write-Host "[OK] Dodano Java 17 do PATH" -ForegroundColor Green
}

# Ustaw dla bieżącej sesji
$env:JAVA_HOME = $foundJava17

Write-Host "[OK] JAVA_HOME ustawione trwale na: $foundJava17" -ForegroundColor Green
Write-Host ""
Write-Host "UWAGA: Możesz potrzebować zrestartować terminal/PowerShell, aby zmiany zostały zastosowane." -ForegroundColor Yellow
Write-Host ""
