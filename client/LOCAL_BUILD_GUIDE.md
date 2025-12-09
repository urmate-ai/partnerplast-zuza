# Lokalne budowanie APK - Szybki przewodnik

## ⚡ Najszybsza opcja: EAS Build lokalnie (Zalecane)

**Nie wymaga Java 17 ani Android NDK!** Używa Docker z gotowym środowiskiem:

```bash
cd client
eas build --platform android --profile preview --local
```

To zbuduje APK lokalnie w kontenerze Docker (automatycznie zarządza Java 17, Android SDK, NDK i wszystkimi zależnościami).

**Wymaga:** Docker Desktop (pobierz z https://www.docker.com/products/docker-desktop/)

---

## Lokalny build bez Docker

⚠️ **Uwaga:** Lokalny build wymaga:
- Java 17 (masz Java 24)
- Android SDK (✅ masz)
- Android NDK 27.0.12077973 (❌ brakuje)

**Zalecamy użycie EAS Build lokalnie** - automatycznie ma wszystko gotowe!

---

### Problem 1: Java 24 vs Java 17

Masz Java 24, ale Gradle wymaga Java 17. Masz dwie opcje:

### Opcja 1: Zainstaluj Java 17 obok Java 24 (Zalecane)

1. **Pobierz Java 17 JDK:**
   - [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17) (zalecane)
   - Lub [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)

2. **Zainstaluj Java 17** (np. do `C:\Program Files\Java\jdk-17`)

3. **Ustaw JAVA_HOME dla tej sesji:**
   ```bash
   export JAVA_HOME="C:/Program Files/Java/jdk-17"
   # Lub gdzie zainstalowałeś Java 17
   ```

4. **Weryfikuj:**
   ```bash
   java -version
   # Powinno pokazać wersję 17
   ```

### Opcja 2: Użyj Gradle Toolchain (Automatyczna pobieranie Java 17)

Gradle może automatycznie pobrać Java 17. Sprawdź czy działa:

```bash
cd client
npx expo prebuild --platform android
cd android
./gradlew assembleRelease --no-daemon
```

## Krok po kroku - Lokalny build APK

### 1. Wygeneruj natywne foldery (jeśli nie istnieją)

```bash
cd client
npx expo prebuild --platform android
```

To utworzy folder `android/` z natywnym kodem Android.

### 2. Zbuduj APK

```bash
cd android
./gradlew assembleRelease
```

APK znajdziesz w: `android/app/build/outputs/apk/release/app-release.apk`

### 3. Podpisz APK (opcjonalnie, dla produkcji)

Dla testów możesz użyć debug signing (domyślnie). Dla produkcji potrzebujesz:
- Keystore
- Konfiguracja w `android/app/build.gradle`

## Szybki build (bez podpisywania)

```bash
cd client
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Błąd: "Cannot find Java 17"

**Rozwiązanie 1:** Ustaw JAVA_HOME:
```bash
export JAVA_HOME="C:/Program Files/Java/jdk-17"
# Sprawdź ścieżkę do swojej instalacji Java 17
```

**Rozwiązanie 2:** Dodaj do `android/gradle.properties`:
```properties
org.gradle.java.home=C:/Program Files/Java/jdk-17
```

### Błąd: "Gradle daemon"

```bash
cd android
./gradlew --stop
./gradlew assembleRelease --no-daemon
```

### Błąd: "A restricted method in java.lang.System has been called" (CMake + Java 24)

**Problem:** Java 24 ma restrykcyjne zasady, które blokują CMake.

**Rozwiązanie:** **Użyj Java 17!** Java 24 nie jest kompatybilna z CMake używanym przez React Native.

1. **Zainstaluj Java 17** (zobacz sekcję "Instalacja Java 17" poniżej)
2. **Ustaw JAVA_HOME:**
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot"
   ```
3. **Zatrzymaj daemony i zbuduj:**
   ```bash
   cd client/android
   ./gradlew --stop
   ./gradlew assembleRelease --no-daemon
   ```

**Lub użyj EAS Build lokalnie** - automatycznie używa Java 17:
```bash
cd client
eas build --platform android --profile preview --local
```

### Błąd: "NDK location not found" lub "Failed to install NDK"

**Rozwiązanie:** Zainstaluj Android NDK:

1. **Otwórz Android Studio**
2. **Tools → SDK Manager** (lub `File → Settings → Appearance & Behavior → System Settings → Android SDK`)
3. **Zakładka "SDK Tools"**
4. **Zaznacz:**
   - ✅ NDK (Side by side)
   - ✅ CMake (opcjonalnie, ale zalecane)
5. **Zaznacz "Show Package Details"** i wybierz wersję **27.0.12077973** (lub 27.1.12297006)
6. **Apply** → poczekaj na instalację

**Alternatywa:** Zobacz szczegółowe instrukcje w `install-ndk.md`

**Najszybsze rozwiązanie:** Użyj `eas build --local` - nie wymaga instalacji NDK!

### Błąd: "Metro bundler"

Upewnij się, że Metro nie działa w tle:
```bash
# Zatrzymaj wszystkie procesy Metro/Expo
# Następnie spróbuj ponownie
```

## Alternatywa: Użyj EAS Build lokalnie (szybsze)

EAS może budować lokalnie używając Docker:

```bash
cd client
eas build --platform android --profile preview --local
```

Wymaga Docker Desktop, ale automatycznie zarządza Java i środowiskiem.

## 🚀 Najszybsza opcja (Zalecana)

**EAS Build lokalnie z Docker** - nie potrzebujesz Java 17:

```bash
cd client
eas build --platform android --profile preview --local
```

Wymaga Docker Desktop, ale automatycznie zarządza wszystkimi zależnościami.

## 📥 Instalacja Java 17 (jeśli chcesz budować bez Docker)

1. **Pobierz Java 17 JDK:**
   - [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17) (zalecane)
   - Wybierz: Windows x64, JDK, .msi installer

2. **Zainstaluj** (np. do `C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot`)

3. **Ustaw JAVA_HOME w PowerShell:**
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot"
   # Sprawdź ścieżkę do swojej instalacji
   ```

4. **Weryfikuj:**
   ```bash
   java -version
   # Powinno pokazać wersję 17
   ```

5. **Zbuduj:**
   ```bash
   cd client/android
   ./gradlew assembleRelease --no-daemon
   ```
