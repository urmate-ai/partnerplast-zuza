# Instrukcje budowania aplikacji mobilnej

## Wymagania wstępne

1. **Konto Expo** - Zarejestruj się na [expo.dev](https://expo.dev)
2. **EAS CLI** - Zainstaluj globalnie:
   ```bash
   npm install -g eas-cli
   ```

3. **Zaloguj się do Expo**:
   ```bash
   eas login
   ```

## Budowanie aplikacji

### Android (APK)

#### 1. Budowanie APK do testów (preview):
```bash
cd client
npm run build:android
```

Lub bezpośrednio:
```bash
eas build --platform android --profile preview
```

#### 2. Budowanie APK produkcyjnego:
```bash
npm run build:android:prod
```

Lub bezpośrednio:
```bash
eas build --platform android --profile production
```

### iOS (IPA)

**UWAGA:** Do budowania aplikacji iOS potrzebujesz:
- Konto Apple Developer (płatne, ~$99/rok)
- Mac z Xcode (dla lokalnego builda)

#### 1. Budowanie IPA do testów (preview):
```bash
cd client
npm run build:ios
```

Lub bezpośrednio:
```bash
eas build --platform ios --profile preview
```

#### 2. Budowanie IPA produkcyjnego:
```bash
npm run build:ios:prod
```

Lub bezpośrednio:
```bash
eas build --platform ios --profile production
```

## Pobieranie zbudowanych aplikacji

Po zakończeniu builda:

1. **Sprawdź status builda**:
   ```bash
   eas build:list
   ```

2. **Pobierz aplikację**:
   - Zaloguj się na [expo.dev](https://expo.dev)
   - Przejdź do sekcji "Builds"
   - Pobierz plik APK (Android) lub IPA (iOS)

3. **Lub użyj bezpośredniego linku**:
   ```bash
   eas build:view
   ```

## Instalacja na urządzeniach

### Android (APK)
1. Pobierz plik `.apk` z Expo
2. Włącz "Źródła nieznane" w ustawieniach bezpieczeństwa Androida
3. Otwórz plik APK i zainstaluj

### iOS (IPA)
1. Pobierz plik `.ipa` z Expo
2. Użyj **TestFlight** (zalecane) lub **AltStore** do instalacji
3. Lub użyj Xcode do instalacji bezpośrednio na urządzeniu

## Lokalne budowanie (opcjonalne)

Jeśli chcesz zbudować lokalnie (wymaga więcej konfiguracji):

### Android (wymaga Android Studio):
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

### iOS (wymaga Mac + Xcode):
```bash
npx expo prebuild
cd ios
xcodebuild -workspace urmate-ai-zuza.xcworkspace -scheme urmate-ai-zuza -configuration Release archive
```

## Konfiguracja EAS

Plik `eas.json` zawiera trzy profile:
- **development** - dla development buildów
- **preview** - dla testów (APK/IPA do instalacji)
- **production** - dla produkcji (App Store / Google Play)

Możesz edytować `eas.json` aby dostosować konfigurację buildów.

## Troubleshooting

### Błąd: "Not logged in"
```bash
eas login
```

### Błąd: "Project not configured"
```bash
eas build:configure
```

### Android: Błąd podpisywania
EAS automatycznie zarządza certyfikatami. Jeśli masz problemy:
```bash
eas credentials
```

### iOS: Błąd certyfikatów
```bash
eas credentials
```

### Android: Błąd CMake z expo-av (ReactAndroid::reactnativejni not found)
Jeśli otrzymujesz błąd związany z CMake i `expo-av` podczas budowania z włączoną nową architekturą React Native (`newArchEnabled: true`), jest to znany problem z kompatybilnością.

**Rozwiązanie:**
Nowa architektura jest tymczasowo wyłączona w `app.json` (`newArchEnabled: false`) ze względu na problemy z `expo-av` i innymi modułami natywnymi.

Gdy `expo-av` zostanie zaktualizowane do pełnej kompatybilności z nową architekturą, można ją ponownie włączyć.

### Android: Błąd Metro config
Jeśli otrzymujesz błąd "metro.config.js that could not be loaded", upewnij się, że:
- Plik używa składni CommonJS (nie ES modules)
- Nie używa optional chaining (`?.`) w starszych wersjach Node.js

## Więcej informacji

- [Dokumentacja EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Build FAQ](https://docs.expo.dev/build/building-on-ci/)
