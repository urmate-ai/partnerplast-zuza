#!/bin/bash
# Skrypt do lokalnego builda Android APK

set -e

echo "=========================================="
echo "Lokalny build Android APK"
echo "=========================================="
echo ""

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -d "android" ]; then
    echo "[INFO] Folder android nie istnieje, generowanie..."
    npx expo prebuild --platform android --clean
fi

cd android

# Sprawdź Java
if [ -z "$JAVA_HOME" ]; then
    echo "[WARNING] JAVA_HOME nie jest ustawione"
    echo ""
    echo "Ustaw JAVA_HOME na Java 17:"
    echo "  export JAVA_HOME=/path/to/jdk-17"
    echo ""
    echo "Lub użyj EAS Build lokalnie (nie wymaga Java):"
    echo "  eas build --platform android --profile preview --local"
    echo ""
    exit 1
fi

# Sprawdź wersję Java
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VERSION" != "17" ]; then
    echo "[WARNING] Java wersja $JAVA_VERSION wykryta, ale potrzebna jest Java 17"
    echo ""
    echo "Ustaw JAVA_HOME na Java 17:"
    echo "  export JAVA_HOME=/path/to/jdk-17"
    echo ""
    exit 1
fi

echo "[OK] Java 17 wykryta"
echo ""

# Zatrzymaj wszystkie daemony Gradle
echo "[INFO] Zatrzymywanie daemonów Gradle..."
./gradlew --stop 2>/dev/null || true

# Zbuduj APK
echo "[INFO] Budowanie APK Release..."
./gradlew assembleRelease --no-daemon

echo ""
echo "=========================================="
echo "Build zakończony!"
echo "=========================================="
echo ""
echo "APK znajduje się w:"
echo "  android/app/build/outputs/apk/release/app-release.apk"
echo ""
