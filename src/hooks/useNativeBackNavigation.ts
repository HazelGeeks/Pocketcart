import React from "react";
import {
  BackHandler,
  PanResponder,
  Platform,
  type GestureResponderHandlers,
} from "react-native";
import type useNativeAccount from "./useNativeAccount";
import type useNativeCatalog from "./useNativeCatalog";
import type useNativeShellState from "./useNativeShellState";
import type useNativeStoreMap from "./useNativeStoreMap";
import type { NativeTabId } from "../screens/nativeAppData";
import { shouldHandleHomeDetailBack } from "../utils/nativeBackNavigation";

type Options = {
  account: ReturnType<typeof useNativeAccount>;
  catalog: ReturnType<typeof useNativeCatalog>;
  map: ReturnType<typeof useNativeStoreMap>;
  shell: ReturnType<typeof useNativeShellState>;
};

export default function useNativeBackNavigation({
  account,
  catalog,
  map,
  shell,
}: Options) {
  const detailPanHandlers = React.useMemo<GestureResponderHandlers>(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () =>
          Platform.OS !== "web" &&
          catalog.route === "detail" &&
          shell.activeTab === "home",
        onPanResponderRelease: (_event, gestureState) => {
          if (
            gestureState.dx > 72 &&
            gestureState.vx > 0.25 &&
            Math.abs(gestureState.vy) < 1
          ) {
            catalog.setRoute("catalog");
          }
        },
      }).panHandlers,
    [catalog.route, catalog.setRoute, shell.activeTab],
  );

  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (shell.activeTab === "alerts") {
        shell.openHome();
        return true;
      }
      if (shell.activeTab === "more" && account.accountRoute !== "settings") {
        account.setAccountRoute("settings");
        account.setMoreMessage(null);
        return true;
      }
      if (shouldHandleHomeDetailBack(shell.activeTab, catalog.route)) {
        catalog.setRoute("catalog");
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [
    account.accountRoute,
    account.setAccountRoute,
    account.setMoreMessage,
    catalog.route,
    catalog.setRoute,
    shell.openHome,
    shell.activeTab,
  ]);

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

  return { detailPanHandlers, selectTab };
}
