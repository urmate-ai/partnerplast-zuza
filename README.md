# urmate-ai-zuza

ZUZA AI Voice Assistant

## Overview

ZUZA AI is a **voice-first AI assistant** similar to ChatGPT, designed as a **mobile-first product** with a rich backend for integrations, real‑time communication, and AI features.  
The project is structured as a **monorepo** with a mobile frontend and a NestJS backend.

---

## Architecture

- **Monorepo layout (target)**
  - `mobile/` (in this repo currently `client/`) – Expo + React Native app
  - `backend/` (in this repo `server/`) – NestJS API, integrations, AI
  - `shared/` – shared types, utilities (planned)

- **Tech pillars**
  - **Frontend**: Expo + React Native, TypeScript, Expo Router
  - **Backend**: NestJS, PostgreSQL, Prisma, Redis, AI tooling
  - **AI**: OpenAI, Whisper, LangChain.js, vector DB
  - **DevOps**: GitHub + GitHub Actions, Docker, Expo EAS

---

## Mobile Frontend

### Stack

- **Platform**: Expo + React Native (SDK 52+)
- **Language**: TypeScript 5.x
- **Navigation**: React Navigation v7
  - Stack navigation
  - Bottom tabs for main app sections
- **Routing / Structure**:
  - `app/` – Expo Router routes
  - `components/` – shared UI components
  - `stores/` – Zustand app state stores
  - `services/` – API/HTTP services, sockets, integrations
  - `hooks/` – shared React hooks
  - `types/` – TypeScript types & interfaces

### UI

- **Styling**
  - **NativeWind** (Tailwind for React Native) for utility‑first styling
- **Component libraries**
  - **Gluestack UI** or **Tamagui** for:
    - Prebuilt components (inputs, buttons, sheets, modals)
    - Design system & theming (light/dark mode, tokens)

### State Management

- **App state (local / UI / auth)**
  - **Zustand**
    - Authentication state (tokens, session)
    - User profile & settings
    - Feature flags / local UI state
- **Server state (remote data)**
  - **TanStack Query v5**
    - API caching, background refetch
    - Retry & error handling
    - Pagination & infinite queries
- **Networking**
  - **Axios** with interceptors:
    - Attach JWT access token
    - Automatic refresh token flow
    - Global error handling (401/403, network errors)
- **Real-time**
  - **socket.io-client**
    - Chat messages
    - Live updates (status, presence, notifications)

### Voice & Audio

- **Recording**
  - `expo-av` for audio recording on device
- **Speech-to-Text (STT)**
  - **Whisper API** for transcribing user audio
- **Text-to-Speech (TTS)**
  - **Google TTS** or **ElevenLabs** for generating natural speech
- **Notifications**
  - `expo-notifications` for local & push notifications
  - **Firebase Cloud Messaging (FCM)** as push transport on Android/iOS

### Storage

- **Secure storage**
  - `expo-secure-store` for:
    - Access & refresh tokens
    - Sensitive credentials and keys
- **Async storage**
  - `AsyncStorage` for:
    - Cached API responses
    - User preferences & UI settings
    - Lightweight offline data

### Dev & Tooling

- **Development**
  - **Expo Dev Client** for custom native modules and faster iteration
  - **React Native Debugger / Flipper** for:
    - Network inspection
    - Logs
    - Redux/Zustand/TanStack Query inspection (via plugins)
- **Testing**
  - **Vitest**
  - **React Testing Library** for UI and interaction tests

---

## Backend (API + Integrations + AI)

### Core Stack

- **Platform**: Node.js 20 LTS
- **Framework**: NestJS (v10+)
- **Language**: TypeScript 5.x
- **HTTP Server**: Nest on Express (default)
- **Real-time**:
  - NestJS WebSockets (`@nestjs/websockets`) + `socket.io`
    - Real-time chat
    - Presence & live updates
    - Streaming AI responses

### Data & Persistence

- **ORM**
  - **Prisma 6**
    - PostgreSQL schema & migrations
    - Typed client for DB access
- **Primary DB**
  - **PostgreSQL 16**
    - Hosted (e.g. Neon)
    - Stores users, conversations, settings, usage, tokens, etc.
- **Cache / Queue**
  - **Redis 7**
    - Cache (sessions, short‑lived data)
    - Job queues via **BullMQ**
      - AI tasks
      - Background processing
      - Webhook handling & retries

### AI & Vector Search

- **AI Providers**
  - **OpenAI SDK**
    - GPT‑4.1 / `o3-mini` (or similar) for:
      - Chat & conversation
      - Function calling (tools integration)
      - Streaming responses
  - **Whisper / Realtime API**
    - Low‑latency audio streaming & transcription
  - **LangChain.js**
    - Agent orchestration
    - Memory and tools (e.g., calendar, email, 3rd‑party APIs)
- **Vector DB**
  - **Supabase Vector** or **Pinecone** (configurable)
    - Store embeddings for:
      - User knowledge
      - Documents
      - Long‑term assistant memory

### API & Infrastructure

- **Validation**
  - `class-validator` + Nest pipes
    - Strict DTO validation
    - Input sanitization
- **Documentation**
  - `@nestjs/swagger` (OpenAPI)
    - Interactive API docs
    - Client generation compatibility

### Security

- **HTTP security**
  - `helmet`, rate limiting, and CORS
- **Auth & Tokens**
  - JWT access & refresh tokens
  - OAuth tokens (3rd‑party integrations) **encrypted in DB**:
    - e.g. `pgcrypto` or application‑level encryption
- **Monitoring & Logging**
  - **Logging**
    - `winston` + `morgan` (request logging)
  - **Error tracking**
    - **Sentry** (backend + mobile)
  - **Observability (optional)**
    - **OpenTelemetry** for traces & metrics

---

## DevOps, CI/CD & Runtime

### Repository

- **Version control**: GitHub
- **Structure**: monorepo
  - `backend/` (here: `server/`)
  - `mobile/` (here: `client/`)
  - `shared/` (future shared code)

### CI/CD

- **GitHub Actions**
  - CI pipeline that:
    - Installs dependencies for **backend** and **frontend**
    - Runs tests before merges to `main`
  - Extendable with:
    - Linting
    - Build checks
    - Type checking

### Runtime & Deployment

- **Backend**
  - **Docker**
    - Multi‑stage Dockerfile for NestJS
    - Smaller production image
  - Target deployment: container platforms (e.g. Fly.io, Render, Kubernetes, AWS ECS, etc.)
- **Mobile**
  - **Expo EAS**
    - **EAS Build** for Android and iOS binaries
    - **EAS Submit** to Google Play / App Store
    - **OTA updates** via Expo Updates

---

## Project Goal

ZUZA AI is built as a **voice-first AI assistant** with capabilities similar to **ChatGPT**, augmented with:

- Real‑time voice conversations
- Integrations with external tools and APIs
- Persistent memory and vector search
- Rich, native mobile UX

The long‑term goal is to provide an **intelligent, always‑available voice assistant** that adapts to the user, understands context, and can act across multiple services on their behalf.


