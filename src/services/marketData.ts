import { hasSupabaseEnv, supabase } from "./supabaseClient";

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
};

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
};

type PriceRow = {
  id: string;
  product_id: string;
  price: number | string;
  observed_at: string;
};

type StoreRow = {
  id: string;
  name: string;
  area: string;
  latitude: number | string;
  longitude: number | string;
  price_note: string | null;
};

const FALLBACK_PRODUCTS: MarketProduct[] = [
  {
    id: "rice-10kg",
    name: "Premium Rice 10kg",
    category: "Grains",
    thumbnail_url: null,
    current_price: 36.9,
  },
  {
    id: "olive-oil-1l",
    name: "Olive Oil 1L",
    category: "Cooking",
    thumbnail_url: null,
    current_price: 12.4,
  },
  {
    id: "whole-bean-coffee-1kg",
    name: "Whole Bean Coffee 1kg",
    category: "Beverage",
    thumbnail_url: null,
    current_price: 18.6,
  },
  {
    id: "baby-formula-900g",
    name: "Baby Formula 900g",
    category: "Baby",
    thumbnail_url: null,
    current_price: 28.3,
  },
  {
    id: "dish-soap-4l",
    name: "Dish Soap 4L",
    category: "Household",
    thumbnail_url: null,
    current_price: 5.2,
  },
  {
    id: "milk-2l",
    name: "Milk 2L",
    category: "Dairy",
    thumbnail_url: null,
    current_price: 3.9,
  },
];

const FALLBACK_PRICE_HISTORY: Record<string, number[]> = {
  "rice-10kg": [39.8, 38.9, 38.1, 37.4, 37.1, 36.9, 36.9],
  "olive-oil-1l": [13.5, 13.2, 12.9, 12.7, 12.5, 12.4, 12.4],
  "whole-bean-coffee-1kg": [20.5, 20.2, 19.7, 19.1, 18.9, 18.7, 18.6],
  "baby-formula-900g": [30.2, 29.8, 29.3, 28.9, 28.6, 28.4, 28.3],
  "dish-soap-4l": [6.1, 5.9, 5.8, 5.7, 5.5, 5.4, 5.2],
  "milk-2l": [4.3, 4.2, 4.1, 4.0, 3.95, 3.92, 3.9],
};

const FALLBACK_STORES: MarketStore[] = [
  {
    id: "gangnam-mart",
    name: "Gangnam Fresh Mart",
    area: "Gangnam Station",
    price_note: "Eggs 30pk $7.40",
    latitude: 37.498095,
    longitude: 127.02761,
  },
  {
    id: "hongdae-market",
    name: "Hongdae Smart Market",
    area: "Hongik Univ. Area",
    price_note: "Chicken breast 1kg $8.90",
    latitude: 37.557192,
    longitude: 126.925381,
  },
  {
    id: "jamsil-store",
    name: "Jamsil Family Store",
    area: "Jamsil / Songpa",
    price_note: "Olive oil 1L $11.20",
    latitude: 37.513319,
    longitude: 127.100188,
  },
  {
    id: "yeouido-hub",
    name: "Yeouido Daily Hub",
    area: "Yeouido Financial District",
    price_note: "Milk 2L $3.90",
    latitude: 37.521939,
    longitude: 126.924218,
  },
];

function missingEnvResult<T>(fallback: T): ServiceResult<T> {
  return {
    data: fallback,
    error:
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  };
}

function parseNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function matchesProductFilter(
  product: MarketProduct,
  search?: string,
  category?: string,
): boolean {
  const q = search?.trim().toLowerCase() ?? "";
  const c = category?.trim().toLowerCase() ?? "";

  const passSearch =
    q.length === 0 ||
    `${product.name} ${product.category}`.toLowerCase().includes(q);

  const passCategory =
    c.length === 0 || c === "all" || product.category.toLowerCase() === c;

  return passSearch && passCategory;
}

function matchesStoreFilter(store: MarketStore, search?: string): boolean {
  const q = search?.trim().toLowerCase() ?? "";
  if (!q) return true;
  return `${store.name} ${store.area} ${store.price_note ?? ""}`
    .toLowerCase()
    .includes(q);
}

export async function listProducts(params?: {
  search?: string;
  category?: string;
}): Promise<ServiceResult<MarketProduct[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_PRODUCTS.filter((product) =>
        matchesProductFilter(product, params?.search, params?.category),
      ),
      error: null,
    };
  }

  const productsQuery = await supabase
    .from("products")
    .select("id, name, category, thumbnail_url")
    .order("name", { ascending: true });

  if (productsQuery.error) {
    return {
      data: [],
      error: productsQuery.error.message,
    };
  }

  const rows = (productsQuery.data ?? []) as ProductRow[];

  const latestPriceQuery = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .order("observed_at", { ascending: false })
    .limit(3000);

  const latestByProduct = new Map<string, number>();
  if (!latestPriceQuery.error) {
    const priceRows = (latestPriceQuery.data ?? []) as PriceRow[];
    for (const row of priceRows) {
      if (latestByProduct.has(row.product_id)) continue;
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) continue;
      latestByProduct.set(row.product_id, parsedPrice);
    }
  }

  const products: MarketProduct[] = rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      current_price: latestByProduct.get(row.id) ?? null,
    }))
    .filter((product) =>
      matchesProductFilter(product, params?.search, params?.category),
    );

  return {
    data: products,
    error: latestPriceQuery.error ? latestPriceQuery.error.message : null,
  };
}

export async function listProductCategories(): Promise<ServiceResult<string[]>> {
  const { data, error } = await listProducts();
  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return {
    data: categories,
    error,
  };
}

export async function listProductPriceHistory(
  productId: string,
): Promise<ServiceResult<MarketPricePoint[]>> {
  if (!productId.trim()) {
    return { data: [], error: "Product id is required." };
  }

  if (!hasSupabaseEnv || !supabase) {
    const values = FALLBACK_PRICE_HISTORY[productId] ?? [];
    const today = new Date();
    const points: MarketPricePoint[] = values.map((value, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (values.length - 1 - index));
      return {
        id: `${productId}-${index}`,
        product_id: productId,
        price: value,
        observed_at: day.toISOString(),
      };
    });

    return { data: points, error: null };
  }

  const { data, error } = await supabase
    .from("product_prices")
    .select("id, product_id, price, observed_at")
    .eq("product_id", productId)
    .order("observed_at", { ascending: true })
    .limit(60);

  if (error) {
    return { data: [], error: error.message };
  }

  const points = ((data ?? []) as PriceRow[])
    .map((row) => {
      const parsedPrice = parseNumber(row.price);
      if (parsedPrice === null) return null;
      return {
        id: row.id,
        product_id: row.product_id,
        price: parsedPrice,
        observed_at: row.observed_at,
      };
    })
    .filter((row): row is MarketPricePoint => row !== null);

  return {
    data: points,
    error: null,
  };
}

export async function listStores(params?: {
  search?: string;
}): Promise<ServiceResult<MarketStore[]>> {
  if (!hasSupabaseEnv || !supabase) {
    return {
      data: FALLBACK_STORES.filter((store) =>
        matchesStoreFilter(store, params?.search),
      ),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, area, latitude, longitude, price_note")
    .order("name", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  const stores = ((data ?? []) as StoreRow[])
    .map((row) => {
      const latitude = parseNumber(row.latitude);
      const longitude = parseNumber(row.longitude);
      if (latitude === null || longitude === null) return null;
      return {
        id: row.id,
        name: row.name,
        area: row.area,
        latitude,
        longitude,
        price_note: row.price_note,
      };
    })
    .filter((row): row is MarketStore => row !== null)
    .filter((store) => matchesStoreFilter(store, params?.search));

  return { data: stores, error: null };
}

export async function createProduct(params: {
  name: string;
  category: string;
  thumbnailUrl?: string;
}): Promise<ServiceResult<MarketProduct | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const payload = {
    name: params.name.trim(),
    category: params.category.trim(),
    thumbnail_url: params.thumbnailUrl?.trim() ? params.thumbnailUrl.trim() : null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id, name, category, thumbnail_url")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as ProductRow;
  return {
    data: {
      id: row.id,
      name: row.name,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      current_price: null,
    },
    error: null,
  };
}

export async function createStore(params: {
  name: string;
  area: string;
  latitude: string;
  longitude: string;
  priceNote?: string;
}): Promise<ServiceResult<MarketStore | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  const latitude = parseNumber(params.latitude);
  const longitude = parseNumber(params.longitude);

  if (latitude === null || longitude === null) {
    return {
      data: null,
      error: "Latitude and longitude must be valid numbers.",
    };
  }

  const payload = {
    name: params.name.trim(),
    area: params.area.trim(),
    latitude,
    longitude,
    price_note: params.priceNote?.trim() ? params.priceNote.trim() : null,
  };

  const { data, error } = await supabase
    .from("stores")
    .insert(payload)
    .select("id, name, area, latitude, longitude, price_note")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as StoreRow;
  return {
    data: {
      id: row.id,
      name: row.name,
      area: row.area,
      latitude: parseNumber(row.latitude) ?? latitude,
      longitude: parseNumber(row.longitude) ?? longitude,
      price_note: row.price_note,
    },
    error: null,
  };
}

export async function createProductPrice(params: {
  productId: string;
  storeId: string;
  price: string;
  observedAt: string;
}): Promise<ServiceResult<MarketPricePoint | null>> {
  if (!hasSupabaseEnv || !supabase) return missingEnvResult(null);

  if (!params.productId.trim() || !params.storeId.trim()) {
    return { data: null, error: "Product ID and Store ID are required." };
  }

  const price = parseNumber(params.price);
  if (price === null) {
    return { data: null, error: "Price must be a valid number." };
  }

  let observedAt = new Date().toISOString();
  const observedAtInput = params.observedAt?.trim();
  if (observedAtInput) {
    const parsed = new Date(observedAtInput);
    if (Number.isNaN(parsed.getTime())) {
      return { data: null, error: "Observed date must be a valid date string." };
    }
    observedAt = parsed.toISOString();
  }

  const payload = {
    product_id: params.productId.trim(),
    store_id: params.storeId.trim(),
    price,
    observed_at: observedAt,
  };

  const { data, error } = await supabase
    .from("product_prices")
    .insert(payload)
    .select("id, product_id, price, observed_at")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const row = data as PriceRow;
  return {
    data: {
      id: row.id,
      product_id: row.product_id,
      price: parseNumber(row.price) ?? price,
      observed_at: row.observed_at,
    },
    error: null,
  };
}
