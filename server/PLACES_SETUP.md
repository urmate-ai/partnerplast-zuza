# Lokalny przewodnik - Google Places API

## Funkcjonalność

Zuza może teraz wyszukiwać miejsca w okolicy użytkownika:

- Restauracje, bary, kawiarnie
- Stacje benzynowe, sklepy, apteki
- Atrakcje turystyczne, muzea, parki
- Hotela, kina, teatry

## Przykładowe polecenia

```
"W jakim najbliższym miejscu zjem schabowego?"
"Gdzie jest najbliższa stacja benzynowa?"
"Jutro jadę do Wrocławia, poleć mi jakiś dobry bar na wieczór."
"Gdzie w okolicy jest dobra kawiarnia?"
"Poleć mi restaurację włoską w pobliżu."
```

## Architektura

### 1. Google Places Service

`server/src/ai/services/places/google-places.service.ts`

- Integracja z Google Places API (Nearby Search i Text Search)
- Obliczanie odległości (Haversine formula)
- Formatowanie wyników dla AI (nazwa, adres, ocena, odległość, status otwarcia)

### 2. OpenAI Places Response Service

`server/src/ai/services/openai/openai-places-response.service.ts`

- Używa GPT-4o z function calling
- Tool `nearbyPlaces` z parametrami: `query`, `type`, `radius`
- Dwuetapowy proces:
  1. Model decyduje, czy wywołać funkcję
  2. Wyniki z Google Places są przekazywane z powrotem do modelu
  3. Model generuje naturalną odpowiedź

### 3. Intent Classifier

`server/src/ai/services/intent/intent-classifier.service.ts`

- Nowe słowa kluczowe: `needsPlacesSearch`
- Wykrywa zapytania o miejsca: "najbliższ", "w okolicy", "gdzie zjem", "poleć", itp.

### 4. AI Service Workflow

`server/src/ai/ai.service.ts`

- Parsowanie współrzędnych GPS z lokalizacji użytkownika
- Priorytet: `needsPlacesSearch` → `needsWebSearch` → standardowa odpowiedź
- Przekazywanie `latitude` i `longitude` do Places service

## Konfiguracja

### 1. Uzyskaj Google Places API Key

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz **Places API**:
   - API & Services → Library → Places API → Enable
4. Utwórz klucz API:
   - API & Services → Credentials → Create Credentials → API Key
5. (Opcjonalnie) Ogranicz klucz:
   - Restrict key → API restrictions → Places API

### 2. Dodaj do `.env`

```env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 3. Restart Docker

```bash
docker-compose restart backend-dev
```

## Koszty

Google Places API - **Pay as you go**:

- **Text Search**: $32 za 1000 zapytań
- **Nearby Search**: $32 za 1000 zapytań
- **Free tier**: $200 kredytu miesięcznie (~6,250 zapytań/miesiąc)

Źródło: [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)

## Alternatywy darmowe

Jeśli chcesz uniknąć kosztów, rozważ:

1. **Overpass API (OpenStreetMap)** - całkowicie darmowe
   - Brak limitów dla rozsądnego użycia
   - Mniej danych niż Google (brak ocen, zdjęć)
   - Dokumentacja: https://wiki.openstreetmap.org/wiki/Overpass_API

2. **Nominatim (OpenStreetMap)** - darmowe geocoding
   - Limit: 1 zapytanie/sekundę
   - Dokumentacja: https://nominatim.org/

3. **Foursquare Places API** - darmowy tier
   - 100,000 zapytań/miesiąc za darmo
   - Dobre dane o restauracjach i barach
   - Dokumentacja: https://location.foursquare.com/

## Testowanie

```bash
# Uruchom testy jednostkowe
cd server
npm test ai.service.spec.ts
```

## Przykładowy flow

```
Użytkownik: "Gdzie w okolicy zjem schabowego?"
  ↓
1. Transkrypcja (Whisper-1)
  ↓
2. Intent Classifier → needsPlacesSearch = true
  ↓
3. Parsowanie lokalizacji: (51.5922, 18.7156)
  ↓
4. GPT-4o z function calling:
   - Wywołuje nearbyPlaces({ query: "schabowy", radius: 5000 })
  ↓
5. Google Places API:
   - Wyszukuje restauracje w promieniu 5km
   - Zwraca 5 najlepszych wyników z oceną i odległością
  ↓
6. GPT-4o generuje odpowiedź:
   "Polecam Restaurację Pod Kogutem, 1.2 km stąd, ocena 4.5/5.
    Mają świetnego schabowego! Adres: ul. Piotrkowska 123."
  ↓
7. TTS (ElevenLabs) → Użytkownik słyszy odpowiedź
```

## Monitoring

Logi w Docker:

```bash
docker-compose logs -f backend-dev | grep -i "places"
```

Przykładowe logi:

```
[GooglePlacesService] Searching places near (51.5922, 18.7156) with query: schabowy
[GooglePlacesService] Found 5 places
[OpenAIPlacesResponseService] Calling nearbyPlaces with args: {"query":"schabowy","radius":5000}
```
