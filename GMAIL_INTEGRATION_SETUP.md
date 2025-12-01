# 🚀 Instrukcja konfiguracji integracji Gmail

## ✅ Zaimplementowane funkcjonalności

### Backend (NestJS + TypeScript)
- ✅ OAuth 2.0 flow z Google
- ✅ Szyfrowanie tokenów AES-256-CBC
- ✅ Automatyczne odświeżanie access tokenów
- ✅ CSRF protection (state parameter)
- ✅ RESTful API endpoints
- ✅ Prisma ORM z PostgreSQL
- ✅ Proper error handling
- ✅ Logging

### Frontend (React Native + Expo)
- ✅ UI komponent GmailIntegrationCard
- ✅ React Query hooks (useGmailStatus, useGmailConnect, useGmailDisconnect)
- ✅ OAuth flow z expo-web-browser
- ✅ Deep linking z expo-linking
- ✅ Loading states i error handling
- ✅ Responsive design z TailwindCSS

## 📋 Kroki konfiguracji

### 1. Google Cloud Console

#### Krok 1: Utwórz projekt
1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Kliknij "Select a project" → "New Project"
3. Nazwij projekt (np. "Urmate AI Zuza")
4. Kliknij "Create"

#### Krok 2: Włącz Gmail API
1. W menu bocznym: "APIs & Services" → "Library"
2. Wyszukaj "Gmail API"
3. Kliknij "Enable"

#### Krok 3: Skonfiguruj OAuth Consent Screen
1. "APIs & Services" → "OAuth consent screen"
2. Wybierz "External" → "Create"
3. Wypełnij wymagane pola:
   - **App name**: Urmate AI Zuza
   - **User support email**: Twój email
   - **Developer contact**: Twój email
4. Kliknij "Save and Continue"
5. **Scopes** → "Add or Remove Scopes":
   - Zaznacz:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Kliknij "Update" → "Save and Continue"
6. **Test users** → "Add Users":
   - Dodaj swój email Gmail (do testów)
   - Kliknij "Save and Continue"
7. Kliknij "Back to Dashboard"

#### Krok 4: Utwórz OAuth 2.0 Credentials
1. "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth 2.0 Client ID"
3. **Application type**: Web application
4. **Name**: Urmate AI Zuza Backend
5. **Authorized redirect URIs** → "Add URI":
   ```
   http://localhost:3000/api/v1/integrations/gmail/callback
   ```
   (W produkcji dodaj też: `https://your-domain.com/api/v1/integrations/gmail/callback`)
6. Kliknij "Create"
7. **WAŻNE**: Skopiuj:
   - Client ID
   - Client Secret

### 2. Konfiguracja Backend

#### Krok 1: Zmienne środowiskowe

Dodaj do `server/.env`:

```bash
# Google OAuth (jeśli jeszcze nie masz)
GOOGLE_CLIENT_ID=your-client-id-from-step-4
GOOGLE_CLIENT_SECRET=your-client-secret-from-step-4

# Gmail Integration
GMAIL_REDIRECT_URI=http://localhost:3000/api/v1/integrations/gmail/callback

# Encryption key (wygenerowany klucz)
ENCRYPTION_KEY=2a11ec05f5d8d12a73f08893f30f5254785b56241c033aed0bd9a4335b562280

# Frontend URL
FRONTEND_URL=http://localhost:8081
```

**Wygeneruj nowy klucz szyfrowania:**
```bash
openssl rand -hex 32
```

#### Krok 2: Instalacja zależności

```bash
cd server
npm install googleapis
```

#### Krok 3: Migracja bazy danych

```bash
# Uruchom PostgreSQL
docker compose up -d postgres-zuza

# Zastosuj migrację
npx prisma migrate deploy

# Wygeneruj Prisma Client
npx prisma generate
```

#### Krok 4: Restart backendu

```bash
# Jeśli używasz Docker
docker compose restart backend-dev-zuza

# Lub lokalnie
npm run start:dev
```

### 3. Konfiguracja Frontend

#### Krok 1: Instalacja zależności (już zainstalowane)

```bash
cd client
# expo-web-browser i expo-linking już są w package.json
npm install
```

#### Krok 2: Konfiguracja deep linking

W `client/app.json` dodaj (jeśli jeszcze nie ma):

```json
{
  "expo": {
    "scheme": "urmate-ai-zuza",
    "ios": {
      "bundleIdentifier": "com.urmate.ai.zuza"
    },
    "android": {
      "package": "com.urmate.ai.zuza"
    }
  }
}
```

### 4. Testowanie

#### Krok 1: Uruchom backend
```bash
cd server
docker compose up -d
# lub
npm run start:dev
```

#### Krok 2: Uruchom frontend
```bash
cd client
npm start
```

#### Krok 3: Testuj w aplikacji

1. Otwórz aplikację w Expo Go lub na emulatorze
2. Przejdź do ekranu "Integracje" (menu → Integracje)
3. Znajdź kartę "Gmail"
4. Kliknij "Połącz z Gmail"
5. Zaloguj się kontem Google (użyj test usera z OAuth consent screen)
6. Zaakceptuj uprawnienia
7. Zostaniesz przekierowany z powrotem do aplikacji
8. Status powinien pokazać "Połączono" z Twoim emailem

## 🔍 Weryfikacja

### Backend

Sprawdź logi backendu:
```bash
docker compose logs -f backend-dev-zuza
```

Powinny pojawić się:
```
[GmailService] Generated auth URL for user ...
[GmailService] Gmail connected successfully for user ...
```

### Frontend

W konsoli Expo powinny pojawić się:
```
[useGmailIntegration] Connecting to Gmail...
[useGmailIntegration] Gmail connected successfully
```

### Baza danych

Sprawdź czy rekord został utworzony:
```bash
cd server
npx prisma studio
```

Przejdź do tabeli `user_integrations` i sprawdź czy jest rekord z:
- `isConnected: true`
- `accessToken` (zaszyfrowany)
- `refreshToken` (zaszyfrowany)
- `metadata.email` (Twój email)

## 🐛 Troubleshooting

### Problem: "Invalid redirect URI"

**Rozwiązanie:**
1. Sprawdź czy redirect URI w Google Console dokładnie pasuje do `GMAIL_REDIRECT_URI` w `.env`
2. Upewnij się że używasz tego samego protokołu (http/https)
3. Nie może być trailing slash (`/` na końcu)

### Problem: "Access blocked: This app's request is invalid"

**Rozwiązanie:**
1. Sprawdź czy dodałeś wszystkie wymagane scopes w OAuth consent screen
2. Upewnij się że Twój email jest w "Test users"
3. Poczekaj kilka minut (Google czasem potrzebuje czasu na propagację zmian)

### Problem: "ENCRYPTION_KEY not configured"

**Rozwiązanie:**
```bash
# Wygeneruj klucz
openssl rand -hex 32

# Dodaj do server/.env
echo "ENCRYPTION_KEY=wygenerowany-klucz" >> .env

# Restart backendu
docker compose restart backend-dev-zuza
```

### Problem: "Can't reach database server"

**Rozwiązanie:**
```bash
# Sprawdź czy PostgreSQL działa
docker compose ps

# Jeśli nie działa, uruchom
docker compose up -d postgres-zuza

# Sprawdź logi
docker compose logs postgres-zuza
```

### Problem: OAuth callback nie działa w Expo Go

**Rozwiązanie:**

Expo Go ma ograniczenia z deep linking. Zbuduj development build:

```bash
cd client

# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 📚 Dokumentacja API

### Endpointy

#### `GET /api/v1/integrations/gmail/auth`
Generuje URL autoryzacji OAuth.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### `GET /api/v1/integrations/gmail/status`
Sprawdza status połączenia.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "isConnected": true,
  "email": "user@gmail.com",
  "connectedAt": "2025-12-01T12:00:00Z",
  "scopes": ["https://www.googleapis.com/auth/gmail.readonly", ...]
}
```

#### `DELETE /api/v1/integrations/gmail/disconnect`
Rozłącza konto Gmail.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Gmail disconnected successfully"
}
```

#### `GET /api/v1/integrations/gmail/messages`
Pobiera ostatnie wiadomości (do 10).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query params:**
- `maxResults` (optional): Liczba wiadomości (default: 10)

**Response:**
```json
[
  {
    "id": "msg-id",
    "threadId": "thread-id",
    "subject": "Email subject",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "date": "2025-12-01T12:00:00Z",
    "snippet": "Email preview...",
    "isUnread": true
  }
]
```

## 🔐 Bezpieczeństwo

### Szyfrowanie tokenów
- Tokeny OAuth są szyfrowane AES-256-CBC przed zapisem do bazy
- Każdy token ma unikalny IV (initialization vector)
- Klucz szyfrowania przechowywany w zmiennych środowiskowych

### CSRF Protection
- State parameter generowany losowo (32 bytes)
- Przechowywany w pamięci z TTL 10 minut
- Weryfikowany podczas callback

### Token Refresh
- Access tokeny automatycznie odświeżane gdy wygasną
- Refresh token przechowywany bezpiecznie (zaszyfrowany)
- Automatyczna aktualizacja w bazie danych

## 📝 Następne kroki

Po pomyślnej konfiguracji możesz:

1. **Testować pobieranie wiadomości:**
   ```bash
   curl -H "Authorization: Bearer <jwt-token>" \
        http://localhost:3000/api/v1/integrations/gmail/messages
   ```

2. **Rozszerzyć funkcjonalność:**
   - Wysyłanie emaili
   - Wyszukiwanie wiadomości
   - Zarządzanie etykietami
   - Załączniki

3. **Integracja z AI:**
   - Automatyczne odpowiedzi na emaile
   - Podsumowania wiadomości
   - Smart filtering

## 🎉 Gotowe!

Integracja Gmail jest teraz w pełni funkcjonalna! Użytkownicy mogą:
- ✅ Połączyć swoje konto Gmail przez OAuth
- ✅ Zobaczyć status połączenia
- ✅ Odłączyć konto
- ✅ Przeglądać ostatnie wiadomości (przez API)

Jeśli masz pytania lub problemy, sprawdź:
- Logi backendu: `docker compose logs -f backend-dev-zuza`
- Logi frontendu: Konsola Expo
- Dokumentację: `server/src/integrations/README.md`

