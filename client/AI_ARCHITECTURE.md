# Architektura AI - Co działa na kliencie vs serwerze

## ✅ Co działa na KLIENCIE (lokalnie):

### 1. Przetwarzanie mowy (Voice AI)
- **Transkrypcja audio** → `openai-client.ts` → bezpośrednio do OpenAI Whisper API
- **Klasyfikacja intencji** → `voice-ai.service.ts` → bezpośrednio do OpenAI GPT-4o-mini
- **Generowanie odpowiedzi** → `voice-ai.service.ts` → bezpośrednio do OpenAI GPT-4o-mini
- **Wykrywanie intencji** (email, calendar, SMS) → `voice-ai.service.ts` → bezpośrednio do OpenAI GPT-4o

### 2. Text-to-Speech (TTS)
- **ElevenLabs TTS** → `elevenlabs-tts.service.ts` → bezpośrednio do ElevenLabs API
- **Fallback TTS** → `expo-speech` (wbudowany TTS)

### 3. Formatowanie danych dla AI
- **Gmail context formatting** → `gmail-formatter.utils.ts` → lokalnie
- **Calendar context formatting** → `calendar-formatter.utils.ts` → lokalnie

## 📡 Co jest wysyłane na SERWER (tylko dane/storage):

### 1. Storage czatów
- `GET /ai/chats` - lista czatów
- `GET /ai/chats/:id` - szczegóły czatu
- `POST /ai/chats/new` - nowy czat
- `POST /ai/chats/:id/messages` - zapis wiadomości

### 2. Integracje (surowe dane)
- `GET /integrations/gmail/messages` - surowe wiadomości Gmail (używane przez AI)
- `GET /integrations/calendar/events` - surowe wydarzenia Calendar (używane przez AI)
- `GET /integrations/gmail/status` - status połączenia Gmail
- `GET /integrations/calendar/status` - status połączenia Calendar

### 3. Operacje integracji
- `POST /integrations/gmail/send` - wysyłanie emaili
- `POST /integrations/calendar/events` - tworzenie wydarzeń
- `PUT /integrations/calendar/events/:id` - aktualizacja wydarzeń
- `DELETE /integrations/calendar/events/:id` - usuwanie wydarzeń

## ❌ Co NIE jest już używane z serwera:

- `POST /ai/voice` - **USUNIĘTY** (działa na kliencie)
- `GET /ai/tts` - **USUNIĘTY** (działa na kliencie)
- `GET /integrations/gmail/context` - **NIE UŻYWANY przez AI** (formatowanie lokalnie)
- `GET /integrations/calendar/context` - **NIE UŻYWANY przez AI** (formatowanie lokalnie)

## 🔑 Wymagane zmienne środowiskowe na kliencie:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
sk_[REDACTED]=... (opcjonalne)
[REDACTED]=... (opcjonalne)
```

## 📊 Podsumowanie:

**Cała logika AI działa lokalnie na kliencie:**
- ✅ Transkrypcja → OpenAI API (bezpośrednio)
- ✅ Klasyfikacja → OpenAI API (bezpośrednio)
- ✅ Generowanie odpowiedzi → OpenAI API (bezpośrednio)
- ✅ Wykrywanie intencji → OpenAI API (bezpośrednio)
- ✅ TTS → ElevenLabs API (bezpośrednio) lub expo-speech
- ✅ Formatowanie kontekstu → lokalnie

**Serwer jest używany tylko do:**
- 💾 Storage czatów (zapisywanie/pobieranie)
- 📧 Pobieranie surowych danych z integracji (Gmail/Calendar)
- 🔧 Operacje na integracjach (wysyłanie emaili, tworzenie wydarzeń)

