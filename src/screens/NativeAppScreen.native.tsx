import React from "react";
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FoodScanPanel } from "../components/nativeApp/FoodScanPanel";
import { NativeAccountTab } from "../components/nativeApp/NativeAccountTab";
import { NativeHomeTab } from "../components/nativeApp/NativeHomeTab";
import { NativeListTabs } from "../components/nativeApp/NativeListTabs";
import { NativeMapTab } from "../components/nativeApp/NativeMapTab";
import { NativeAppOnboarding } from "../components/nativeApp/NativeAppOnboarding";
import {
  NativeBottomTabs,
  NativeContextHeader,
} from "../components/nativeApp/NativeShell";
import useFavoriteStores from "../hooks/useFavoriteStores";
import useLayout from "../hooks/useLayout";
import useNativeAccount from "../hooks/useNativeAccount";
import useNativeBackNavigation from "../hooks/useNativeBackNavigation";
import useNativeCatalog from "../hooks/useNativeCatalog";
import useNativeOnboarding from "../hooks/useNativeOnboarding";
import useNativePermissions from "../hooks/useNativePermissions";
import useNativeProductActions from "../hooks/useNativeProductActions";
import useNativeSaleAlerts from "../hooks/useNativeSaleAlerts";
import useNativeShellState from "../hooks/useNativeShellState";
import useNativeShoppingPlan from "../hooks/useNativeShoppingPlan";
import useNativeStoreMap from "../hooks/useNativeStoreMap";
import { getNativeHeaderContent } from "./nativeAppHeader";
import { st } from "./nativeAppStyles";
import { isScrollNearEnd } from "../utils/infiniteScroll";

export default function NativeAppScreen() {
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
  const favoriteStores = useFavoriteStores(
    account.profile?.id ?? null,
    shell.showToast,
  );
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
  const navigation = useNativeBackNavigation({ account, catalog, map, shell });
  const productActions = useNativeProductActions({
    account,
    alerts,
    catalog,
    shell,
    shopping,
  });

  const openAlerts = React.useCallback(() => {
    catalog.setRoute("catalog");
    shell.setActiveTab("alerts");
  }, [catalog.setRoute, shell.setActiveTab]);
  const header = getNativeHeaderContent({
    accountRoute: account.accountRoute,
    activeTab: shell.activeTab,
    authMode: account.authMode,
    category: catalog.selectedProduct?.category ?? null,
    homeRoute: catalog.route,
    isSignedIn: Boolean(account.profile),
    shoppingItemCount: shopping.items.length,
    storeCount: map.filteredStores.length,
    unreadAlertCount: alerts.unreadAlertCount,
  });
  const handleAppScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (shell.activeTab !== "home" || catalog.route !== "catalog") {
        homeWasNearEndRef.current = false;
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
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
    [catalog.route, shell.activeTab],
  );

  React.useEffect(() => {
    homeWasNearEndRef.current = false;
  }, [catalog.category, catalog.query, catalog.sortMode, catalog.storeFilterName]);

  return (
    <View style={st.root}>
      {shell.activeTab !== "map" ? (
        <NativeContextHeader
          title={header.title}
          status={header.status}
          topInset={insets.top}
          pad={pad}
          onBack={
            shell.activeTab === "alerts"
              ? shell.openHome
              : shell.activeTab === "more" && account.accountRoute !== "settings"
                ? account.closeSubpage
                : undefined
          }
          onOpenAlerts={
            shell.activeTab === "home" && catalog.route === "catalog"
              ? openAlerts
              : undefined
          }
          unreadAlertCount={alerts.unreadAlertCount}
        />
      ) : null}

      {shell.activeTab === "map" ? (
        <NativeMapTab
          bottomInset={insets.bottom}
          favoriteStores={favoriteStores}
          horizontalPad={pad}
          map={map}
          onViewStoreInHome={catalog.setStoreFilter}
          permissions={permissions}
          topInset={insets.top}
        />
      ) : (
        <ScrollView
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
          scrollEventThrottle={100}
        >
          {shell.activeTab === "home" ? (
            <NativeHomeTab
              catalog={catalog}
              detailPanHandlers={navigation.detailPanHandlers}
              favoriteStoreIds={favoriteStores.storeIds}
              onAddProductToShoppingList={productActions.addProductToShoppingList}
              onAddSelectedToWatchlist={productActions.addSelectedToWatchlist}
              onAddShoppingProductFromHome={productActions.addShoppingProductFromHome}
              onOpenStoreOnMap={map.openStore}
              shopping={shopping}
              loadMoreSignal={homeLoadMoreSignal}
            />
          ) : null}
          <NativeListTabs
            activeTab={shell.activeTab}
            alerts={alerts}
            catalog={catalog}
            onBrowseDeals={shell.openHome}
            onOpenStore={map.openStore}
            shopping={shopping}
          />
          {shell.activeTab === "scan" ? <FoodScanPanel /> : null}
          {shell.activeTab === "more" ? (
            <NativeAccountTab
              account={account}
              onboarding={onboarding}
              permissions={permissions}
              storeOptions={map.personalizationStoreOptions}
            />
          ) : null}
        </ScrollView>
      )}

      {shell.activeTab !== "more" || account.accountRoute === "settings" ? (
        <NativeBottomTabs
          activeTab={shell.activeTab}
          bottomInset={insets.bottom}
          pad={pad}
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
        onShareLocation={() => {
          void permissions.shareLocation("onboarding");
        }}
        onSetPostalLocation={() => {
          void permissions.usePostalLocation("onboarding");
        }}
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
    </View>
  );
}
