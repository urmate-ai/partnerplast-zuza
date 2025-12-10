# Gmail Integration - Polecenia cURL do Diagnostyki

Ten dokument zawiera polecenia cURL do testowania integracji Gmail krok po kroku.

## Konfiguracja

Zastąp następujące wartości:

- `API_BASE_URL` - URL Twojego serwera (np. `http://localhost:3000/api/v1` lub `https://twoj-serwer.com/api/v1`)
- `JWT_TOKEN` - Token JWT uzyskany z logowania
- `AUTH_CODE` - Kod autoryzacyjny z Google OAuth callback
- `STATE` - State parameter z inicjacji autoryzacji

---

## KROK 1: Logowanie i uzyskanie JWT Token

```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "twoj@email.com",
    "password": "twoje-haslo"
  }'
```

**Odpowiedź:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Zapisz `accessToken` jako `JWT_TOKEN`**

---

## KROK 2: Inicjacja autoryzacji Gmail

```bash
# Bez expoRedirectUri
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/auth" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Z expoRedirectUri (dla aplikacji mobilnej)
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/auth?expoRedirectUri=urmate-ai-zuza://integrations?gmail=success" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Odpowiedź:**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...",
  "state": "random-state-string",
  "expoRedirectUrl": "urmate-ai-zuza://integrations?gmail=success"
}
```

**Zapisz `authUrl` i `state`**

---

## KROK 3: Otwórz authUrl w przeglądarce

1. Skopiuj `authUrl` z odpowiedzi
2. Otwórz w przeglądarce
3. Zaloguj się do Google
4. Zaakceptuj uprawnienia
5. Google przekieruje Cię do callback URL z parametrem `code`

**Przykładowy callback URL:**

```
http://localhost:3000/api/v1/integrations/gmail/callback?code=4/0AeanS...&state=random-state-string
```

**Zapisz `code` z URL**

---

## KROK 4: Symulacja callback (wymaga prawdziwego code)

```bash
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/callback?code=YOUR_AUTH_CODE&state=YOUR_STATE"
```

**Odpowiedź:**

- HTML z przekierowaniem do deep link (jeśli sukces)
- HTML z błędem (jeśli błąd)

**Uwaga:** Ten endpoint zwraca HTML, nie JSON. Sprawdź czy zawiera `gmail=success` w deep link.

---

## KROK 5: Sprawdzenie statusu połączenia

```bash
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Odpowiedź:**

```json
{
  "isConnected": true,
  "email": "user@gmail.com",
  "connectedAt": "2025-12-10T08:00:00.000Z"
}
```

---

## KROK 6: Pobieranie wiadomości Gmail

```bash
# Pobierz 10 ostatnich wiadomości
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/messages?maxResults=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Pobierz 5 ostatnich wiadomości
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/messages?maxResults=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Odpowiedź:**

```json
[
  {
    "id": "message-id",
    "threadId": "thread-id",
    "snippet": "Preview of message...",
    "subject": "Subject",
    "from": "sender@email.com",
    "to": ["recipient@email.com"],
    "date": "2025-12-10T08:00:00.000Z",
    "body": "Message body..."
  },
  ...
]
```

---

## KROK 7: Pobieranie kontekstu dla AI

```bash
curl -X GET "http://localhost:3000/api/v1/integrations/gmail/context?maxResults=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Odpowiedź:**

```json
{
  "context": "Formatted context string for AI..."
}
```

---

## KROK 8: Wysyłanie emaila

```bash
curl -X POST "http://localhost:3000/api/v1/integrations/gmail/send" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@email.com",
    "subject": "Test Email",
    "body": "To jest testowa wiadomość",
    "cc": ["cc@email.com"],
    "bcc": ["bcc@email.com"]
  }'
```

**Odpowiedź:**

```json
{
  "id": "message-id",
  "threadId": "thread-id",
  "labelIds": ["SENT"]
}
```

---

## KROK 9: Rozłączenie Gmail

```bash
curl -X DELETE "http://localhost:3000/api/v1/integrations/gmail/disconnect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Odpowiedź:**

```json
{
  "message": "Gmail disconnected successfully"
}
```

---

## Diagnostyka błędów

### Błąd 401 (Unauthorized)

- Sprawdź czy JWT token jest poprawny i nie wygasł
- Zaloguj się ponownie i uzyskaj nowy token

### Błąd 400 (Bad Request) w callback

- Sprawdź czy `code` i `state` są poprawne
- `code` może wygasnąć (ważny ~10 minut)
- `state` musi być taki sam jak z inicjacji

### Błąd 403 (Forbidden) w Gmail API

- Sprawdź czy użytkownik zaakceptował wszystkie wymagane uprawnienia
- Sprawdź czy scopes są poprawne w Google Cloud Console

### Gmail nie jest połączony (isConnected: false)

- Sprawdź czy callback został wykonany pomyślnie
- Sprawdź logi serwera pod kątem błędów podczas zapisywania tokenów
- Sprawdź czy tokeny są zapisane w bazie danych

---

## Pełny flow w jednym skrypcie

Zobacz plik `gmail-integration-test.sh` dla zautomatyzowanego skryptu bash.
