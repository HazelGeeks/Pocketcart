import type { NativeTabId } from "../screens/nativeAppData";

export type BottomBarScrollState = {
  downwardDistance: number;
  hidden: boolean;
  lastOffset: number;
  upwardDistance: number;
};

export const INITIAL_BOTTOM_BAR_SCROLL_STATE: BottomBarScrollState = {
  downwardDistance: 0,
  hidden: false,
  lastOffset: 0,
  upwardDistance: 0,
};

export function shouldAutoHideBottomBar(activeTab: NativeTabId) {
  return activeTab === "home" || activeTab === "shopping" || activeTab === "alerts";
}

export function getNextBottomBarScrollState(
  current: BottomBarScrollState,
  nextOffset: number,
  enabled: boolean,
): BottomBarScrollState {
  const offset = Math.max(0, nextOffset);
  if (!enabled || offset <= 16) {
    return { ...INITIAL_BOTTOM_BAR_SCROLL_STATE, lastOffset: offset };
  }

  const delta = offset - current.lastOffset;
  if (Math.abs(delta) < 2) return { ...current, lastOffset: offset };

  if (delta > 0) {
    const downwardDistance = current.downwardDistance + delta;
    return {
      downwardDistance,
      hidden: current.hidden || (offset > 48 && downwardDistance >= 28),
      lastOffset: offset,
      upwardDistance: 0,
    };
  }

  const upwardDistance = current.upwardDistance - delta;
  return {
    downwardDistance: 0,
    hidden: current.hidden && upwardDistance < 14,
    lastOffset: offset,
    upwardDistance,
  };
}
