import * as Location from "expo-location";
import { Platform } from "react-native";

export type MapSearchLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export async function searchMapLocations(query: string): Promise<MapSearchLocation[]> {
  if (Platform.OS === "web") {
    throw new Error("Address lookup is available in the mobile app. You can still search store names here.");
  }
  if (Platform.OS === "android") {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Allow location access to look up addresses, or search a store name.");
    }
  }
  const text = query.trim();
  // Make Canadian postal codes unambiguous to the system geocoder.
  const postal = text.replace(/\s/g, "").toUpperCase();
  const address = /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)
    ? `${postal.slice(0, 3)} ${postal.slice(3)}, Canada`
    : text;
  const locations = await Location.geocodeAsync(address);
  const unique = locations.filter((point, index) =>
    Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180 &&
    locations.findIndex((other) => other.latitude === point.latitude && other.longitude === point.longitude) === index,
  ).slice(0, 5);
  return Promise.all(unique.map(async (point) => {
    let label = `${text} (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`;
    try {
      const [place] = await Location.reverseGeocodeAsync(point);
      if (place) {
        label = [...new Set([
          [place.streetNumber, place.street].filter(Boolean).join(" "),
          place.city, place.region, place.postalCode, place.country,
        ].filter(Boolean))].join(", ") || label;
      }
    } catch { /* Coordinates remain usable when address formatting is unavailable. */ }
    return { latitude: point.latitude, longitude: point.longitude, label };
  }));
}
