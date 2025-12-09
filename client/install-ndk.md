# Instalacja Android NDK - Szybki przewodnik

## Problem
Build wymaga Android NDK 27.0.12077973, ale nie jest zainstalowany.

## 🚀 Najszybsza opcja: EAS Build lokalnie (Zalecane)

**Nie wymaga instalacji NDK!** Używa Docker z gotowym środowiskiem:

```bash
cd client
eas build --platform android --profile preview --local
```

To automatycznie ma wszystkie potrzebne komponenty (NDK, SDK, Java 17).

---

## Opcja 2: Instalacja NDK przez Android Studio

1. **Otwórz Android Studio**
2. **Tools → SDK Manager** (lub `File → Settings → Appearance & Behavior → System Settings → Android SDK`)
3. **Zakładka "SDK Tools"**
4. **Zaznacz:**
   - ✅ NDK (Side by side)
   - ✅ CMake (opcjonalnie, ale zalecane)
5. **Zaznacz "Show Package Details"** i wybierz wersję **27.0.12077973**
6. **Apply** → poczekaj na instalację

---

## Opcja 3: Instalacja przez wiersz poleceń

### Krok 1: Pobierz Command Line Tools

1. Pobierz: https://developer.android.com/studio#command-tools
2. Rozpakuj do: `C:\Users\oliwi\AppData\Local\Android\Sdk\cmdline-tools\latest\`

### Krok 2: Zainstaluj NDK

```bash
cd "C:\Users\oliwi\AppData\Local\Android\Sdk\cmdline-tools\latest\bin"
./sdkmanager.bat "ndk;27.0.12077973"
```

Lub zainstaluj najnowszą wersję:
```bash
./sdkmanager.bat "ndk;27.1.12297006"
```

### Krok 3: Zaktualizuj konfigurację (jeśli używasz innej wersji)

Jeśli zainstalowałeś inną wersję NDK, możesz zaktualizować `app/build.gradle`:

```gradle
android {
    ndkVersion "27.1.12297006" // lub twoja wersja
}
```

---

## Opcja 4: Tymczasowe wyłączenie NDK (tylko do testów)

⚠️ **Nie zalecane** - może powodować problemy z natywnymi modułami.

Jeśli chcesz spróbować (może nie działać z `react-native-worklets-core`):

W `android/app/build.gradle` dodaj:
```gradle
android {
    packagingOptions {
        pickFirst '**/libc++_shared.so'
    }
}
```

Ale lepiej zainstalować NDK.

---

## Rekomendacja

**Użyj EAS Build lokalnie** - to najszybsze i najprostsze rozwiązanie:

```bash
cd client
eas build --platform android --profile preview --local
```

Wymaga Docker Desktop, ale automatycznie ma wszystko gotowe.
