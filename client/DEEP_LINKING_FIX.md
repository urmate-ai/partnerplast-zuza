# Naprawa Deep Linking dla iOS Safari

## Problem
Po udanym zalogowaniu OAuth lub połączeniu integracji (Gmail/Calendar), Safari nie może otworzyć linku powrotnego do aplikacji, pokazując błąd "invalid".

## Rozwiązanie

### 1. Zmiany w kodzie (już wykonane)

#### a) Zaktualizowano `app.json`:
- Dodano `CFBundleURLName` dla lepszej identyfikacji URL scheme
- Dodano `LSApplicationQueriesSchemes` dla iOS

#### b) Zaktualizowano hooki integracji:
- Zmieniono z hardcoded `urmate-ai-zuza://integrations` na `Linking.createURL('integrations')`
- Dodano opcję `preferEphemeralSession: false` dla lepszej kompatybilności z iOS
- Dodano logi dla debugowania

#### c) Zaktualizowano kontrolery backendu:
- Poprawiono JavaScript w HTML callback dla lepszego wsparcia Safari
- Dodano wielokrotne metody przekierowania (fallback)

#### d) Zaktualizowano NavigationContainer:
- Dodano pełną konfigurację linking z prefiksami
- Dodano mapowanie ścieżek dla wszystkich ekranów

### 2. Kroki testowania

#### Krok 1: Restart aplikacji
```bash
# W terminalu klienta
cd client
npm start
```

#### Krok 2: Sprawdź logi
Po uruchomieniu aplikacji, sprawdź w konsoli:
- `[Navigation] NavigationContainer ready` - potwierdza, że nawigacja jest gotowa
- `Calendar redirect URL: ...` - pokazuje URL używany do przekierowania
- `Gmail redirect URL: ...` - pokazuje URL używany do przekierowania

#### Krok 3: Testuj integracje
1. Otwórz aplikację na telefonie
2. Przejdź do Settings → Integrations
3. Kliknij "Connect" przy Gmail lub Calendar
4. Zaloguj się przez Google
5. Sprawdź logi w konsoli:
   - `Calendar auth result: ...` lub `Gmail auth result: ...`
   - Powinno pokazać typ wyniku (success/cancel/dismiss)

### 3. Debugowanie

#### Sprawdź URL scheme w iOS
```bash
# Sprawdź, czy URL scheme jest prawidłowo zarejestrowany
npx expo prebuild --clean
```

#### Sprawdź logi Expo
```bash
# W terminalu klienta
npx expo start --clear
```

#### Testuj deep link ręcznie
```bash
# W Safari na iOS, wpisz w pasku adresu:
urmate-ai-zuza://integrations?gmail=success

# Lub:
urmate-ai-zuza://integrations?calendar=success
```

### 4. Alternatywne rozwiązania

#### Opcja A: Użyj Expo Go (tylko dla testowania)
Jeśli używasz Expo Go, URL scheme będzie inny:
```
exp://192.168.1.100:8081/--/integrations
```

#### Opcja B: Build standalone (produkcja)
Dla produkcji, zbuduj standalone app:
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

#### Opcja C: Universal Links (zaawansowane)
Dla produkcji, rozważ użycie Universal Links zamiast custom URL scheme:
1. Skonfiguruj Apple App Site Association (AASA) file
2. Dodaj Associated Domains w Xcode
3. Zaktualizuj backend, aby serwował AASA file

### 5. Częste problemy

#### Problem: "Safari cannot open the page because the address is invalid"
**Rozwiązanie:**
1. Sprawdź, czy aplikacja jest zainstalowana na telefonie
2. Sprawdź, czy URL scheme jest prawidłowo skonfigurowany w `app.json`
3. Zrestartuj aplikację i spróbuj ponownie
4. Sprawdź logi w konsoli dla szczegółów

#### Problem: Deep link otwiera aplikację, ale nie nawiguje do właściwego ekranu
**Rozwiązanie:**
1. Sprawdź, czy `NavigationContainer` ma właściwą konfigurację `linking`
2. Sprawdź logi `[Navigation] State changed` w konsoli
3. Upewnij się, że ścieżka w deep link pasuje do konfiguracji w `linking.config.screens`

#### Problem: Aplikacja nie reaguje na deep link
**Rozwiązanie:**
1. Sprawdź, czy `WebBrowser.maybeCompleteAuthSession()` jest wywołane na początku pliku
2. Sprawdź, czy listener `Linking.addEventListener('url', ...)` jest zarejestrowany
3. Sprawdź logi dla błędów

### 6. Weryfikacja

Po zastosowaniu poprawek, powinieneś zobaczyć w logach:
```
[Navigation] NavigationContainer ready
Calendar redirect URL: urmate-ai-zuza://integrations
Calendar auth result: { type: 'success', url: '...' }
[Navigation] State changed: ...
```

I aplikacja powinna automatycznie wrócić do ekranu Integrations po udanym zalogowaniu.

## Dodatkowe zasoby

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [iOS URL Schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)
- [Universal Links](https://developer.apple.com/ios/universal-links/)
