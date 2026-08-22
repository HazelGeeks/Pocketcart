import React from "react";
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FoodScanPanel } from "../components/nativeApp/FoodScanPanel";
import { NativeAccountTab } from "../components/nativeApp/NativeAccountTab";
import { NativeAppOnboarding } from "../components/nativeApp/NativeAppOnboarding";
import { NativeHomeTab } from "../components/nativeApp/NativeHomeTab";
import { NativeListTabs } from "../components/nativeApp/NativeListTabs";
import { NativeMapTab } from "../components/nativeApp/NativeMapTab";
import { NativeBottomTabs, NativeContextHeader } from "../components/nativeApp/NativeShell";
import useFavoriteStores from "../hooks/useFavoriteStores";
import useLayout from "../hooks/useLayout";
import useNativeAccount from "../hooks/useNativeAccount";
import useNativeBackNavigation from "../hooks/useNativeBackNavigation";
import useNativeBottomBarVisibility from "../hooks/useNativeBottomBarVisibility";
import useNativeCatalog from "../hooks/useNativeCatalog";
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
  const navigation = useNativeBackNavigation({
    account,
    catalog,
    gestureEnabled: !onboarding.visible,
    map,
    shell,
    width: w,
  });
  const bottomBar = useNativeBottomBarVisibility({
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

  const openAlerts = React.useCallback(() => {
    catalog.setRoute("catalog");
    shell.setActiveTab("alerts");
  }, [catalog.setRoute, shell.setActiveTab]);
  const header = getNativeHeaderContent({
    accountRoute: account.accountRoute,
    activeTab: shell.activeTab,
    authMode: account.authMode,
    homeRoute: catalog.route,
  });
  const handleAppScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      bottomBar.handleScroll(contentOffset.y);

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
    [bottomBar.handleScroll, catalog.route, shell.activeTab],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination whenever catalog filters change
  React.useEffect(() => {
    homeWasNearEndRef.current = false;
  }, [
    catalog.category,
    catalog.onSaleOnly,
    catalog.query,
    catalog.sortMode,
    catalog.storeFilterName,
  ]);

  return (
    <Animated.View
      {...navigation.backPanHandlers}
      style={[st.root, { transform: [{ translateX: navigation.backTranslateX }] }]}
    >
      {shell.activeTab !== "map" ? (
        <NativeContextHeader
          title={header.title}
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
            shell.activeTab === "home" && catalog.route === "catalog" ? openAlerts : undefined
          }
          onOpenMenu={
            shell.activeTab !== "more" &&
            shell.activeTab !== "alerts" &&
            (shell.activeTab !== "home" || catalog.route === "catalog")
              ? () => navigation.selectTab("more")
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
          scrollEventThrottle={16}
        >
          {shell.activeTab === "home" ? (
            <NativeHomeTab
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
          <NativeListTabs
            activeTab={shell.activeTab}
            alerts={alerts}
            onBrowseDeals={shell.openHome}
            onOpenStore={map.openStore}
            shopping={shopping}
          />
          {shell.activeTab === "scan" ? (
            <FoodScanPanel onOpenProduct={catalog.openProduct} />
          ) : null}
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
    </Animated.View>
  );
}
