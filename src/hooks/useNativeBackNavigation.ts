import React from "react";
import {
  Animated,
  BackHandler,
  PanResponder,
  Platform,
  type GestureResponderHandlers,
} from "react-native";
import type useNativeAccount from "./useNativeAccount";
import type useNativeCatalog from "./useNativeCatalog";
import type useNativeShellState from "./useNativeShellState";
import type useNativeStoreMap from "./useNativeStoreMap";
import type { MarketProduct } from "../services/marketData";
import type { NativeTabId } from "../screens/nativeAppData";
import {
  hasNativeBackDestination,
  shouldStartNativeForwardGesture,
  shouldCompleteNativeForwardGesture,
  shouldCompleteNativeBackGesture,
  shouldStartNativeBackGesture,
} from "../utils/nativeBackNavigation";

type Options = {
  account: ReturnType<typeof useNativeAccount>;
  catalog: ReturnType<typeof useNativeCatalog>;
  gestureEnabled: boolean;
  map: ReturnType<typeof useNativeStoreMap>;
  shell: ReturnType<typeof useNativeShellState>;
  width: number;
};

export default function useNativeBackNavigation({
  account,
  catalog,
  gestureEnabled,
  map,
  shell,
  width,
}: Options) {
  const backTranslateX = React.useRef(new Animated.Value(0)).current;
  const [forwardProduct, setForwardProduct] = React.useState<MarketProduct | null>(null);
  const gestureDirection = React.useRef<"back" | "forward">("back");
  const animating = React.useRef(false);
  const canNavigateForward = shell.activeTab === "home" && catalog.route === "catalog" && Boolean(forwardProduct);

  // A different navigation context starts a new history branch.
  React.useEffect(() => {
    setForwardProduct(null);
  }, [shell.activeTab, catalog.query, catalog.category, catalog.onSaleOnly, catalog.sortMode, catalog.storeFilterName, account.profile?.id]);

  React.useEffect(() => {
    if (catalog.route === "detail") setForwardProduct(null);
  }, [catalog.route]);

  const navigateForward = React.useCallback(() => {
    if (!canNavigateForward || !forwardProduct) return;
    catalog.openProduct(forwardProduct);
    setForwardProduct(null);
  }, [canNavigateForward, catalog.openProduct, forwardProduct]);

  const canNavigateBack = hasNativeBackDestination(
    shell.activeTab,
    catalog.route,
    account.accountRoute,
  );
  const navigateBack = React.useCallback(() => {
    if (shell.activeTab === "map" || shell.activeTab === "scan") {
      account.setAccountRoute("settings");
      shell.openMore();
      return true;
    }
    if (shell.activeTab === "alerts") {
      shell.closeAlerts();
      return true;
    }
    if (shell.activeTab === "more" && account.accountRoute !== "settings") {
      account.closeSubpage();
      return true;
    }
    if (shell.activeTab === "home" && catalog.route === "detail") {
      setForwardProduct(catalog.selectedProduct ?? null);
      catalog.setRoute("catalog");
      return true;
    }
    return false;
  }, [
    account.accountRoute,
    account.closeSubpage,
    account.setAccountRoute,
    shell.openMore,
    catalog.route,
    catalog.selectedProduct,
    catalog.setRoute,
    shell.activeTab,
    shell.closeAlerts,
  ]);

  const resetBackPosition = React.useCallback(() => {
    Animated.spring(backTranslateX, {
      toValue: 0,
      damping: 24,
      stiffness: 260,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [backTranslateX]);

  const backPanHandlers = React.useMemo<GestureResponderHandlers>(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, gesture) => {
          if (Platform.OS !== "ios" || !gestureEnabled || animating.current) return false;
          if (canNavigateBack && shouldStartNativeBackGesture(gesture)) {
            gestureDirection.current = "back";
            return true;
          }
          if (canNavigateForward && shouldStartNativeForwardGesture(gesture, width)) {
            gestureDirection.current = "forward";
            return true;
          }
          return false;
        },
        onPanResponderMove: (_event, gesture) => {
          backTranslateX.setValue(gestureDirection.current === "back"
            ? Math.max(0, Math.min(gesture.dx, width))
            : Math.min(0, Math.max(gesture.dx, -width)));
        },
        onPanResponderRelease: (_event, gesture) => {
          const forward = gestureDirection.current === "forward";
          const complete = forward ? shouldCompleteNativeForwardGesture(gesture) : shouldCompleteNativeBackGesture(gesture);
          if (!complete) { resetBackPosition(); return; }
          animating.current = true;
          Animated.timing(backTranslateX, {
            toValue: forward ? -width : width,
            duration: 150,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              if (forward) navigateForward();
              else navigateBack();
            }
            backTranslateX.setValue(0);
            animating.current = false;
          });
        },
        onPanResponderTerminate: resetBackPosition,
      }).panHandlers,
    [backTranslateX, canNavigateBack, canNavigateForward, gestureEnabled, navigateBack, navigateForward, resetBackPosition, width],
  );

  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      return navigateBack();
    });
    return () => subscription.remove();
  }, [navigateBack]);

  const selectTab = React.useCallback(
    (tabId: NativeTabId) => {
      if (tabId === "map" && map.userLocation) map.setFocusMode("user");
      if (tabId === "more") {
        account.setAccountRoute("settings");
        if (!account.pendingEmailVerification) account.setMoreMessage(null);
      }
      shell.setActiveTab(tabId);
    },
    [
      account.pendingEmailVerification,
      account.setAccountRoute,
      account.setMoreMessage,
      map.setFocusMode,
      map.userLocation,
      shell.setActiveTab,
    ],
  );

  return { backPanHandlers, backTranslateX, selectTab };
}
