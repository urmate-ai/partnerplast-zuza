import * as Location from 'expo-location';

export type ApproximateLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

async function getExpoLocation(): Promise<ApproximateLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('[Location] ❌ Brak uprawnień do lokalizacji. Status:', status);
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;
    const location = {
      latitude,
      longitude,
      label: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };

    return location;
  } catch (error) {
    return null;
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

export async function getApproximateLocation(): Promise<ApproximateLocation | null> {
  const expoLocation = await getExpoLocation();
  
  if (expoLocation) {
    return expoLocation;
  }
  
  return null;
}

export function formatLocationForAi(
  location: ApproximateLocation | null,
): string | undefined {
  if (!location) {
    return undefined;
  }
  
  const formatted = `Lokalizacja użytkownika: ${location.label}`;
  return formatted;
}

