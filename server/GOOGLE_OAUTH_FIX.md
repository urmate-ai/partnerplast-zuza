# Naprawa błędu 400 z Google OAuth

## Problem

Gdy serwer ma domenę `https://partnerplast-zuza.onrender.com`, Google zwraca błąd 400 podczas OAuth.

## Przyczyna

Błąd 400 oznacza, że **redirect URI użyty w żądaniu OAuth nie jest zarejestrowany w Google Cloud Console**.

Serwer automatycznie buduje redirect URI na podstawie `PUBLIC_URL`:

- **Google Login (Auth)**: `https://partnerplast-zuza.onrender.com/api/v1/auth/google/callback`
- **Gmail Integration**: `https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback`
- **Calendar Integration**: `https://partnerplast-zuza.onrender.com/api/v1/integrations/calendar/callback`

**UWAGA**: Expo automatycznie konwertuje `exp://` na `https://ehdjms4-anonymous-8081.exp.direct/...`, ale kod został zaktualizowany, aby używać URL serwera jako redirect URI dla Google OAuth.

## Rozwiązanie

### Krok 1: Sprawdź logi serwera

Po uruchomieniu integracji, w logach zobaczysz:

```
[GoogleOAuth] Built redirect URI from PUBLIC_URL: https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback
```

Skopiuj dokładnie ten URI.

### Krok 2: Zarejestruj redirect URI w Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Wybierz swój projekt
3. Przejdź do **APIs & Services** → **Credentials**
4. Kliknij na swoje **OAuth 2.0 Client ID**
5. W sekcji **Authorized redirect URIs** dodaj **wszystkie** potrzebne URIs:
   ```
   https://partnerplast-zuza.onrender.com/api/v1/auth/google/callback
   https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback
   https://partnerplast-zuza.onrender.com/api/v1/integrations/calendar/callback
   ```
6. **WAŻNE**: URIs muszą być **dokładnie** takie same (z `/api/v1`, bez końcowego `/`)
7. Kliknij **Save**

### Krok 3: Ustaw zmienne środowiskowe

Upewnij się, że w `.env` lub w ustawieniach Render masz:

```env
PUBLIC_URL=https://partnerplast-zuza.onrender.com
```

Lub użyj explicit redirect URIs:

```env
PUBLIC_URL=https://partnerplast-zuza.onrender.com
GMAIL_REDIRECT_URI=https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback
CALENDAR_REDIRECT_URI=https://partnerplast-zuza.onrender.com/api/v1/integrations/calendar/callback
```

### Krok 4: Restart serwera

Po zmianie zmiennych środowiskowych, zrestartuj serwer.

## Weryfikacja

1. Sprawdź logi serwera - powinieneś zobaczyć:

   ```
   [GoogleOAuth] Built redirect URI from PUBLIC_URL: https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback
   ```

2. Spróbuj połączyć Gmail/Calendar ponownie

3. Jeśli nadal błąd 400, sprawdź:
   - Czy URI w logach **dokładnie** pasuje do tego w Google Console
   - Czy nie ma dodatkowych `/` na końcu
   - Czy używasz `https://` (nie `http://`)
   - Czy domena jest poprawna

## Alternatywne rozwiązanie: Explicit Redirect URIs

Jeśli chcesz mieć pełną kontrolę, użyj explicit redirect URIs zamiast `PUBLIC_URL`:

```env
# Nie ustawiaj PUBLIC_URL dla OAuth (lub ustaw, ale użyj explicit URIs)
GMAIL_REDIRECT_URI=https://partnerplast-zuza.onrender.com/api/v1/integrations/gmail/callback
CALENDAR_REDIRECT_URI=https://partnerplast-zuza.onrender.com/api/v1/integrations/calendar/callback
```

Wtedy `buildRedirectUri` użyje tych wartości zamiast budować z `PUBLIC_URL`.

## Troubleshooting

### Błąd: "redirect_uri_mismatch"

- Sprawdź czy URI w Google Console **dokładnie** pasuje do tego w logach
- Sprawdź czy nie ma różnic w wielkości liter
- Sprawdź czy nie ma dodatkowych znaków (spacje, `/` na końcu)

### Błąd: "invalid_client"

- Sprawdź czy `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` są poprawne
- Sprawdź czy używasz OAuth 2.0 Client ID (nie Service Account)

### Błąd nadal występuje

1. Sprawdź logi serwera - zobaczysz dokładny redirect URI
2. Skopiuj go dokładnie
3. Dodaj do Google Console
4. Poczekaj 1-2 minuty (Google może potrzebować czasu na propagację)
5. Spróbuj ponownie
