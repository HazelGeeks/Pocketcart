import React from "react";
import { Animated } from "react-native";
import type { NativeTabId } from "../screens/nativeAppData";
import {
  getNextBottomBarScrollState,
  INITIAL_BOTTOM_BAR_SCROLL_STATE,
  shouldAutoHideBottomBar,
} from "../utils/nativeBottomBarVisibility";

type Options = {
  activeTab: NativeTabId;
  bottomInset: number;
  screenKey: string;
};

export default function useNativeBottomBarVisibility({
  activeTab,
  bottomInset,
  screenKey,
}: Options) {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const scrollStateRef = React.useRef(INITIAL_BOTTOM_BAR_SCROLL_STATE);
  const hiddenRef = React.useRef(false);
  const [hidden, setHidden] = React.useState(false);
  const autoHideEnabled = shouldAutoHideBottomBar(activeTab);

  const updateHidden = React.useCallback(
    (nextHidden: boolean) => {
      if (hiddenRef.current === nextHidden) return;
      hiddenRef.current = nextHidden;
      setHidden(nextHidden);
      Animated.timing(translateY, {
        toValue: nextHidden ? 112 + bottomInset : 0,
        duration: nextHidden ? 170 : 210,
        useNativeDriver: true,
      }).start();
    },
    [bottomInset, translateY],
  );

  React.useEffect(() => {
    scrollStateRef.current = INITIAL_BOTTOM_BAR_SCROLL_STATE;
    updateHidden(false);
  }, [activeTab, screenKey, updateHidden]);

  const handleScroll = React.useCallback(
    (offset: number) => {
      const nextState = getNextBottomBarScrollState(
        scrollStateRef.current,
        offset,
        autoHideEnabled,
      );
      scrollStateRef.current = nextState;
      updateHidden(nextState.hidden);
    },
    [autoHideEnabled, updateHidden],
  );

  return { handleScroll, hidden, translateY };
}
