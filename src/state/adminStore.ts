import { create } from "zustand";

export type AdminMenuKey = "overview" | "products" | "stores" | "flyer";

export type ProductSortKey = "latest" | "oldest" | "name" | "priceLow" | "priceHigh";

type FlyerImageStatus = "none" | "candidate" | "ready" | "saving" | "saved" | "error";

export type FlyerCropCandidate = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number | null;
  sourceLabel: string;
};

export type FlyerRow = {
  id: string;
  selected: boolean;
  imageSelected: boolean;
  imageStatus: FlyerImageStatus;
  imagePreviewUrl: string;
  thumbnailUrl: string;
  cropCandidate: FlyerCropCandidate | null;
  martName: string;
  regionBranch: string;
  saleStartDate: string;
  saleEndDate: string;
  name: string;
  englishName: string;
  mainCategory: string;
  subCategory: string;
  brand: string;
  price: string;
  unit: string;
  memo: string;
};

export type FlyerEditableField = keyof Omit<FlyerRow, "id">;

export function createFlyerRow(seed?: Partial<FlyerRow>): FlyerRow {
  return {
    id: seed?.id ?? `flyer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    selected: seed?.selected ?? true,
    imageSelected: seed?.imageSelected ?? false,
    imageStatus: seed?.imageStatus ?? "none",
    imagePreviewUrl: seed?.imagePreviewUrl ?? "",
    thumbnailUrl: seed?.thumbnailUrl ?? "",
    cropCandidate: seed?.cropCandidate ?? null,
    martName: seed?.martName ?? "",
    regionBranch: seed?.regionBranch ?? "",
    saleStartDate: seed?.saleStartDate ?? "",
    saleEndDate: seed?.saleEndDate ?? "",
    name: seed?.name ?? "",
    englishName: seed?.englishName ?? "",
    mainCategory: seed?.mainCategory ?? "",
    subCategory: seed?.subCategory ?? "",
    brand: seed?.brand ?? "",
    price: seed?.price ?? "",
    unit: seed?.unit ?? "",
    memo: seed?.memo ?? "",
  };
}

type AdminStoreState = {
  activeMenu: AdminMenuKey;
  sidebarCollapsed: boolean;
  productSearchQuery: string;
  productCategoryFilter: string;
  productBrandFilter: string;
  productStoreFilter: string;
  productSaleDateFilter: string;
  productSort: ProductSortKey;
  flyerRows: FlyerRow[];
  flyerProcessing: boolean;
  flyerProgress: string;
  setActiveMenu: (value: AdminMenuKey) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setProductSearchQuery: (value: string) => void;
  setProductCategoryFilter: (value: string) => void;
  setProductBrandFilter: (value: string) => void;
  setProductStoreFilter: (value: string) => void;
  setProductSaleDateFilter: (value: string) => void;
  setProductSort: (value: ProductSortKey) => void;
  resetProductFilters: () => void;
  setFlyerRows: (rows: FlyerRow[]) => void;
  setFlyerProcessing: (value: boolean) => void;
  setFlyerProgress: (value: string) => void;
  updateFlyerRow: (id: string, field: FlyerEditableField, value: string | boolean) => void;
  addFlyerRow: () => void;
  removeSelectedFlyerRows: () => void;
  clearFlyerImport: () => void;
  resetAdminUi: () => void;
};

const productFilterDefaults = {
  productSearchQuery: "",
  productCategoryFilter: "all",
  productBrandFilter: "all",
  productStoreFilter: "all",
  productSaleDateFilter: "",
  productSort: "latest" as ProductSortKey,
};

export const useAdminStore = create<AdminStoreState>((set) => ({
  activeMenu: "overview",
  sidebarCollapsed: false,
  ...productFilterDefaults,
  flyerRows: [],
  flyerProcessing: false,
  flyerProgress: "",
  setActiveMenu: (value) => set({ activeMenu: value }),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setProductSearchQuery: (value) => set({ productSearchQuery: value }),
  setProductCategoryFilter: (value) => set({ productCategoryFilter: value }),
  setProductBrandFilter: (value) => set({ productBrandFilter: value }),
  setProductStoreFilter: (value) => set({ productStoreFilter: value }),
  setProductSaleDateFilter: (value) => set({ productSaleDateFilter: value }),
  setProductSort: (value) => set({ productSort: value }),
  resetProductFilters: () => set(productFilterDefaults),
  setFlyerRows: (rows) => set({ flyerRows: rows }),
  setFlyerProcessing: (value) => set({ flyerProcessing: value }),
  setFlyerProgress: (value) => set({ flyerProgress: value }),
  updateFlyerRow: (id, field, value) =>
    set((state) => ({
      flyerRows: state.flyerRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    })),
  addFlyerRow: () =>
    set((state) => ({
      flyerRows: [...state.flyerRows, createFlyerRow()],
    })),
  removeSelectedFlyerRows: () =>
    set((state) => ({
      flyerRows: state.flyerRows.filter((row) => !row.selected),
    })),
  clearFlyerImport: () =>
    set({
      flyerRows: [],
      flyerProgress: "",
    }),
  resetAdminUi: () =>
    set({
      activeMenu: "overview",
      sidebarCollapsed: false,
      ...productFilterDefaults,
      flyerRows: [],
      flyerProcessing: false,
      flyerProgress: "",
    }),
}));
