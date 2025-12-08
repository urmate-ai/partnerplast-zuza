import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly apiKey: string | undefined;
  private readonly apiUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_PLACES_API_KEY is not set – places search will not work.',
      );
    }
  }

  async searchNearby(params: NearbySearchParams): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      this.logger.warn('Google Places API key not configured');
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
      // Użyj Text Search jeśli jest query, inaczej Nearby Search
      const endpoint = query
        ? `${this.apiUrl}/textsearch/json`
        : `${this.apiUrl}/nearbysearch/json`;

      const queryParams = new URLSearchParams({
        key: this.apiKey,
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

      this.logger.debug(
        `Searching places near (${latitude}, ${longitude}) with query: ${query || 'none'}`,
      );

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `Google Places API error: ${response.status} ${response.statusText}`,
        );
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
        this.logger.error(`Google Places API status: ${data.status}`);
        return [];
      }

      if (!data.results || data.results.length === 0) {
        this.logger.debug('No places found');
        return [];
      }

      // Oblicz odległości i posortuj
      const places = data.results
        .slice(0, maxResults)
        .map((place) => {
          const distance = place.geometry?.location
            ? this.calculateDistance(
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

      this.logger.debug(`Found ${places.length} places`);
      return places;
    } catch (error) {
      this.logger.error('Failed to search places:', error);
      return [];
    }
  }

  formatPlacesForAI(places: PlaceResult[]): string {
    if (places.length === 0) {
      return 'Nie znaleziono żadnych miejsc w okolicy.';
    }

    const formatted = places
      .map((place, index) => {
        const parts = [
          `${index + 1}. ${place.name}`,
          `   Adres: ${place.address}`,
        ];

        if (place.rating) {
          parts.push(
            `   Ocena: ${place.rating}/5 (${place.userRatingsTotal || 0} opinii)`,
          );
        }

        if (place.distance !== undefined) {
          const distanceKm = (place.distance / 1000).toFixed(1);
          parts.push(`   Odległość: ${distanceKm} km`);
        }

        if (place.openNow !== undefined) {
          parts.push(`   Status: ${place.openNow ? 'Otwarte' : 'Zamknięte'}`);
        }

        if (place.priceLevel !== undefined) {
          const price = '💰'.repeat(place.priceLevel);
          parts.push(`   Cena: ${price}`);
        }

        return parts.join('\n');
      })
      .join('\n\n');

    return `Znalezione miejsca w okolicy:\n\n${formatted}`;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Promień Ziemi w metrach
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
