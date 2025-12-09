// Google Places API service for client-side place search

export interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  openNow?: boolean;
  types?: string[];
  distance?: number;
  placeId: string;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  query?: string;
  type?: string;
  radius?: number;
  maxResults?: number;
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

/**
 * Oblicza odległość między dwoma punktami GPS (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Promień Ziemi w metrach
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Wyszukuje miejsca w pobliżu używając Google Places API
 */
export async function searchNearbyPlaces(
  params: NearbySearchParams,
): Promise<PlaceResult[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[Google Places] API key not configured');
    return [];
  }

  const {
    latitude,
    longitude,
    query,
    type,
    radius = 5000,
    maxResults = 5,
  } = params;

  try {
    const placesStartTime = performance.now();
    console.log(`[PERF] 📍 [Google Places] START search | lat: ${latitude} | lng: ${longitude} | query: ${query || 'none'} | timestamp: ${new Date().toISOString()}`);

    // Użyj Text Search jeśli jest query, inaczej Nearby Search
    const endpoint = query
      ? `${GOOGLE_PLACES_API_URL}/textsearch/json`
      : `${GOOGLE_PLACES_API_URL}/nearbysearch/json`;

    const queryParams = new URLSearchParams({
      key: GOOGLE_PLACES_API_KEY,
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
    });

    if (query) {
      queryParams.append('query', query);
    }

    if (type) {
      queryParams.append('type', type);
    }

    const url = `${endpoint}?${queryParams.toString()}`;

    const networkStartTime = performance.now();
    const response = await fetch(url);
    const networkDuration = performance.now() - networkStartTime;
    console.log(`[PERF] 🌐 [Google Places] Network response received | status: ${response.status} | network time: ${networkDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const placesDuration = performance.now() - placesStartTime;
      console.log(`[PERF] ❌ [Google Places] API ERROR | duration: ${placesDuration.toFixed(2)}ms | status: ${response.status} | error: ${errorText} | timestamp: ${new Date().toISOString()}`);
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{
        name: string;
        formatted_address?: string;
        vicinity?: string;
        rating?: number;
        user_ratings_total?: number;
        price_level?: number;
        opening_hours?: { open_now?: boolean };
        types?: string[];
        geometry?: {
          location: { lat: number; lng: number };
        };
        place_id: string;
      }>;
      status: string;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      const placesDuration = performance.now() - placesStartTime;
      console.log(`[PERF] ❌ [Google Places] API status error | duration: ${placesDuration.toFixed(2)}ms | status: ${data.status} | timestamp: ${new Date().toISOString()}`);
      return [];
    }

    if (!data.results || data.results.length === 0) {
      const placesDuration = performance.now() - placesStartTime;
      console.log(`[PERF] ⚠️ [Google Places] No results found | duration: ${placesDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
      return [];
    }

    // Oblicz odległości i posortuj
    const places = data.results
      .slice(0, maxResults)
      .map((place) => {
        const distance = place.geometry?.location
          ? calculateDistance(
              latitude,
              longitude,
              place.geometry.location.lat,
              place.geometry.location.lng,
            )
          : undefined;

        return {
          name: place.name,
          address: place.formatted_address || place.vicinity || 'Brak adresu',
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.open_now,
          types: place.types,
          distance,
          placeId: place.place_id,
        };
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    const placesDuration = performance.now() - placesStartTime;
    console.log(`[PERF] ✅ [Google Places] END search | duration: ${placesDuration.toFixed(2)}ms | network: ${networkDuration.toFixed(2)}ms | places found: ${places.length} | timestamp: ${new Date().toISOString()}`);

    return places;
  } catch (error) {
    console.error('[Google Places] Failed to search places:', error);
    return [];
  }
}

