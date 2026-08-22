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
import type { NativeTabId } from "../screens/nativeAppData";
import {
  hasNativeBackDestination,
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
  const canNavigateBack = hasNativeBackDestination(
    shell.activeTab,
    catalog.route,
    account.accountRoute,
  );
  const navigateBack = React.useCallback(() => {
    if (shell.activeTab === "alerts") {
      shell.openHome();
      return true;
    }
    if (shell.activeTab === "more" && account.accountRoute !== "settings") {
      account.closeSubpage();
      return true;
    }
    if (shell.activeTab === "home" && catalog.route === "detail") {
      catalog.setRoute("catalog");
      return true;
    }
    return false;
  }, [
    account.accountRoute,
    account.closeSubpage,
    catalog.route,
    catalog.setRoute,
    shell.activeTab,
    shell.openHome,
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
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Platform.OS === "ios" &&
          gestureEnabled &&
          canNavigateBack &&
          shouldStartNativeBackGesture(gesture),
        onPanResponderMove: (_event, gesture) => {
          backTranslateX.setValue(Math.max(0, Math.min(gesture.dx, width)));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (!shouldCompleteNativeBackGesture(gestureState)) {
            resetBackPosition();
            return;
          }
          Animated.timing(backTranslateX, {
            toValue: width,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            navigateBack();
            backTranslateX.setValue(0);
          });
        },
        onPanResponderTerminate: resetBackPosition,
      }).panHandlers,
    [backTranslateX, canNavigateBack, gestureEnabled, navigateBack, resetBackPosition, width],
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
