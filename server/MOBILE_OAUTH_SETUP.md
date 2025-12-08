# Konfiguracja OAuth dla urządzeń mobilnych (Expo GO)

## Problem

OAuth callback używa `localhost`, który nie działa na telefonie. Telefon nie może połączyć się z `localhost:3000` - potrzebuje rzeczywistego IP serwera.

## Rozwiązanie

### Opcja 1: Użyj IP lokalnego komputera (Najszybsze dla developmentu)

1. **Znajdź swoje lokalne IP:**

   ```bash
   # Windows
   ipconfig
   # Szukaj "IPv4 Address" w sekcji Wi-Fi/Ethernet (np. 192.168.1.100)

   # macOS/Linux
   ifconfig
   # lub
   ip addr show
   ```

2. **Dodaj do `.env`:**

   ```bash
   PUBLIC_URL=http://192.168.1.100:3000
   ```

   (Zamień `192.168.1.100` na swoje IP)

3. **Dodaj redirect URI w Google Cloud Console:**
   - Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Edytuj OAuth 2.0 Client ID
   - Dodaj **Authorized redirect URIs**:
     ```
     http://192.168.1.100:3000/api/v1/auth/google/callback
     http://192.168.1.100:3000/api/v1/integrations/gmail/callback
     http://192.168.1.100:3000/api/v1/integrations/calendar/callback
     ```
   - Kliknij "Save"

4. **Restart Docker:**

   ```bash
   docker-compose restart backend-dev-zuza
   ```

5. **Sprawdź logi:**
   ```bash
   docker-compose logs backend-dev-zuza | grep "callback URL"
   ```
   Powinno pokazać: `Google OAuth callback URL: http://192.168.1.100:3000/api/v1/auth/google/callback`

### Opcja 2: Użyj ngrok (Najlepsze dla testowania z różnych sieci)

1. **Zainstaluj ngrok:**
   - Pobierz z [ngrok.com](https://ngrok.com/)
   - Zarejestruj się i pobierz authtoken

2. **Uruchom ngrok:**

   ```bash
   ngrok http 3000
   ```

3. **Skopiuj URL** (np. `https://abc123.ngrok.io`)

4. **Dodaj do `.env`:**

   ```bash
   PUBLIC_URL=https://abc123.ngrok.io
   ```

5. **Dodaj redirect URI w Google Cloud Console:**

   ```
   https://abc123.ngrok.io/api/v1/auth/google/callback
   https://abc123.ngrok.io/api/v1/integrations/gmail/callback
   https://abc123.ngrok.io/api/v1/integrations/calendar/callback
   ```

6. **Restart Docker:**
   ```bash
   docker-compose restart backend-dev-zuza
   ```

### Opcja 3: Użyj Expo Tunnel (Wbudowane w Expo)

1. **Uruchom Expo z tunelem:**

   ```bash
   cd client
   npx expo start --tunnel
   ```

2. **Backend musi być dostępny publicznie** - użyj ngrok dla backendu (Opcja 2)

## Aktualizacja klienta (jeśli potrzebne)

Jeśli używasz IP lokalnego, upewnij się, że klient używa tego samego IP:

```typescript
// client/src/config/api.config.ts
export const API_BASE_URL = 'http://192.168.1.100:3000/api/v1';
```

## Weryfikacja

1. **Sprawdź, czy backend jest dostępny z telefonu:**

   ```bash
   # Na telefonie otwórz przeglądarkę i wejdź na:
   http://192.168.1.100:3000/api/v1/health
   ```

   Powinno zwrócić: `{"status":"ok"}`

2. **Sprawdź logi OAuth:**

   ```bash
   docker-compose logs -f backend-dev-zuza | grep -i oauth
   ```

3. **Testuj logowanie:**
   - Otwórz aplikację na telefonie
   - Kliknij "Zaloguj przez Google"
   - Powinno przekierować do Google
   - Po zalogowaniu powinno wrócić do aplikacji

## Troubleshooting

### "redirect_uri_mismatch"

- Upewnij się, że URL w Google Console **dokładnie** pasuje do `PUBLIC_URL`
- Sprawdź logi backendu, aby zobaczyć, jaki URL jest używany
- Poczekaj 5-10 minut po zmianie w Google Console (cache)

### "ERR_CONNECTION_REFUSED"

- Sprawdź, czy firewall nie blokuje portu 3000
- Upewnij się, że telefon i komputer są w tej samej sieci Wi-Fi
- Sprawdź, czy Docker container działa: `docker ps`

### "Cannot connect to localhost"

- Użyj IP zamiast localhost
- Sprawdź, czy `PUBLIC_URL` jest ustawione w `.env`
- Restart Docker po zmianie `.env`

## Przykładowa konfiguracja `.env`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres-zuza:5432/urmate_ai?schema=public

# Server
PORT=3000
PUBLIC_URL=http://192.168.1.100:3000  # ← WAŻNE dla mobile

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Gmail Integration
GMAIL_REDIRECT_URI=http://192.168.1.100:3000/api/v1/integrations/gmail/callback

# Calendar Integration
CALENDAR_REDIRECT_URI=http://192.168.1.100:3000/api/v1/integrations/calendar/callback

# Encryption
ENCRYPTION_KEY=your-64-character-hex-string

# Frontend
FRONTEND_URL=exp://192.168.1.100:8081  # Expo URL

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# ElevenLabs
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=your-voice-id

# Google Places
GOOGLE_PLACES_API_KEY=your-google-places-api-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

## Produkcja

W produkcji użyj domeny:

```bash
PUBLIC_URL=https://api.your-domain.com
```

I dodaj w Google Console:

```
https://api.your-domain.com/api/v1/auth/google/callback
https://api.your-domain.com/api/v1/integrations/gmail/callback
https://api.your-domain.com/api/v1/integrations/calendar/callback
```
