export type ServiceResult<T> = {
  data: T;
  error: string | null;
};

export type AdminSchemaCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string | null;
};

export type AdminSchemaReadiness = {
  ready: boolean;
  checks: AdminSchemaCheck[];
};

export type AdminUser = {
  id: string;
  email: string;
};

export type AdminDirectoryUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_admin: boolean;
  preferences_completed: boolean;
  shopping_frequency: string | null;
  interested_categories: string[];
  favorite_stores: string[];
  watchlist_count: number;
  shopping_list_count: number;
  sale_alert_count: number;
  active_push_token_count: number;
};

export type AdminDirectoryUserRow = {
  id?: unknown;
  email?: unknown;
  full_name?: unknown;
  created_at?: unknown;
  last_sign_in_at?: unknown;
  email_confirmed_at?: unknown;
  is_admin?: unknown;
  preferences_completed?: unknown;
  shopping_frequency?: unknown;
  interested_categories?: unknown;
  favorite_stores?: unknown;
  watchlist_count?: unknown;
  shopping_list_count?: unknown;
  sale_alert_count?: unknown;
  active_push_token_count?: unknown;
};

export type AdminProduct = {
  id: string;
  korean_name: string;
  english_name: string | null;
  brand: string | null;
  gtin: string | null;
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
  store_brand: string | null;
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

export type ProductIdentityReviewStatus = "pending" | "resolved";

export type AdminProductIdentityReview = {
  id: string;
  source: string;
  row_number: number | null;
  product_id: string | null;
  reason: string;
  match_method: string | null;
  candidate_count: number;
  candidate_product_ids: string[];
  payload: Record<string, unknown>;
  status: ProductIdentityReviewStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_product_id: string | null;
  resolution_action: string | null;
};

export type ProductIdentityReviewRow = AdminProductIdentityReview;

export type ProductMergeResult = {
  source_product_ids: string[];
  target_product_id: string;
  moved_prices: number;
  merged_price_conflicts: number;
  moved_shopping_items: number;
  moved_watchlist_items: number;
  moved_sale_alerts: number;
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

export type JoinedProductName =
  | { korean_name: string; english_name?: string | null }
  | Array<{ korean_name: string; english_name?: string | null }>
  | null;

export type JoinedStoreName =
  | { name?: string | null; brand?: string | null }
  | Array<{ name?: string | null; brand?: string | null }>
  | null;

export type PriceRow = {
  id: string;
  product_id: string;
  store_id: string;
  price: number | string;
  valid_from?: string | null;
  valid_to?: string | null;
  observed_at: string;
  created_at: string;
  products?: JoinedProductName;
  stores?: JoinedStoreName;
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
