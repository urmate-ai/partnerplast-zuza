# Deep Linking w Expo Go - Instrukcje

## Problem
Safari na iOS nie mógł otworzyć linku callback po zalogowaniu Google, pokazując błąd "invalid".

## Przyczyna
W **Expo Go** URL scheme jest inny niż w standalone build:
- **Expo Go**: `exp://192.168.0.23:8081/--/auth/google/callback`
- **Standalone**: `urmate-ai-zuza://auth/google/callback`

Kod sprawdzał tylko dokładne dopasowanie ścieżki, co nie działało dla Expo Go.

## Rozwiązanie
Zaktualizowano kod, aby sprawdzał czy URL **zawiera** `auth/google/callback` zamiast dokładnego dopasowania.

## Jak przetestować?

### 1. Zrestartuj aplikację
```bash
# W terminalu klienta (jeśli aplikacja jest uruchomiona)
# Naciśnij 'r' aby przeładować aplikację

# LUB zatrzymaj (Ctrl+C) i uruchom ponownie:
npm start
```

### 2. Testuj logowanie Google

1. **Otwórz aplikację w Expo Go** na telefonie
2. Na ekranie logowania kliknij **"Continue with Google"**
3. **Zaloguj się przez Google**
4. **Powinno automatycznie wrócić do aplikacji i zalogować Cię**

### 3. Sprawdź logi w konsoli

W terminalu Metro powinieneś zobaczyć:

```
[OAuth] Opening browser with redirect URL: exp://192.168.0.23:8081/--/auth/google/callback
[OAuth] Auth URL: https://urmate-ai-zuza.onrender.com/api/v1/auth/google?state=exp%3A%2F%2F...
```

Po zalogowaniu:

```
[OAuth] Deep link received: exp://192.168.0.23:8081/--/auth/google/callback?code=...
[OAuth] Parsed path: auth/google/callback queryParams: { code: '...' }
[OAuth] Callback detected!
[OAuth] Callback params: { code: true, error: undefined }
[OAuth] Exchanging code for token...
[OAuth] Token exchange successful
```

### 4. Co jeśli nadal nie działa?

#### A. Sprawdź, czy aplikacja została przeładowana
Po zmianach w kodzie, musisz przeładować aplikację:
- Naciśnij **'r'** w terminalu Metro
- LUB potrząśnij telefonem i wybierz "Reload"

#### B. Sprawdź logi
Jeśli widzisz:
```
[OAuth] Browser result: {"type": "cancel"}
```
Oznacza to, że:
- Anulowałeś logowanie
- LUB Safari nie mógł otworzyć linku callback

Jeśli Safari pokazuje błąd "invalid", sprawdź czy widzisz w logach:
```
[OAuth] Callback detected!
```

Jeśli **NIE** widzisz tego logu, problem jest z parsowaniem URL.

#### C. Debuguj ręcznie
Możesz przetestować deep link ręcznie:

1. **Skopiuj URL z logów:**
   ```
   exp://192.168.0.23:8081/--/auth/google/callback?code=test123
   ```

2. **Otwórz Safari na iOS**

3. **Wklej URL w pasku adresu i naciśnij Enter**

4. **Powinno otworzyć aplikację w Expo Go**

Jeśli to działa, problem jest po stronie backendu (nieprawidłowy redirect).

### 5. Testuj integracje (Gmail/Calendar)

Po naprawieniu logowania Google, przetestuj również integracje:

1. Przejdź do **Settings → Integrations**
2. Kliknij **"Connect"** przy Gmail lub Calendar
3. Zaloguj się przez Google
4. **Powinno automatycznie wrócić do aplikacji**

W logach powinieneś zobaczyć:
```
Gmail redirect URL: exp://192.168.0.23:8081/--/integrations
[Navigation] Subscribe received URL: exp://192.168.0.23:8081/--/integrations?gmail=success
Gmail auth result: { type: 'success', url: '...' }
```

## Różnice między Expo Go a Standalone Build

| Aspekt | Expo Go | Standalone Build |
|--------|---------|------------------|
| URL Scheme | `exp://IP:PORT/--/path` | `urmate-ai-zuza://path` |
| Konfiguracja | Automatyczna | Wymaga `app.json` |
| Testowanie | Szybkie, bez budowania | Wymaga budowania aplikacji |
| Deep Linking | Działa automatycznie | Wymaga konfiguracji iOS |

## Następne kroki

### Dla developmentu (Expo Go)
✅ Wszystko powinno teraz działać!

### Dla produkcji (Standalone Build)
Gdy będziesz gotowy do stworzenia standalone build:

1. **Zbuduj aplikację:**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Zainstaluj na telefonie**

3. **Przetestuj deep linking** - powinno działać z `urmate-ai-zuza://`

4. **Jeśli są problemy**, sprawdź:
   - `app.json` - czy `CFBundleURLSchemes` jest prawidłowy
   - Google Cloud Console - czy redirect URI zawiera `urmate-ai-zuza://`

## Podsumowanie zmian

### Przed:
```typescript
if (path === 'auth/google/callback') {
  // Obsłuż callback
}
```

### Po:
```typescript
const isCallback = path === 'auth/google/callback' || 
                  path?.includes('auth/google/callback') ||
                  event.url.includes('auth/google/callback');

if (isCallback) {
  // Obsłuż callback
}
```

To pozwala obsłużyć zarówno:
- `urmate-ai-zuza://auth/google/callback` (standalone)
- `exp://IP:PORT/--/auth/google/callback` (Expo Go)

## Pomoc

Jeśli nadal masz problemy:
1. Sprawdź `DEEP_LINKING_FIX.md` - szczegółowa dokumentacja
2. Sprawdź `DEEP_LINKING_CHANGES.md` - pełne podsumowanie zmian
3. Sprawdź logi w konsoli Metro - wszystkie błędy są tam widoczne
