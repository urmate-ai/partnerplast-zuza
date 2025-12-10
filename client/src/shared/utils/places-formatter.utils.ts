import type { PlaceResult } from '../../services/places/google-places.service';

export class PlacesFormatter {
  static formatForAiContext(places: PlaceResult[]): string {
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
}

