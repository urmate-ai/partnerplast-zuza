# 🚀 Setup Instructions

## 1. Skonfiguruj zmienne środowiskowe

Utwórz plik `.env` w katalogu `server/` na podstawie `.env.example`:

```bash
cd server
cp .env.example .env
```

Edytuj `.env` i ustaw:

- `DATABASE_URL` - URL do bazy PostgreSQL
- `JWT_SECRET` - Silny, losowy string (użyj: `openssl rand -base64 32`)
- `OPENAI_API_KEY` - Klucz API OpenAI (wymagany dla AI)
- `ELEVENLABS_API_KEY` - Klucz API ElevenLabs (opcjonalny, dla TTS)
- `ELEVENLABS_VOICE_ID` - ID głosu ElevenLabs (opcjonalny, dla TTS)
- Inne zmienne według potrzeb

## 2. Uruchom Docker Compose

```bash
cd server
npm run docker:up
```

To uruchomi:

- PostgreSQL 17 na porcie 5432
- Backend NestJS na porcie 3000

## 3. Uruchom migracje bazy danych

```bash
cd server
npm run prisma:migrate
```

## 4. Wygeneruj Prisma Client

```bash
cd server
npm run prisma:generate
```

## 5. Uruchom backend (jeśli nie używasz Docker)

```bash
cd server
npm run start:dev
```

## ✅ Weryfikacja

Backend powinien być dostępny pod: `http://localhost:3000`

### Test endpointów:

```bash
# Rejestracja
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Logowanie
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔧 Troubleshooting

### Błąd połączenia z bazą danych

- Upewnij się, że Docker Compose jest uruchomiony: `npm run docker:up`
- Sprawdź logi: `npm run docker:logs`
- Sprawdź czy PostgreSQL działa: `docker ps`

### Błąd migracji

- Upewnij się, że `.env` ma poprawny `DATABASE_URL`
- Sprawdź czy baza danych jest dostępna
- Spróbuj: `npx prisma migrate reset` (UWAGA: usuwa wszystkie dane!)

### Prisma Client nie wygenerowany

- Uruchom: `npm run prisma:generate`
- Sprawdź czy `node_modules/.prisma/client` istnieje
