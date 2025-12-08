# Szybki test naprawy Deep Linking

## Co zostało naprawione?

Safari na iOS nie mógł otworzyć linku `urmate-ai-zuza://auth/google/callback?code=...` ponieważ React Navigation nie wiedział, jak obsłużyć tę ścieżkę.

## Rozwiązanie

Dodano `subscribe` w konfiguracji linking, który przechwytuje deep linki przed React Navigation. Linki `auth/google/callback` są teraz ignorowane w nawigacji i obsługiwane bezpośrednio przez `oauth.service.ts`.

## Jak przetestować?

### 1. Restart aplikacji

```bash
# Zatrzymaj aplikację (Ctrl+C w terminalu)
# Uruchom ponownie
npm start
```

### 2. Testuj logowanie Google

1. Otwórz aplikację na telefonie
2. Na ekranie logowania kliknij "Continue with Google"
3. Zaloguj się przez Google
4. **Powinno automatycznie wrócić do aplikacji i zalogować Cię**

### 3. Sprawdź logi

W konsoli Metro (terminal gdzie uruchomiłeś `npm start`) powinieneś zobaczyć:

```
[OAuth] Opening browser with redirect URL: urmate-ai-zuza://auth/google/callback
[Navigation] Subscribe received URL: urmate-ai-zuza://auth/google/callback?code=...
[Navigation] Ignoring auth/google/callback in navigation
[OAuth] Deep link received: urmate-ai-zuza://auth/google/callback?code=...
[OAuth] Callback params: { code: true, error: undefined }
[OAuth] Exchanging code for token...
[OAuth] Token exchange successful
```

### 4. Testuj integracje (Gmail/Calendar)

1. Przejdź do Settings → Integrations
2. Kliknij "Connect" przy Gmail lub Calendar
3. Zaloguj się przez Google
4. **Powinno automatycznie wrócić do aplikacji**

W konsoli powinieneś zobaczyć:

```
Gmail redirect URL: urmate-ai-zuza://integrations
[Navigation] Subscribe received URL: urmate-ai-zuza://integrations?gmail=success
Gmail auth result: { type: 'success', url: '...' }
```

## Co jeśli nadal nie działa?

### Sprawdź konfigurację

1. **Upewnij się, że aplikacja jest zrestartowana** - zmiany w `app.json` wymagają restartu
2. **Sprawdź logi** - wszystkie problemy będą widoczne w konsoli
3. **Sprawdź, czy jesteś w tej samej sieci Wi-Fi** - telefon i komputer muszą być w tej samej sieci

### Debugowanie

Jeśli Safari nadal pokazuje "invalid":

1. Sprawdź w konsoli, czy widzisz:
   ```
   [Navigation] NavigationContainer ready
   ```

2. Jeśli nie, problem jest z konfiguracją nawigacji

3. Jeśli tak, ale nadal nie działa, sprawdź czy URL scheme jest prawidłowy:
   ```bash
   # W terminalu
   npx expo prebuild --clean
   ```

### Testuj ręcznie deep link

Możesz przetestować deep link ręcznie w Safari:

1. Otwórz Safari na iOS
2. W pasku adresu wpisz:
   ```
   urmate-ai-zuza://auth/google/callback?code=test123
   ```
3. Naciśnij Enter
4. **Powinno otworzyć aplikację**

Jeśli to działa, problem jest po stronie backendu (nieprawidłowy redirect URL).

## Następne kroki

Jeśli wszystko działa:
- ✅ Możesz normalnie korzystać z logowania Google
- ✅ Możesz łączyć integracje Gmail i Calendar
- ✅ Deep linking działa prawidłowo

Jeśli nadal są problemy:
- Sprawdź `DEEP_LINKING_FIX.md` dla bardziej szczegółowych instrukcji
- Sprawdź `DEEP_LINKING_CHANGES.md` dla pełnego podsumowania zmian
