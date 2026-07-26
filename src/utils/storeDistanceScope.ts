export const NEARBY_STORE_RADIUS_KM = 100;

export type StoreDistanceScope =
  | "unlocated"
  | "nearby"
  | "outside"
  | "unknown";

type StoreWithDistance = {
  distance_km?: number | null;
};

export function getStoreDistanceScope(
  stores: StoreWithDistance[],
  hasUserLocation: boolean,
): StoreDistanceScope {
  if (!hasUserLocation) return "unlocated";

  const distances = stores
    .map((store) => store.distance_km)
    .filter(
      (distance): distance is number =>
        typeof distance === "number" && Number.isFinite(distance),
    );

  if (distances.length === 0) return "unknown";
  return Math.min(...distances) <= NEARBY_STORE_RADIUS_KM
    ? "nearby"
    : "outside";
}

export function getStoreScopeTitle(
  scope: StoreDistanceScope,
  favoriteFilterActive: boolean,
): string {
  if (favoriteFilterActive) return "My stores";
  if (scope === "nearby") return "Nearby stores";
  if (scope === "outside") return "Stores in the supported area";
  return "Stores with price data";
}

export function getStoreScopeMessage(
  scope: StoreDistanceScope,
  storeCount: number,
): string {
  if (scope === "nearby") {
    return `${storeCount} nearby ${
      storeCount === 1 ? "place" : "places"
    } with current price data`;
  }
  if (scope === "outside") {
    return `No tracked stores within ${NEARBY_STORE_RADIUS_KM} km of your current location. Showing stores in the supported area.`;
  }
  if (scope === "unknown") {
    return "Distance is unavailable. Showing stores with current price data.";
  }
  return "Share your location to sort stores by distance.";
}

export function formatStoreDistance(
  distance: number | null | undefined,
): string | null {
  if (
    typeof distance !== "number" ||
    !Number.isFinite(distance) ||
    distance < 0
  ) {
    return null;
  }
  if (distance < 1) return `${Math.round(distance * 1000)} m away`;
  if (distance <= NEARBY_STORE_RADIUS_KM) {
    return `${distance.toFixed(1)} km away`;
  }
  return `${Math.round(distance)} km from your location`;
}
