# Ustawienie Java 17 - Instrukcja

## Szybki start

### Opcja 1: Tymczasowe (tylko dla tej sesji)

1. **Otwórz PowerShell** w folderze `client`
2. **Uruchom:**
   ```powershell
   .\set-java17.ps1
   ```
3. **Zbuduj APK:**
   ```bash
   cd android
   ./gradlew --stop
   ./gradlew assembleRelease --no-daemon
   ```

### Opcja 2: Trwałe (dla całego systemu)

1. **Otwórz PowerShell jako Administrator** (prawy przycisk → "Uruchom jako administrator")
2. **Przejdź do folderu `client`:**
   ```powershell
   cd C:\Users\oliwi\Desktop\urmate-ai-zuza\client
   ```
3. **Uruchom:**
   ```powershell
   .\set-java17-permanent.ps1
   ```
4. **Zrestartuj terminal/PowerShell**
5. **Zbuduj APK:**
   ```bash
   cd android
   ./gradlew --stop
   ./gradlew assembleRelease --no-daemon
   ```

## Jeśli Java 17 nie jest zainstalowana

1. **Pobierz Java 17:**
   - Link: https://adoptium.net/temurin/releases/?version=17
   - Wybierz: **Windows x64**, **JDK**, **.msi installer**

2. **Zainstaluj** (domyślnie do `C:\Program Files\Eclipse Adoptium\jdk-17...`)

3. **Uruchom jeden ze skryptów powyżej**

## Weryfikacja

Sprawdź czy Java 17 jest ustawiona:

```powershell
java -version
# Powinno pokazać: java version "17.x.x"
```

```powershell
$env:JAVA_HOME
# Powinno pokazać ścieżkę do Java 17
```

## Alternatywa: EAS Build lokalnie

Jeśli nie chcesz instalować Java 17, użyj EAS Build lokalnie (automatycznie używa Java 17 w Docker):

```bash
cd client
eas build --platform android --profile preview --local
```

Wymaga Docker Desktop.
