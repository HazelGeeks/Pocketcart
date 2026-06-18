export type MarketProduct = {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  current_price: number | null;
};

export type MarketPricePoint = {
  id: string;
  product_id: string;
  price: number;
  observed_at: string;
};

export type MarketStore = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  price_note: string | null;
  address: string | null;
  place_id: string | null;
};

export type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
};

export type PriceRow = {
  id: string;
  product_id: string;
  price: number | string;
  observed_at: string;
};

export type StoreRow = {
  id: string;
  name: string;
  area: string;
  latitude: number | string;
  longitude: number | string;
  price_note: string | null;
  address?: string | null;
  place_id?: string | null;
};
