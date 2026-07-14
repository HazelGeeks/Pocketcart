import { hasSupabaseEnv, supabase } from "../supabaseClient";
import { FALLBACK_STORES } from "./fallbacks";
import {
  calculateHaversineDistanceKm,
  matchesStoreFilter,
  parseNumber,
} from "./shared";
import type { MarketStore, ServiceResult, StoreRow } from "./types";

export async function listStores(params?: {
  search?: string;
  latitude?: number;
  longitude?: number;
}): Promise<ServiceResult<MarketStore[]>> {
  if (!hasSupabaseEnv || !supabase) {
    const fallback = FALLBACK_STORES.filter((store) => matchesStoreFilter(store, params?.search));

    const withDistance: Array<MarketStore & { distance_km: number | null }> = fallback.map((store) => ({
      ...store,
      distance_km: params?.latitude && params?.longitude
        ? calculateHaversineDistanceKm(
            params.latitude,
            params.longitude,
            store.latitude,
            store.longitude,
          )
        : null,
    }));

    const sorted = withDistance.sort((left, right) => {
      const leftDistance = left.distance_km;
      const rightDistance = right.distance_km;
      if (leftDistance !== null && rightDistance !== null) {
        if (leftDistance === rightDistance) {
          return left.name.localeCompare(right.name);
        }
        return leftDistance - rightDistance;
      }

      if (leftDistance !== null) return -1;
      if (rightDistance !== null) return 1;

      return left.name.localeCompare(right.name);
    });

    return { data: sorted, error: null };
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id, brand, name, area, latitude, longitude, price_note, address, place_id")
    .order("name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  const stores = ((data ?? []) as StoreRow[])
    .map((row) => {
      const latitude = parseNumber(row.latitude);
      const longitude = parseNumber(row.longitude);
      if (latitude === null || longitude === null) return null;

      const distanceKm =
        params?.latitude && params?.longitude
          ? calculateHaversineDistanceKm(
              params.latitude,
              params.longitude,
              latitude,
              longitude,
            )
          : null;

      return {
        id: row.id,
        brand: row.brand ?? null,
        name: row.name,
        area: row.area?.trim() ?? "",
        latitude,
        longitude,
        price_note: row.price_note,
        address: row.address ?? null,
        place_id: row.place_id ?? null,
        distance_km: distanceKm,
      };
    })
    .filter((row): row is MarketStore & { distance_km: number | null } => row !== null)
    .filter((store) => matchesStoreFilter(store, params?.search));

  const sorted = stores.sort((left, right) => {
    if (left.distance_km != null && right.distance_km != null) {
      if (left.distance_km === right.distance_km) {
        return left.name.localeCompare(right.name);
      }
      return left.distance_km - right.distance_km;
    }

    if (left.distance_km != null) return -1;
    if (right.distance_km != null) return 1;

    return left.name.localeCompare(right.name);
  });

  return { data: sorted, error: null };
}
