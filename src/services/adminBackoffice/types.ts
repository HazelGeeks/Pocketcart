export type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  english_name: string | null;
  category: string;
  unit: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export type AdminStore = {
  id: string;
  brand: string | null;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  price_note: string | null;
  address: string | null;
  place_id: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  store_type: string;
  is_active: boolean;
  created_at: string;
};

export type AdminPriceEntry = {
  id: string;
  product_id: string;
  product_name: string | null;
  store_id: string;
  store_name: string | null;
  price: number;
  valid_from: string;
  valid_to: string | null;
  observed_at: string;
  created_at: string;
};

export type AdminUploadedImage = {
  bucket: string;
  path: string;
  publicUrl: string;
};

export type AdminAuditLog = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ProductRow = AdminProduct;

export type StoreRow = {
  id: string;
  brand?: string | null;
  name: string;
  area?: string | null;
  latitude: number | string;
  longitude: number | string;
  price_note: string | null;
  address?: string | null;
  place_id?: string | null;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  store_type?: string | null;
  is_active?: boolean | null;
  created_at: string;
};

export type JoinedName = { name?: string | null } | Array<{ name?: string | null }> | null;

export type PriceRow = {
  id: string;
  product_id: string;
  store_id: string;
  price: number | string;
  valid_from?: string | null;
  valid_to?: string | null;
  observed_at: string;
  created_at: string;
  products?: JoinedName;
  stores?: JoinedName;
};

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
