# Postman - Testowanie Gmail API

## 📋 Wymagania

- Postman zainstalowany
- Backend uruchomiony (lokalnie lub na Render)
- Konto użytkownika w bazie danych

## 🔐 Krok 1: Zaloguj się i zdobądź JWT Token

### Request 1: Login

**Method:** `POST`  
**URL:** `https://urmate-ai-zuza.onrender.com/api/v1/auth/login`  
*(lub lokalnie: `http://localhost:3000/api/v1/auth/login`)*

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "twoj-email@example.com",
  "password": "twoje-haslo"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "8df3aa10-411e-4866-a679-9d0deae7a996",
    "email": "twoj-email@example.com",
    "name": "Twoje Imię"
  }
}
```

**💡 Zapisz `accessToken` - będziesz go potrzebować w kolejnych requestach!**

---

## 📧 Krok 2: Pobierz URL autoryzacji Gmail

### Request 2: Get Gmail Auth URL

**Method:** `GET`  
**URL:** `https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/auth`  
*(lub lokalnie: `http://localhost:3000/api/v1/integrations/gmail/auth`)*

**Headers:**
```
Authorization: Bearer <TWÓJ_JWT_TOKEN>
Content-Type: application/json
```

**💡 W Postman:**
1. Kliknij zakładkę **Authorization**
2. Wybierz typ: **Bearer Token**
3. Wklej token z kroku 1

**LUB ręcznie w Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/callback&response_type=code&scope=...&state=abc123..."
}
```

**💡 Skopiuj `authUrl` i otwórz w przeglądarce, aby dokończyć OAuth flow!**

---

## ✅ Krok 3: Sprawdź status połączenia Gmail

### Request 3: Get Gmail Status

**Method:** `GET`  
**URL:** `https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/status`  
*(lub lokalnie: `http://localhost:3000/api/v1/integrations/gmail/status`)*

**Headers:**
```
Authorization: Bearer <TWÓJ_JWT_TOKEN>
Content-Type: application/json
```

**Response (jeśli Gmail jest połączony):**
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

**Response (jeśli Gmail NIE jest połączony):**
```json
{
  "isConnected": false
}
```

---

## 📬 Krok 4: Pobierz wiadomości Gmail

### Request 4: Get Gmail Messages

**Method:** `GET`  
**URL:** `https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/messages?maxResults=10`  
*(lub lokalnie: `http://localhost:3000/api/v1/integrations/gmail/messages?maxResults=10`)*

**Headers:**
```
Authorization: Bearer <TWÓJ_JWT_TOKEN>
Content-Type: application/json
```

**Query Parameters (opcjonalne):**
- `maxResults` - liczba wiadomości (default: 10)

**Response:**
```json
[
  {
    "id": "18c1234567890abcdef",
    "threadId": "18c1234567890abcdef",
    "subject": "Test Email",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "date": "2025-12-01T16:00:00.000Z",
    "snippet": "Preview of email content...",
    "isUnread": true
  },
  {
    "id": "18c0987654321fedcba",
    "threadId": "18c0987654321fedcba",
    "subject": "Another Email",
    "from": "another@example.com",
    "to": ["recipient@example.com"],
    "date": "2025-12-01T15:00:00.000Z",
    "snippet": "Another preview...",
    "isUnread": false
  }
]
```

---

## 🔌 Krok 5: Rozłącz Gmail

### Request 5: Disconnect Gmail

**Method:** `DELETE`  
**URL:** `https://urmate-ai-zuza.onrender.com/api/v1/integrations/gmail/disconnect`  
*(lub lokalnie: `http://localhost:3000/api/v1/integrations/gmail/disconnect`)*

**Headers:**
```
Authorization: Bearer <TWÓJ_JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "message": "Gmail disconnected successfully"
}
```

---

## 🔄 Kompletny Flow OAuth w Postman

### Krok 1: Login
```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
→ Zapisz accessToken
```

### Krok 2: Get Auth URL
```
GET /api/v1/integrations/gmail/auth
Headers: Authorization: Bearer <token>
→ Skopiuj authUrl z response
```

### Krok 3: Otwórz authUrl w przeglądarce
1. Skopiuj `authUrl` z response
2. Otwórz w przeglądarce
3. Zaloguj się do Google
4. Zaakceptuj uprawnienia
5. Google przekieruje na callback URL

### Krok 4: Sprawdź status
```
GET /api/v1/integrations/gmail/status
Headers: Authorization: Bearer <token>
→ Powinno pokazać isConnected: true
```

### Krok 5: Pobierz wiadomości
```
GET /api/v1/integrations/gmail/messages?maxResults=10
Headers: Authorization: Bearer <token>
→ Lista wiadomości
```

---

## 📝 Postman Collection (JSON)

Możesz zaimportować tę kolekcję do Postman:

```json
{
  "info": {
    "name": "Gmail Integration API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://urmate-ai-zuza.onrender.com",
      "type": "string"
    },
    {
      "key": "jwtToken",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"twoj-email@example.com\",\n  \"password\": \"twoje-haslo\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "auth", "login"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    const jsonData = pm.response.json();",
              "    pm.collectionVariables.set('jwtToken', jsonData.accessToken);",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "2. Get Gmail Auth URL",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/integrations/gmail/auth",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "integrations", "gmail", "auth"]
        }
      }
    },
    {
      "name": "3. Get Gmail Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/integrations/gmail/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "integrations", "gmail", "status"]
        }
      }
    },
    {
      "name": "4. Get Gmail Messages",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/integrations/gmail/messages?maxResults=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "integrations", "gmail", "messages"],
          "query": [
            {
              "key": "maxResults",
              "value": "10"
            }
          ]
        }
      }
    },
    {
      "name": "5. Disconnect Gmail",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/integrations/gmail/disconnect",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "integrations", "gmail", "disconnect"]
        }
      }
    }
  ]
}
```

**Jak zaimportować:**
1. Otwórz Postman
2. Kliknij **Import**
3. Wklej powyższy JSON
4. Kliknij **Import**
5. Ustaw zmienną `baseUrl` w Collection Variables
6. Uruchom request "1. Login" - automatycznie zapisze token do `jwtToken`

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Sprawdź czy token JWT jest poprawny
- Token może wygasnąć - zaloguj się ponownie
- Sprawdź format: `Bearer <token>` (ze spacją!)

### 400 Bad Request (w /auth)
- Sprawdź czy użytkownik istnieje w bazie
- Sprawdź logi backendu

### 404 Not Found
- Sprawdź czy URL jest poprawny
- Sprawdź czy backend działa: `GET /api/v1` (powinien zwrócić info)

### redirect_uri_mismatch
- Sprawdź logi backendu - zobacz jaki redirect URI jest używany
- Dodaj dokładnie ten sam URI w Google Cloud Console
- Upewnij się, że używasz HTTPS na produkcji

---

## 💡 Tips

1. **Zapisz token jako zmienną w Postman:**
   - W zakładce "Tests" requestu Login dodaj:
   ```javascript
   pm.collectionVariables.set("jwtToken", pm.response.json().accessToken);
   ```

2. **Użyj Environment Variables:**
   - Utwórz Environment "Production" i "Local"
   - Dodaj zmienną `baseUrl`
   - Przełączaj się między nimi

3. **Automatyzacja:**
   - W request "1. Login" dodaj Test script, który automatycznie zapisze token
   - Wszystkie kolejne requesty będą używać tego tokenu

---

**Gotowe!** Teraz możesz testować Gmail API w Postmanie! 🚀

