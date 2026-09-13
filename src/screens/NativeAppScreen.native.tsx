import useNativeAlertProduct from "../hooks/useNativeAlertProduct";
import React from "react";
import { FamilyProvider } from "../contexts/FamilyContext";
import useFamilyNavigation from "../hooks/useFamilyNavigation";
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeFreezerTab } from "../components/nativeApp/NativeFreezerTab";
import { FoodScanPanel } from "../components/nativeApp/FoodScanPanel";
import { NativeAccountTab } from "../components/nativeApp/NativeAccountTab";
import { NativeAppOnboarding } from "../components/nativeApp/NativeAppOnboarding";
import { NativeHomeTab } from "../components/nativeApp/NativeHomeTab";
import { NativeListTabs } from "../components/nativeApp/NativeListTabs";
import { NativeMapTab } from "../components/nativeApp/NativeMapTab";
import { NativeBottomTabs, NativeContextHeader } from "../components/nativeApp/NativeShell";
import useFlyerNotificationNavigation from "../hooks/useFlyerNotificationNavigation";
import useFreezerReminders from "../hooks/useFreezerReminders";
import useFavoriteStores from "../hooks/useFavoriteStores";
import useLayout from "../hooks/useLayout";
import useNativeAccount from "../hooks/useNativeAccount";
import useNativeBackNavigation from "../hooks/useNativeBackNavigation";
import useNativeBottomBarVisibility from "../hooks/useNativeBottomBarVisibility";
import useNativeCatalog from "../hooks/useNativeCatalog";
import useNativeDetailScroll from "../hooks/useNativeDetailScroll";
import useNativeOnboarding from "../hooks/useNativeOnboarding";
import useNativePermissions from "../hooks/useNativePermissions";
import useNativeProductActions from "../hooks/useNativeProductActions";
import useNativeSaleAlerts from "../hooks/useNativeSaleAlerts";
import useNativeShellState from "../hooks/useNativeShellState";
import useNativeShoppingPlan from "../hooks/useNativeShoppingPlan";
import useNativeStoreMap from "../hooks/useNativeStoreMap";
import { isScrollNearEnd } from "../utils/infiniteScroll";
import { getNativeHeaderContent } from "./nativeAppHeader";
import { st } from "./nativeAppStyles";
export default function NativeAppScreen() { return <FamilyProvider><NativeAppContent /></FamilyProvider>; }
function NativeAppContent() {
  const { pad, w } = useLayout();
  const insets = useSafeAreaInsets();
  const shell = useNativeShellState();
  const onboarding = useNativeOnboarding();
  const [homeLoadMoreSignal, setHomeLoadMoreSignal] = React.useState(0);
  const homeWasNearEndRef = React.useRef(false);
  const alerts = useNativeSaleAlerts({
    activeTab: shell.activeTab,
    alertsEnabled: onboarding.state.alertsEnabled,
    showToast: shell.showToast,
  });
  const account = useNativeAccount({
    activeTab: shell.activeTab,
    clearWatchlist: alerts.clearWatchlist,
    loadWatchlist: alerts.loadWatchlist,
    onOpenMore: shell.openMore,
    showToast: shell.showToast,
  });
  useFamilyNavigation(account, shell.openMore, onboarding.setVisible);
  const favoriteStores = useFavoriteStores(account.profile?.id ?? null, shell.showToast);
  const catalog = useNativeCatalog({
    activeTab: shell.activeTab,
    favoriteStoreIds: favoriteStores.storeIds,
    horizontalPad: pad,
    onOpenHome: shell.openHome,
    showToast: shell.showToast,
    width: w,
  });
  const hideOnboarding = React.useCallback(() => {
    onboarding.setVisible(false);
  }, [onboarding.setVisible]);
  const map = useNativeStoreMap({
    activeTab: shell.activeTab,
    favoriteStoreIds: favoriteStores.storeIds,
    onboardingState: onboarding.state,
    onHideOnboarding: hideOnboarding,
    onOpenMap: shell.openMap,
    showToast: shell.showToast,
  });
  const permissions = useNativePermissions({
    focusMapOnUser: map.focusUserLocation,
    onboarding,
    profile: account.profile,
    setHomeActionMessage: catalog.setActionMessage,
    setMapMessage: map.setMessage,
    setMapQuery: map.setQuery,
    setMoreLoading: account.setMoreLoading,
    setMoreMessage: account.setMoreMessage,
    showToast: shell.showToast,
  });
  const shopping = useNativeShoppingPlan({
    activeTab: shell.activeTab,
    favoriteStoreIds: favoriteStores.storeIds,
    profileId: account.profile?.id ?? null,
    productById: catalog.productById,
  });
  const showFlyerDeals = React.useCallback((ids: string[], name: string) => {
    catalog.setQuery("");
    catalog.setCategory("All");
    catalog.setOnSaleOnly(true);
    catalog.setRetailerFilter(ids, name);
  }, [catalog.setQuery, catalog.setCategory, catalog.setOnSaleOnly, catalog.setRetailerFilter]);
  const openFlyerStore = useFlyerNotificationNavigation(account.profile?.id ?? null, showFlyerDeals, shell.showToast);
  const openFreezerReminder = React.useCallback(() => { shell.setActiveTab("freezer"); }, [shell.setActiveTab]);
  useFreezerReminders(account.profile?.id ?? null, openFreezerReminder);
  const navigation = useNativeBackNavigation({
    account,
    catalog,
    gestureEnabled: !onboarding.visible,
    map,
    shell,
    width: w,
  });
  const scrollKey = shell.activeTab === "home" ? (catalog.route === "detail" ? `detail:${catalog.selectedProduct?.id ?? ""}` : `home:${catalog.query}:${catalog.category}:${catalog.storeFilterName}:${catalog.sortMode}:${catalog.onSaleOnly}`) : `${shell.activeTab}:${shell.activeTab === "more" ? account.accountRoute : ""}`;
  const { scrollRef: detailScrollRef, initialOffset, recordOffset } = useNativeDetailScroll(scrollKey);
  const bottomBar = useNativeBottomBarVisibility({ autoHide: false,
    activeTab: shell.activeTab,
    bottomInset: insets.bottom,
    screenKey: `${shell.activeTab}:${catalog.route}:${account.accountRoute}`,
  });
  const productActions = useNativeProductActions({
    account,
    alerts,
    catalog,
    shell,
    shopping,
  });
  const openAlertProduct = useNativeAlertProduct(shell.activeTab, catalog.openProduct, shell.showToast);
  const openAlerts = React.useCallback(() => {
    catalog.setRoute("catalog");
    shell.openAlerts();
  }, [catalog.setRoute, shell.openAlerts]);
  const header = getNativeHeaderContent({
    accountRoute: account.accountRoute,
    activeTab: shell.activeTab,
    authMode: account.authMode,
    homeRoute: catalog.route,
  });
  const handleAppScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      recordOffset(contentOffset.y); bottomBar.handleScroll(contentOffset.y);
      if (shell.activeTab !== "home" || catalog.route !== "catalog") {
        homeWasNearEndRef.current = false;
        return;
      }
      const nearEnd = isScrollNearEnd({
        contentHeight: contentSize.height,
        scrollY: contentOffset.y,
        viewportHeight: layoutMeasurement.height,
      });
      if (nearEnd && !homeWasNearEndRef.current) {
        setHomeLoadMoreSignal((signal) => signal + 1);
      }
      homeWasNearEndRef.current = nearEnd;
    },
    [recordOffset, bottomBar.handleScroll, catalog.route, shell.activeTab],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: filters reset pagination
  React.useEffect(() => {
    homeWasNearEndRef.current = false; setHomeLoadMoreSignal(0);
  }, [
    catalog.category, catalog.onSaleOnly, catalog.query, catalog.sortMode, catalog.storeFilterName,
  ]);
  return (
    <Animated.View
      {...navigation.backPanHandlers}
      style={[st.root, { transform: [{ translateX: navigation.backTranslateX }] }]}
    >
      <NativeContextHeader
        showCartHelp={shell.activeTab === "shopping"}
        showFreezerHelp={shell.activeTab === "freezer"}
        title={header.title}
        topInset={insets.top}
        pad={pad}
        onBack={
          shell.activeTab === "home" && catalog.route === "detail"
            ? () => catalog.setRoute("catalog")
            : shell.activeTab === "map"
            ? () => navigation.selectTab("more")
            : shell.activeTab === "alerts"
            ? shell.closeAlerts
            : shell.activeTab === "more" && account.accountRoute !== "settings"
              ? account.closeSubpage
              : undefined
        }
        onOpenAlerts={
          (shell.activeTab === "home" && catalog.route === "catalog") || shell.activeTab === "freezer" ? openAlerts : undefined
        }
        onOpenMenu={
          shell.activeTab !== "map" && shell.activeTab !== "more" &&
          shell.activeTab !== "alerts" &&
          (shell.activeTab !== "home" || catalog.route === "catalog")
            ? () => navigation.selectTab("more")
            : undefined
        }
        unreadAlertCount={alerts.unreadAlertCount}
      />
      {shell.activeTab === "map" ? (
        <NativeMapTab
          bottomInset={insets.bottom}
          favoriteStores={favoriteStores}
          horizontalPad={pad}
          map={map}
          onViewStoreInHome={catalog.setStoreFilter}
          permissions={permissions}
          topInset={0}
        />
      ) : (
        <ScrollView key={scrollKey} ref={detailScrollRef} contentOffset={{ x: 0, y: initialOffset }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          style={st.scroll}
          contentContainerStyle={[
            st.scrollContent,
            {
              paddingHorizontal: pad,
              paddingBottom:
                shell.activeTab === "more" && account.accountRoute !== "settings"
                  ? 24 + Math.max(insets.bottom, 10)
                  : 112 + Math.max(insets.bottom, 10),
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleAppScroll}
          scrollEventThrottle={16}
        >
          {shell.activeTab === "home" ? (
            <NativeHomeTab
              alertEnabled={Boolean(catalog.selectedProduct && alerts.monitoredItems.some(item => item.product_id === catalog.selectedProduct?.id && alerts.activeIds.includes(item.id)))}
              onManageAlerts={openAlerts}
              catalog={catalog}
              favoriteStoreIds={favoriteStores.storeIds}
              onAddProductToShoppingList={productActions.addProductToShoppingList}
              onAddSelectedToWatchlist={productActions.addSelectedToWatchlist}
              onAddShoppingProductFromHome={productActions.addShoppingProductFromHome}
              onOpenStoreOnMap={map.openStore}
              shopping={shopping}
              loadMoreSignal={homeLoadMoreSignal}
            />
          ) : null}
          <NativeListTabs onOpenProduct={openAlertProduct} onOpenFlyerStore={openFlyerStore}
            onSignIn={() => { account.openSignIn(); shell.setActiveTab("more"); }}
            activeTab={shell.activeTab}
            alerts={alerts}
            onBrowseDeals={shell.openHome}
            shopping={shopping}
          />
          {shell.activeTab === "freezer" ? <NativeFreezerTab cartItems={shopping.items} userId={account.profile?.id ?? null} onSignIn={() => { account.openSignIn(); shell.openMore(); }} /> : null}
          {shell.activeTab === "scan" ? <FoodScanPanel onOpenProduct={catalog.openProduct} /> : null}
          {shell.activeTab === "more" ? (
            <NativeAccountTab
              account={account}
              onOpenMap={() => navigation.selectTab("map")}
              onboarding={onboarding}
              permissions={permissions}
              storeOptions={map.personalizationStoreOptions}
            />
          ) : null}
        </ScrollView>
      )}
      {shell.activeTab !== "more" || account.accountRoute === "settings" ? (
        <NativeBottomTabs
          activeTab={shell.activeTab === "map" ? "more" : shell.activeTab}
          bottomInset={insets.bottom}
          hidden={bottomBar.hidden}
          pad={pad}
          translateY={bottomBar.translateY}
          unreadAlertCount={alerts.unreadAlertCount}
          onSelectTab={navigation.selectTab}
        />
      ) : null}
      <NativeAppOnboarding
        visible={onboarding.visible}
        step={onboarding.step}
        locationPostalCode={onboarding.postalCode}
        alertsEnabled={onboarding.alertsEnabled}
        requesting={permissions.requesting}
        message={onboarding.message}
        onChangePostalCode={onboarding.setPostalCode}
        onShareLocation={() => void permissions.shareLocation("onboarding")}
        onSetPostalLocation={() => void permissions.usePostalLocation("onboarding")}
        onSkipLocation={permissions.skipLocation}
        onSetAlerts={onboarding.setAlertsEnabled}
        onFinish={() => {
          void permissions.finishAlertsStep();
        }}
      />
      {shell.toastMessage ? (
        <View
          pointerEvents="none"
          style={[
            st.toastWrap,
            {
              left: pad,
              right: pad,
              bottom:
                shell.activeTab === "more" && account.accountRoute !== "settings"
                  ? 18 + Math.max(insets.bottom, 10)
                  : 94 + Math.max(insets.bottom, 10),
            },
          ]}
        >
          <Text style={st.toastText}>{shell.toastMessage}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
