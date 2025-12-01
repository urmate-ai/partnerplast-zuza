# Gmail Integration - Kompletna Konfiguracja

## 🎯 Przegląd

Pełna integracja Gmail dla aplikacji mobilnej React Native z backendem NestJS, używająca OAuth 2.0 i deep linków.

## 📋 Wymagania

### Backend (NestJS)
- ✅ Google Cloud Console projekt z włączonym Gmail API
- ✅ OAuth 2.0 Client ID i Secret
- ✅ Redirect URI skonfigurowany w Google Console
- ✅ Zmienne środowiskowe

### Frontend (React Native/Expo)
- ✅ Deep link scheme: `urmate-ai-zuza://`
- ✅ expo-web-browser dla OAuth flow
- ✅ React Query dla zarządzania stanem

## 🔧 Konfiguracja

### 1. Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Wybierz/utwórz projekt
3. Włącz **Gmail API**:
   - APIs & Services → Library
   - Szukaj "Gmail API"
   - Kliknij "Enable"

4. Utwórz OAuth 2.0 Credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Name: `Urmate AI - Gmail Integration`

5. Dodaj **Authorized redirect URIs**:
   ```
   https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/callback
   ```
   
   Dla developmentu lokalnego:
   ```
   http://localhost:3000/api/v1/integrations/gmail/callback
   ```

6. Skopiuj:
   - Client ID
   - Client Secret

### 2. Backend - Zmienne środowiskowe

Dodaj do `.env` (lub Render Environment Variables):

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Gmail Redirect URI (musi pasować do Google Console)
GMAIL_REDIRECT_URI=https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/callback

# Encryption key dla tokenów (32 bajty w hex)
ENCRYPTION_KEY=your-64-character-hex-string

# Opcjonalnie - dla developmentu lokalnego
# GMAIL_REDIRECT_URI=http://localhost:3000/api/v1/integrations/gmail/callback
```

#### Generowanie ENCRYPTION_KEY:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend - Konfiguracja

#### app.json (już skonfigurowane ✅)

```json
{
  "expo": {
    "scheme": "urmate-ai-zuza",
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["urmate-ai-zuza"]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "urmate-ai-zuza"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## 🚀 Jak to działa

### Flow OAuth:

```
1. Użytkownik klika "Połącz z Gmail" w aplikacji
   ↓
2. Frontend wywołuje GET /api/v1/integrations/gmail/auth
   ↓
3. Backend generuje authUrl i zwraca do frontendu
   ↓
4. Frontend otwiera WebBrowser z authUrl
   ↓
5. Użytkownik loguje się do Google i akceptuje uprawnienia
   ↓
6. Google przekierowuje na backend callback:
   https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/callback?code=...&state=...
   ↓
7. Backend:
   - Weryfikuje state
   - Wymienia code na access_token
   - Zapisuje token w bazie (zaszyfrowany)
   - Zwraca HTML z deep linkiem
   ↓
8. HTML automatycznie otwiera deep link:
   urmate-ai-zuza://integrations?gmail=success
   ↓
9. Aplikacja przechwytuje deep link
   ↓
10. Frontend:
    - Odświeża status połączenia
    - Pokazuje alert sukcesu
    - Aktualizuje UI (pokazuje "Połączono")
```

## 📁 Struktura plików

### Backend

```
server/src/integrations/
├── controllers/
│   └── gmail.controller.ts          # Endpointy API
├── services/
│   └── gmail.service.ts             # Logika OAuth i Gmail API
├── dto/
│   └── gmail.dto.ts                 # Validation DTOs
├── types/
│   └── gmail.types.ts               # TypeScript types
└── integrations.module.ts           # Module configuration
```

### Frontend

```
client/src/
├── components/integrations/
│   ├── IntegrationCard.component.tsx       # Główny komponent karty
│   ├── BaseIntegrationCard.component.tsx   # Reużywalny base component
│   └── hooks/
│       └── useGmailIntegration.ts          # Hook dla Gmail logic
├── services/
│   ├── gmail.service.ts                    # API calls
│   └── integrations.service.ts             # Ogólne integracje
└── screens/integrations/
    └── IntegrationsScreen.component.tsx    # Ekran listy integracji
```

## 🔐 Bezpieczeństwo

### Backend:
- ✅ Tokeny są szyfrowane AES-256-CBC przed zapisem do bazy
- ✅ State parameter zapobiega CSRF
- ✅ State wygasa po 10 minutach
- ✅ Refresh token automatycznie odświeża wygasłe access tokeny
- ✅ JWT authentication dla wszystkich endpointów (oprócz callback)

### Frontend:
- ✅ Używa `expo-web-browser` dla bezpiecznego OAuth flow
- ✅ Deep linki są walidowane
- ✅ Tokeny nigdy nie są przechowywane lokalnie (tylko w bazie backendu)

## 📡 API Endpoints

### GET `/api/v1/integrations/gmail/auth`
**Auth:** JWT required

Generuje URL autoryzacji OAuth.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET `/api/v1/integrations/gmail/callback`
**Auth:** None (publiczny callback)

Obsługuje callback z Google OAuth.

**Query params:**
- `code`: Authorization code z Google
- `state`: State parameter do weryfikacji

**Response:** HTML z deep linkiem

### GET `/api/v1/integrations/gmail/status`
**Auth:** JWT required

Zwraca status połączenia Gmail.

**Response:**
```json
{
  "isConnected": true,
  "email": "user@gmail.com",
  "connectedAt": "2025-12-01T16:00:00.000Z",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
  ]
}
```

### DELETE `/api/v1/integrations/gmail/disconnect`
**Auth:** JWT required

Rozłącza Gmail (usuwa tokeny i revoke w Google).

**Response:**
```json
{
  "message": "Gmail disconnected successfully"
}
```

### GET `/api/v1/integrations/gmail/messages`
**Auth:** JWT required

Pobiera ostatnie wiadomości z Gmail.

**Query params:**
- `maxResults` (optional): Liczba wiadomości (default: 10)

**Response:**
```json
[
  {
    "id": "...",
    "threadId": "...",
    "subject": "Test email",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "date": "2025-12-01T16:00:00.000Z",
    "snippet": "Email preview...",
    "isUnread": true
  }
]
```

## 🧪 Testowanie

### 1. Testowanie lokalne:

```bash
# Backend
cd server
npm run start:dev

# Frontend
cd client
npm start
```

### 2. Testowanie na Render:

1. Push zmian do GitHub
2. Render automatycznie deployuje
3. Sprawdź logi: `https://dashboard.render.com`

### 3. Testowanie OAuth flow:

1. Otwórz aplikację mobilną
2. Przejdź do Settings → Integrations
3. Kliknij "Połącz z Gmail"
4. Zaloguj się do Google
5. Zaakceptuj uprawnienia
6. Sprawdź czy aplikacja pokazuje "Połączono"

### 4. Debug:

**Backend logs:**
```bash
# Render Dashboard → Logs
# Lub lokalnie:
npm run start:dev
```

**Frontend logs:**
```bash
# Expo DevTools
# Lub w terminalu:
npx expo start
```

**Sprawdź:**
- Console logs w aplikacji (React Native Debugger)
- Network requests (Flipper lub React Native Debugger)
- Backend logs na Render

## 🐛 Troubleshooting

### "redirect_uri_mismatch"
- Sprawdź czy `GMAIL_REDIRECT_URI` w backendzie dokładnie pasuje do URI w Google Console
- Upewnij się, że używasz HTTPS na produkcji

### "Invalid state parameter"
- State wygasa po 10 minutach
- Spróbuj ponownie połączyć

### "Deep link nie działa"
- Sprawdź czy `app.json` ma poprawny `scheme`
- Upewnij się, że aplikacja jest zbudowana z aktualnymi zmianami
- Sprawdź czy deep link jest poprawnie sformatowany

### "Token expired"
- Backend automatycznie odświeża tokeny
- Jeśli refresh token jest nieważny, rozłącz i połącz ponownie

## 📚 Najlepsze praktyki

### ✅ Zaimplementowane:

1. **Separation of Concerns**
   - Logika OAuth w dedykowanym service
   - Hook dla UI logic
   - Reużywalny base component

2. **Error Handling**
   - Try-catch we wszystkich async operacjach
   - Przyjazne komunikaty błędów dla użytkownika
   - Szczegółowe logi dla debugowania

3. **Security**
   - Tokeny zaszyfrowane w bazie
   - State parameter dla CSRF protection
   - JWT authentication

4. **UX**
   - Loading states
   - Success/error alerts
   - Automatyczne odświeżanie statusu
   - Potwierdzenie przed rozłączeniem

5. **Type Safety**
   - TypeScript w całym projekcie
   - Shared types między frontend/backend
   - Validation DTOs

6. **Performance**
   - React Query dla cache'owania
   - Automatic token refresh
   - Optimistic updates

## 🔄 Kolejne kroki

### Opcjonalne rozszerzenia:

1. **Więcej funkcji Gmail:**
   - Wysyłanie emaili
   - Zarządzanie etykietami
   - Wyszukiwanie wiadomości
   - Attachments

2. **Google Calendar:**
   - Podobny flow OAuth
   - Odczyt/tworzenie wydarzeń
   - Synchronizacja z kalendarzem

3. **Monitoring:**
   - Sentry dla error tracking
   - Analytics dla usage metrics
   - Health checks

4. **Testing:**
   - Unit tests dla services
   - Integration tests dla OAuth flow
   - E2E tests dla całego flow

## 📞 Support

Jeśli masz problemy:
1. Sprawdź logi backendu i frontendu
2. Zweryfikuj konfigurację w Google Console
3. Sprawdź zmienne środowiskowe
4. Sprawdź czy deep link scheme jest poprawny

---

**Status:** ✅ Gotowe do użycia
**Ostatnia aktualizacja:** 2025-12-01

