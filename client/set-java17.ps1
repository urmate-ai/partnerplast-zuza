# Skrypt do ustawienia JAVA_HOME na Java 17
# Uruchom w PowerShell: .\set-java17.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Konfiguracja Java 17 dla Android Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Szukaj Java 17 w typowych lokalizacjach
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
    Write-Host "[ERROR] Java 17 nie zostala znaleziona!" -ForegroundColor Red
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

# Sprawdz czy to rzeczywiscie Java 17
$javaExe = Join-Path $foundJava17 "bin\java.exe"
if (Test-Path $javaExe) {
    $version = & $javaExe -version 2>&1 | Select-String "version"
    Write-Host "Wersja Java: $version" -ForegroundColor Cyan
    if ($version -notmatch 'version "17') {
        Write-Host "[WARNING] To nie jest Java 17!" -ForegroundColor Yellow
    }
}

# Ustaw JAVA_HOME dla tej sesji
$env:JAVA_HOME = $foundJava17
Write-Host ""
Write-Host "[OK] JAVA_HOME ustawione na: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Weryfikuj
Write-Host "Weryfikacja:" -ForegroundColor Cyan
java -version
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teraz mozesz zbudowac APK:" -ForegroundColor Green
Write-Host "  cd android" -ForegroundColor Yellow
Write-Host "  ./gradlew --stop" -ForegroundColor Yellow
Write-Host "  ./gradlew assembleRelease --no-daemon" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "UWAGA: To ustawia JAVA_HOME tylko dla tej sesji PowerShell." -ForegroundColor Yellow
Write-Host "Aby ustawic na stale, dodaj do zmiennych srodowiskowych systemowych." -ForegroundColor Yellow
Write-Host ""
