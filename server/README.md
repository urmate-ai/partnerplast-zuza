# Urmate AI Zuza - Backend

Backend API dla aplikacji Urmate AI Zuza zbudowany w NestJS + PostgreSQL + Prisma.

## 🚀 Quick Start

### Z Docker (Zalecane)

1. Skopiuj `.env.example` do `.env` i uzupełnij zmienne:
```bash
cp .env.example .env
```

2. Uruchom Docker Compose:
```bash
npm run docker:up
```

To uruchomi:
- PostgreSQL 17 na porcie 5432
- Backend NestJS na porcie 3000

3. Uruchom migracje:
```bash
npm run prisma:migrate
```

### Bez Docker

1. Zainstaluj PostgreSQL 17 lokalnie

2. Skonfiguruj `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/urmate_ai?schema=public
```

3. Zainstaluj zależności:
```bash
npm install
```

4. Uruchom migracje:
```bash
npm run prisma:migrate
```

5. Uruchom serwer:
```bash
npm run start:dev
```

## 📝 API Endpoints

### Auth

- `POST /auth/register` - Rejestracja użytkownika
- `POST /auth/login` - Logowanie
- `GET /auth/me` - Pobierz profil użytkownika (wymaga JWT)
- `GET /auth/google` - Logowanie przez Google
- `GET /auth/google/callback` - Callback Google OAuth

## 🗄️ Database

Używamy Prisma jako ORM. Schemat znajduje się w `prisma/schema.prisma`.

### Przydatne komendy:

```bash
# Generuj Prisma Client
npm run prisma:generate

# Utwórz migrację
npm run prisma:migrate

# Otwórz Prisma Studio (GUI dla bazy danych)
npm run prisma:studio
```

## 🐳 Docker

```bash
# Uruchom kontenery
npm run docker:up

# Zatrzymaj kontenery
npm run docker:down

# Zobacz logi
npm run docker:logs
```

## 🔐 Environment Variables

Zobacz `.env.example` dla pełnej listy zmiennych środowiskowych.
