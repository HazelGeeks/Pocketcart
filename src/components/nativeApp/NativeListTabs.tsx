import { View } from "react-native";
import type useNativeSaleAlerts from "../../hooks/useNativeSaleAlerts";
import type useNativeShoppingPlan from "../../hooks/useNativeShoppingPlan";
import type { NativeTabId } from "../../screens/nativeAppData";
import { SaleAlertsPanel } from "./SaleAlertsPanel";
import { ShoppingListPanel } from "./ShoppingListPanel";

type Props = {
  activeTab: NativeTabId;
  alerts: ReturnType<typeof useNativeSaleAlerts>;
  onBrowseDeals: () => void;
  onOpenStore: (storeId: string, storeName?: string) => void;
  shopping: ReturnType<typeof useNativeShoppingPlan>;
};

export function NativeListTabs({ activeTab, alerts, onBrowseDeals, onOpenStore, shopping }: Props) {
  if (activeTab === "shopping") {
    return (
      <ShoppingListPanel
        items={shopping.items}
        loading={shopping.pricesLoading}
        message={shopping.syncMessage ?? shopping.message}
        recommendation={shopping.recommendation}
        onBrowseDeals={onBrowseDeals}
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
    <View>
      <SaleAlertsPanel
        alerts={alerts.saleAlerts}
        loading={alerts.alertsLoading}
        markingRead={alerts.alertsMarkingRead}
        message={alerts.alertsMessage}
        unreadCount={alerts.unreadAlertCount}
        onMarkRead={() => {
          void alerts.markAlertsRead();
        }}
      />
    </View>
  );
}
