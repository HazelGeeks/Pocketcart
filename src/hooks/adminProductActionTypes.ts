import type React from "react";
import type {
  AdminPriceEntry,
  AdminProduct,
  AdminProductIdentityReview,
  AdminStore,
} from "../services/adminBackoffice";
import type {
  ProductPriceStats,
  StorePriceSetInput,
} from "../utils/adminScreenHelpers";

export type Mutation<TParams, TResult> = {
  mutateAsync: (params: TParams) => Promise<TResult>;
};

export type UseAdminProductActionsParams = {
  productName: string;
  productEnglishName: string;
  productBrand: string;
  productGtin: string;
  productUnit: string;
  productCategory: string;
  productCategoryCustom: string;
  productThumb: string;
  productStorePriceSets: StorePriceSetInput[];
  editingProductId: string | null;
  products: AdminProduct[];
  prices: AdminPriceEntry[];
  productPriceStats: Map<string, ProductPriceStats>;
  stores: AdminStore[];
  setProductName: (value: string) => void;
  setProductEnglishName: (value: string) => void;
  setProductBrand: (value: string) => void;
  setProductGtin: (value: string) => void;
  setProductUnit: (value: string) => void;
  setProductCategory: (value: string) => void;
  setProductCategoryCustom: (value: string) => void;
  setProductThumb: (value: string) => void;
  setProductStorePriceSets: React.Dispatch<React.SetStateAction<StorePriceSetInput[]>>;
  setProductModalOpen: (value: boolean) => void;
  setEditingProductId: (value: string | null) => void;
  setProductImageUploading: (value: boolean) => void;
  setSubmitting: (value: boolean) => void;
  setDeletingKey: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  resetProductFilters: () => void;
  loadAll: (keepNotice?: boolean) => Promise<void>;
  createProductMutation: Mutation<{
    name: string;
    englishName?: string;
    brand?: string;
    gtin?: string;
    category: string;
    unit?: string;
    thumbnailUrl?: string;
  }, AdminProduct | null>;
  updateProductMutation: Mutation<{
    id: string;
    name: string;
    englishName?: string;
    brand?: string;
    gtin?: string;
    category: string;
    unit?: string;
    thumbnailUrl?: string;
  }, AdminProduct | null>;
  createIdentityReviewMutation: Mutation<{
    rowNumber?: number;
    productId?: string;
    reason: string;
    matchMethod?: string;
    candidateCount?: number;
    payload: Record<string, unknown>;
  }, AdminProductIdentityReview | null>;
  deleteProductMutation: Mutation<string, unknown>;
  createPriceEntryMutation: Mutation<{
    productId: string;
    storeId: string;
    price: string;
    observedAt?: string;
    periodEnd?: string;
  }, unknown>;
  updatePriceEntryMutation: Mutation<{
    id: string;
    productId: string;
    storeId: string;
    price: string;
    observedAt?: string;
    periodEnd?: string;
  }, unknown>;
  uploadProductImageMutation: Mutation<{
    file: Blob;
    fileName?: string;
    contentType?: string;
  }, { publicUrl: string } | null>;
};
