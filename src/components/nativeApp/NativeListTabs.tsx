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
  onSignIn: () => void;
  onOpenStore: (storeId: string, storeName?: string) => void;
  shopping: ReturnType<typeof useNativeShoppingPlan>;
};

export function NativeListTabs({ activeTab, alerts, onBrowseDeals, onOpenStore, shopping, onSignIn }: Props) {
  if (activeTab === "shopping") {
    return (
      <ShoppingListPanel
        familyName={shopping.familyName} onImportPersonal={shopping.importPersonal} personalCount={shopping.personalCount}
        userId={shopping.profileId} onSignIn={onSignIn} onStored={shopping.markStored}
        items={shopping.items}
        onAddProduct={shopping.addProduct}
        onAddCustom={shopping.addCustomItem}
        onToggleCompleted={shopping.toggleCompleted}
        onUndo={shopping.undoRemove}
        undoCount={shopping.undoCount}
        loading={shopping.pricesLoading}
        listLoading={shopping.listLoading}
        message={shopping.syncMessage ?? shopping.message}
        recommendation={shopping.recommendation}
        onBrowseDeals={onBrowseDeals}
        onChangeQuantity={shopping.changeQuantity}
        onClear={shopping.clear}
        onRefresh={() => {
          void shopping.reload();
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
        monitoredItems={alerts.monitoredItems} activeIds={alerts.activeIds} unlimited={alerts.unlimited}
        removingId={alerts.removingId} onRemoveProduct={alerts.removeMonitoredProduct}
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
