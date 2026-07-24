import React from "react";
import { View } from "react-native";
import type useNativeCatalog from "../../hooks/useNativeCatalog";
import type useNativeSaleAlerts from "../../hooks/useNativeSaleAlerts";
import type useNativeShoppingPlan from "../../hooks/useNativeShoppingPlan";
import type { NativeTabId } from "../../screens/nativeAppData";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { st } from "../../screens/nativeAppStyles";
import { SaleAlertsPanel } from "./SaleAlertsPanel";
import { ShoppingListPanel } from "./ShoppingListPanel";
import { WatchlistPanel } from "./WatchlistPanel";

type Props = {
  activeTab: NativeTabId;
  alerts: ReturnType<typeof useNativeSaleAlerts>;
  catalog: ReturnType<typeof useNativeCatalog>;
  onOpenStore: (storeId: string, storeName?: string) => void;
  shopping: ReturnType<typeof useNativeShoppingPlan>;
};

export function NativeListTabs({
  activeTab,
  alerts,
  catalog,
  onOpenStore,
  shopping,
}: Props) {
  if (activeTab === "watchlist") {
    return (
      <ShoppingListPanel
        items={shopping.items}
        loading={shopping.pricesLoading}
        message={shopping.syncMessage ?? shopping.message}
        recommendation={shopping.recommendation}
        onChangeQuantity={shopping.changeQuantity}
        onClear={shopping.clear}
        onRefresh={() => {
          void shopping.loadPrices();
        }}
        onRemove={shopping.removeProduct}
        onOpenStore={onOpenStore}
      />
    );
  }

  if (activeTab !== "alerts") return null;
  return (
    <View style={st.listPageStack}>
      <SaleAlertsPanel
        alerts={alerts.saleAlerts}
        loading={alerts.alertsLoading}
        markingRead={alerts.alertsMarkingRead}
        message={alerts.alertsMessage}
        unreadCount={alerts.unreadAlertCount}
        onCheck={() => {
          void alerts.loadWatchlist(true);
        }}
        onMarkRead={() => {
          void alerts.markAlertsRead();
        }}
      />
      <View style={st.listSectionDivider} />
      <WatchlistPanel
        hasSupabaseEnv={hasSupabaseEnv}
        items={alerts.watchlistItems}
        productById={catalog.productById}
        loading={alerts.watchLoading}
        removingId={alerts.watchRemovingId}
        message={alerts.watchMessage}
        onRemoveItem={(itemId) => {
          void alerts.removeItem(itemId);
        }}
      />
    </View>
  );
}
