export type MarketProduct = {
  id: string;
  name: string;
  english_name: string | null;
  category: string;
  thumbnail_url: string | null;
  unit: string | null;
  current_price: number | null;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_percent: number | null;
  price_compare_label: string;
  price_compare_current_batch: string | null;
  price_compare_previous_batch: string | null;
  best_store_id: string | null;
  best_store_name: string | null;
  best_store_area: string | null;
  best_store_price: number | null;
};

export type MarketPricePoint = {
  id: string;
  product_id: string;
  price: number;
  observed_at: string;
};

export type MarketStorePrice = {
  id: string;
  product_id: string;
  store_id: string;
  store_name: string;
  store_area: string | null;
  price: number;
  observed_at: string;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_percent: number | null;
  comparison_label: string;
  comparison_session_current: string | null;
  comparison_session_previous: string | null;
};

export type MarketStore = {
  id: string;
  brand: string | null;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  price_note: string | null;
  address: string | null;
  place_id: string | null;
  distance_km?: number | null;
};

export type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  english_name: string | null;
  category: string;
  unit: string | null;
  thumbnail_url: string | null;
};

export type PriceRow = {
  id: string;
  product_id: string;
  store_id?: string;
  price: number | string;
  observed_at: string;
  valid_from?: string | null;
  valid_to?: string | null;
  stores?: { brand?: string | null; name?: string | null; area?: string | null } | null;
};

export type StoreRow = {
  id: string;
  brand?: string | null;
  name: string;
  area: string;
  latitude: number | string;
  longitude: number | string;
  price_note: string | null;
  address?: string | null;
  place_id?: string | null;
  distance_km?: number | null;
};
