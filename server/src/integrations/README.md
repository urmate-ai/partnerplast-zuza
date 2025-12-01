# Gmail Integration

## Opis

Integracja z Gmail pozwala użytkownikom na:

- Autoryzację OAuth 2.0 z Google
- Odczyt wiadomości email
- Wysyłanie wiadomości
- Tworzenie wersji roboczych

## Konfiguracja

### 1. Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz Gmail API:
   - Przejdź do "APIs & Services" > "Library"
   - Wyszukaj "Gmail API"
   - Kliknij "Enable"

4. Skonfiguruj OAuth consent screen:
   - Przejdź do "APIs & Services" > "OAuth consent screen"
   - Wybierz "External" i kliknij "Create"
   - Wypełnij wymagane pola
   - Dodaj scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

5. Utwórz OAuth 2.0 credentials:
   - Przejdź do "APIs & Services" > "Credentials"
   - Kliknij "Create Credentials" > "OAuth 2.0 Client ID"
   - Wybierz "Web application"
   - Dodaj Authorized redirect URIs:
     - `http://localhost:3000/api/v1/integrations/gmail/callback` (dev)
     - `https://your-domain.com/api/v1/integrations/gmail/callback` (prod)
   - Zapisz Client ID i Client Secret

### 2. Zmienne środowiskowe

Dodaj do pliku `.env`:

```bash
# Google OAuth (istniejące)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gmail Integration
GMAIL_REDIRECT_URI=http://localhost:3000/api/v1/integrations/gmail/callback

# Encryption key dla tokenów OAuth (wygeneruj: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Frontend URL dla OAuth redirects
FRONTEND_URL=http://localhost:8081
```

### 3. Migracja bazy danych

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

## Architektura

### Backend

```
server/src/integrations/
├── controllers/
│   └── gmail.controller.ts      # Endpointy API dla Gmail
├── services/
│   └── gmail.service.ts         # Logika biznesowa Gmail
├── dto/
│   └── gmail.dto.ts             # Data Transfer Objects
├── types/
│   └── gmail.types.ts           # TypeScript types
└── integrations.module.ts       # NestJS module
```

### Frontend

```
client/src/
├── components/integrations/
│   └── GmailIntegrationCard.component.tsx  # UI komponent
├── services/
│   └── gmail.service.ts                    # API client
├── shared/hooks/integrations/
│   └── useGmailIntegration.hook.ts        # React hooks
└── screens/integrations/
    └── IntegrationsScreen.component.tsx    # Ekran integracji
```

## API Endpoints

### GET `/api/v1/integrations/gmail/auth`

Generuje URL autoryzacji OAuth.

**Response:**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET `/api/v1/integrations/gmail/callback`

Callback OAuth - obsługuje kod autoryzacji.

**Query params:**

- `code`: Authorization code
- `state`: State parameter

### GET `/api/v1/integrations/gmail/status`

Sprawdza status połączenia Gmail.

**Response:**

```json
{
  "isConnected": true,
  "email": "user@gmail.com",
  "connectedAt": "2025-12-01T12:00:00Z",
  "scopes": ["https://www.googleapis.com/auth/gmail.readonly", ...]
}
```

### DELETE `/api/v1/integrations/gmail/disconnect`

Rozłącza konto Gmail.

**Response:**

```json
{
  "message": "Gmail disconnected successfully"
}
```

### GET `/api/v1/integrations/gmail/messages`

Pobiera ostatnie wiadomości.

**Query params:**

- `maxResults`: Liczba wiadomości (default: 10)

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

## Bezpieczeństwo

### Szyfrowanie tokenów

Tokeny OAuth są szyfrowane przed zapisem do bazy danych przy użyciu AES-256-CBC:

```typescript
// Szyfrowanie
const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
const encrypted = cipher.update(token, 'utf8', 'hex') + cipher.final('hex');

// Deszyfrowanie
const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
const decrypted =
  decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
```

### State parameter

OAuth flow używa state parameter do ochrony przed CSRF:

- Generowany losowo (32 bytes)
- Przechowywany w pamięci z TTL 10 minut
- Weryfikowany podczas callback

### Token refresh

Access tokeny są automatycznie odświeżane gdy wygasną:

- Sprawdzanie expiry_date przed każdym requestem
- Automatyczne użycie refresh_token
- Aktualizacja w bazie danych

## Użycie w React Native

### Hook useGmailStatus

```typescript
import { useGmailStatus } from '@/shared/hooks/integrations/useGmailIntegration.hook';

function MyComponent() {
  const { data: status, isLoading } = useGmailStatus();

  return (
    <View>
      {status?.isConnected ? (
        <Text>Połączono: {status.email}</Text>
      ) : (
        <Text>Nie połączono</Text>
      )}
    </View>
  );
}
```

### Hook useGmailConnect

```typescript
import { useGmailConnect } from '@/shared/hooks/integrations/useGmailIntegration.hook';

function ConnectButton() {
  const connectMutation = useGmailConnect();

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync();
      Alert.alert('Sukces', 'Gmail połączony!');
    } catch (error) {
      Alert.alert('Błąd', error.message);
    }
  };

  return (
    <TouchableOpacity onPress={handleConnect}>
      <Text>Połącz Gmail</Text>
    </TouchableOpacity>
  );
}
```

### Hook useGmailDisconnect

```typescript
import { useGmailDisconnect } from '@/shared/hooks/integrations/useGmailIntegration.hook';

function DisconnectButton() {
  const disconnectMutation = useGmailDisconnect();

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync();
  };

  return (
    <TouchableOpacity onPress={handleDisconnect}>
      <Text>Rozłącz</Text>
    </TouchableOpacity>
  );
}
```

## Testowanie

### Lokalne testowanie OAuth

1. Uruchom backend:

```bash
cd server
npm run start:dev
```

2. Uruchom frontend:

```bash
cd client
npm start
```

3. W aplikacji:
   - Przejdź do ekranu "Integracje"
   - Kliknij "Połącz z Gmail"
   - Zaloguj się kontem Google
   - Zaakceptuj uprawnienia
   - Zostaniesz przekierowany z powrotem do aplikacji

### Testowanie w Expo Go

OAuth flow działa w Expo Go dzięki `expo-web-browser` i `expo-linking`.

### Testowanie na urządzeniu

1. Zbuduj development build:

```bash
cd client
npx expo run:ios  # lub run:android
```

2. OAuth flow będzie działał natywnie

## Troubleshooting

### "Invalid redirect URI"

- Sprawdź czy redirect URI w Google Console dokładnie pasuje do `GMAIL_REDIRECT_URI`
- Upewnij się że używasz tego samego protokołu (http/https)

### "Access token expired"

- Token powinien być automatycznie odświeżony
- Sprawdź logi backendu dla błędów refresh
- Jeśli problem persystuje, rozłącz i połącz ponownie

### "ENCRYPTION_KEY not configured"

- Wygeneruj klucz: `openssl rand -hex 32`
- Dodaj do `.env`: `ENCRYPTION_KEY=wygenerowany-klucz`

### "Can't reach database server"

- Uruchom PostgreSQL: `docker compose up -d postgres-zuza`
- Sprawdź `DATABASE_URL` w `.env`

## Integracja z AI

### Kontekst wiadomości Gmail

Gdy użytkownik ma połączone konto Gmail, AI automatycznie otrzymuje kontekst ostatnich wiadomości email:

```typescript
// Backend automatycznie dodaje kontekst Gmail do każdego zapytania AI
const gmailContext = await gmailService.getMessagesForAiContext(userId, 20);
```

Kontekst zawiera:

- Nadawcę wiadomości
- Temat
- Datę
- Podgląd treści
- Status (przeczytana/nieprzeczytana)

### Detekcja intencji wysłania emaila

AI automatycznie wykrywa, gdy użytkownik chce wysłać email:

**Przykładowe komendy:**

- "Wyślij email do jan@example.com z tematem Spotkanie"
- "Napisz email do Marii o jutrzejszym spotkaniu"
- "Wyślij wiadomość do zespołu z informacją o nowym projekcie"

Gdy AI wykryje intencję wysłania emaila:

1. Analizuje transkrypt i wyodrębnia:
   - Adres email odbiorcy
   - Temat wiadomości
   - Treść wiadomości
2. Zwraca `emailIntent` w odpowiedzi
3. Frontend automatycznie otwiera modal z formularzem
4. Użytkownik może edytować dane lub od razu wysłać

### Formularz wysyłania emaila

Po wykryciu intencji, w aplikacji pojawia się modal z formularzem:

```typescript
<EmailComposerModal
  visible={!!emailIntent?.shouldSendEmail}
  onClose={clearEmailIntent}
  onSend={handleSendEmail}
  initialData={emailIntent}
  isLoading={gmailSendMutation.isPending}
/>
```

Formularz zawiera:

- **Do:** Adres email odbiorcy (wymagane)
- **Temat:** Temat wiadomości (wymagane)
- **Treść:** Treść wiadomości (wymagane)
- **DW/UDW:** Opcjonalne pola CC/BCC

Jeśli AI nie wyodrębniło wszystkich danych, użytkownik uzupełnia je ręcznie.

## API Endpoints - Rozszerzone

### POST `/api/v1/integrations/gmail/send`

Wysyła email przez Gmail.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Temat wiadomości",
  "body": "Treść wiadomości w HTML lub plain text",
  "cc": ["cc1@example.com", "cc2@example.com"],
  "bcc": ["bcc@example.com"]
}
```

**Response:**

```json
{
  "messageId": "18d4f2e3a1b5c6d7",
  "success": true
}
```

### GET `/api/v1/integrations/gmail/context`

Pobiera kontekst wiadomości Gmail dla AI.

**Query params:**

- `maxResults`: Liczba wiadomości (default: 20)

**Response:**

```json
{
  "context": "Ostatnie wiadomości email użytkownika (10):\n\n1. [NIEPRZECZYTANA] Od: jan@example.com\n   Temat: Spotkanie\n   Data: 01.12.2025, 10:30\n   Podgląd: Cześć, czy możemy się spotkać jutro?..."
}
```

## Użycie w React Native - Rozszerzone

### Hook useGmailSend

```typescript
import { useGmailSend } from '@/shared/hooks/integrations/useGmailIntegration.hook';

function SendEmailButton() {
  const sendMutation = useGmailSend();

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync({
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Hello World!',
      });
      // Sukces - automatyczny alert
    } catch (error) {
      // Błąd - automatyczny alert
    }
  };

  return (
    <TouchableOpacity onPress={handleSend} disabled={sendMutation.isPending}>
      <Text>Wyślij Email</Text>
    </TouchableOpacity>
  );
}
```

### Komponent EmailComposerModal

```typescript
import { EmailComposerModal } from '@/components/integrations/EmailComposerModal.component';

function MyComponent() {
  const [modalVisible, setModalVisible] = useState(false);
  const sendMutation = useGmailSend();

  return (
    <EmailComposerModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      onSend={async (emailData) => {
        await sendMutation.mutateAsync(emailData);
      }}
      initialData={{
        to: 'preset@example.com',
        subject: 'Preset Subject',
        body: 'Preset body text',
      }}
      isLoading={sendMutation.isPending}
    />
  );
}
```

### Integracja z AI w HomeScreen

```typescript
// Hook useHomeScreen automatycznie obsługuje emailIntent
const {
  emailIntent,      // Wykryta intencja wysłania emaila
  clearEmailIntent, // Funkcja czyszcząca intencję
} = useHomeScreen();

// Modal automatycznie się otwiera gdy emailIntent jest ustawiony
<EmailComposerModal
  visible={!!emailIntent?.shouldSendEmail}
  onClose={clearEmailIntent}
  onSend={handleSendEmail}
  initialData={emailIntent}
/>
```

## Przepływ wysyłania emaila

1. **Użytkownik mówi:** "Wyślij email do jan@example.com z tematem Spotkanie"
2. **AI przetwarza:** Transkrybuje mowę i wykrywa intencję
3. **Backend analizuje:** `detectEmailIntent()` wyodrębnia dane
4. **Frontend reaguje:** Otwiera modal z formularzem
5. **Użytkownik weryfikuje:** Sprawdza/edytuje dane w formularzu
6. **Wysyłka:** Kliknięcie "Wyślij" → `POST /api/v1/integrations/gmail/send`
7. **Potwierdzenie:** Alert sukcesu i zamknięcie modala

## Bezpieczeństwo - Rozszerzone

### Walidacja danych emaila

Backend waliduje wszystkie pola przed wysyłką:

```typescript
// DTO z walidacją
export class GmailSendMessageDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bcc?: string[];
}
```

### Encoding wiadomości

Wiadomości są prawidłowo kodowane w base64url przed wysyłką:

```typescript
const encodedMessage = Buffer.from(message)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
```

## Roadmap

- [x] Wysyłanie emaili
- [x] Integracja z AI (kontekst wiadomości)
- [x] Detekcja intencji wysłania emaila
- [x] Formularz kompozycji emaila
- [ ] Tworzenie wersji roboczych
- [ ] Wyszukiwanie wiadomości
- [ ] Zarządzanie etykietami
- [ ] Załączniki
- [ ] Odpowiadanie na wiadomości (reply)
- [ ] Przekazywanie wiadomości (forward)
