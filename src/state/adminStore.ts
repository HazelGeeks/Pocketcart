import { create } from "zustand";

export type AdminMenuKey = "overview" | "products" | "flyer";

export type ProductSortKey = "latest" | "name" | "priceLow" | "priceHigh";

export type FlyerRow = {
  id: string;
  selected: boolean;
  martName: string;
  regionBranch: string;
  saleStartDate: string;
  saleEndDate: string;
  name: string;
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
    martName: seed?.martName ?? "",
    regionBranch: seed?.regionBranch ?? "",
    saleStartDate: seed?.saleStartDate ?? "",
    saleEndDate: seed?.saleEndDate ?? "",
    name: seed?.name ?? "",
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
  productStoreFilter: string;
  productPriceMin: string;
  productPriceMax: string;
  productSort: ProductSortKey;
  flyerRows: FlyerRow[];
  flyerProcessing: boolean;
  flyerProgress: string;
  setActiveMenu: (value: AdminMenuKey) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setProductSearchQuery: (value: string) => void;
  setProductCategoryFilter: (value: string) => void;
  setProductStoreFilter: (value: string) => void;
  setProductPriceMin: (value: string) => void;
  setProductPriceMax: (value: string) => void;
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
  productStoreFilter: "all",
  productPriceMin: "",
  productPriceMax: "",
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
  setProductStoreFilter: (value) => set({ productStoreFilter: value }),
  setProductPriceMin: (value) => set({ productPriceMin: value }),
  setProductPriceMax: (value) => set({ productPriceMax: value }),
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
