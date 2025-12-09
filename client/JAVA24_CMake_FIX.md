# Problem: Java 24 + CMake - "A restricted method in java.lang.System has been called"

## Problem

Java 24 wprowadza bardzo restrykcyjne zasady dotyczące dostępu do wewnętrznych API. CMake (używany przez React Native moduły natywne) próbuje używać metod, które są zablokowane w Java 24.

## ✅ Najlepsze rozwiązanie: Użyj Java 17

**Java 17 jest wymagana i zalecana dla React Native/Expo projektów.**

### Opcja 1: EAS Build lokalnie (Zalecane - nie wymaga Java 17)

```bash
cd client
eas build --platform android --profile preview --local
```

To automatycznie używa Java 17 w kontenerze Docker.

### Opcja 2: Zainstaluj Java 17 i ustaw JAVA_HOME

1. **Pobierz Java 17:**
   - [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17)
   - Windows x64, JDK, .msi installer

2. **Zainstaluj** (np. do `C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot`)

3. **Ustaw JAVA_HOME w PowerShell:**
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot"
   # Sprawdź dokładną ścieżkę w Program Files
   ```

4. **Weryfikuj:**
   ```bash
   java -version
   # Powinno pokazać wersję 17
   ```

5. **Zatrzymaj daemony Gradle i zbuduj:**
   ```bash
   cd client/android
   ./gradlew --stop
   ./gradlew assembleRelease --no-daemon
   ```

## ⚠️ Tymczasowe obejście (Java 24)

Jeśli musisz użyć Java 24, możesz spróbować dodać więcej flag JVM (już dodane w `gradle.properties`), ale **nie jest to zalecane** i może nie działać dla wszystkich modułów.

Dodane flagi w `gradle.properties`:
```
--add-opens=java.base/java.lang=ALL-UNNAMED
--add-opens=java.base/java.lang.reflect=ALL-UNNAMED
--add-opens=java.base/java.io=ALL-UNNAMED
--add-opens=java.base/java.util=ALL-UNNAMED
--add-opens=java.base/java.nio=ALL-UNNAMED
--add-opens=java.base/sun.nio.ch=ALL-UNNAMED
--add-opens=java.base/java.net=ALL-UNNAMED
--add-opens=java.base/java.util.concurrent=ALL-UNNAMED
```

**Ale to może nie wystarczyć** - Java 24 ma bardzo restrykcyjne zasady i CMake może nadal nie działać.

## Rekomendacja

**Użyj EAS Build lokalnie** - to najszybsze i najpewniejsze rozwiązanie:

```bash
cd client
eas build --platform android --profile preview --local
```

Wymaga Docker Desktop, ale automatycznie ma:
- ✅ Java 17
- ✅ Android SDK
- ✅ Android NDK
- ✅ Wszystkie potrzebne narzędzia
