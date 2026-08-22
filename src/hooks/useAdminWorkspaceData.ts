import useAdminDashboardData from "./useAdminDashboardData";
import useAdminWorkspaceQueries from "./useAdminWorkspaceQueries";
import useAdminWorkspaceState from "./useAdminWorkspaceState";
import useLayout from "./useLayout";

export default function useAdminWorkspaceData() {
  const { isLg } = useLayout();
  const state = useAdminWorkspaceState();
  const backend = useAdminWorkspaceQueries(state);
  const { adminUi } = state;
  const dashboard = useAdminDashboardData({
    products: backend.products,
    stores: backend.stores,
    prices: backend.prices,
    auditLogs: backend.auditLogs,
    storeSearchQuery: state.store.storeSearchQuery,
    storeBrandFilter: state.store.storeBrandFilter,
    storeStatusFilter: state.store.storeStatusFilter,
    storeTypeFilter: state.store.storeTypeFilter,
    selectedStoreMapId: state.store.selectedStoreMapId,
    productSearchQuery: adminUi.productSearchQuery,
    productCategoryFilter: adminUi.productCategoryFilter,
    productBrandFilter: adminUi.productBrandFilter,
    productSaleDateFilter: adminUi.productSaleDateFilter,
    productOnSaleOnly: adminUi.productOnSaleOnly,
    productSort: adminUi.productSort,
    flyerSelectedRows: adminUi.flyerRows.filter((row) => row.selected).length,
  });

  const sectionMenu = [
    {
      key: "overview" as const,
      label: "Dashboard",
      badge: backend.reviews.length || undefined,
    },
    { key: "users" as const, label: "Users", badge: backend.users.length },
    { key: "products" as const, label: "Products", badge: backend.products.length },
    { key: "stores" as const, label: "Branches", badge: dashboard.displayStores.length },
    { key: "flyer" as const, label: "Flyer" },
  ];
  const panelTitle =
    adminUi.activeMenu === "overview"
      ? "Dashboard"
      : adminUi.activeMenu === "users"
        ? "Users"
        : adminUi.activeMenu === "products"
          ? "Products"
          : adminUi.activeMenu === "stores"
            ? "Retailer Branches"
            : "Flyer";

  return { isLg, state, backend, dashboard, sectionMenu, panelTitle };
}

export type AdminWorkspaceData = ReturnType<typeof useAdminWorkspaceData>;
