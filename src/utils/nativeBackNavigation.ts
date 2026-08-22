import type { HomeRoute, NativeTabId } from "../screens/nativeAppData";

const EDGE_GESTURE_WIDTH = 36;
const HORIZONTAL_INTENT_DISTANCE = 10;
const BACK_DISTANCE = 72;
const BACK_VELOCITY = 0.45;

type BackGesture = {
  dx: number;
  dy: number;
  vx: number;
  x0: number;
};

export function shouldHandleHomeDetailBack(activeTab: NativeTabId, route: HomeRoute) {
  return activeTab === "home" && route === "detail";
}

export function hasNativeBackDestination(
  activeTab: NativeTabId,
  homeRoute: HomeRoute,
  accountRoute: string,
) {
  return (
    shouldHandleHomeDetailBack(activeTab, homeRoute) ||
    activeTab === "alerts" ||
    (activeTab === "more" && accountRoute !== "settings")
  );
}

export function shouldStartNativeBackGesture(gesture: Pick<BackGesture, "dx" | "dy" | "x0">) {
  return (
    gesture.x0 <= EDGE_GESTURE_WIDTH &&
    gesture.dx >= HORIZONTAL_INTENT_DISTANCE &&
    Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25
  );
}

export function shouldCompleteNativeBackGesture(gesture: Pick<BackGesture, "dx" | "dy" | "vx">) {
  const movingHorizontally = Math.abs(gesture.dx) > Math.abs(gesture.dy);
  return (
    movingHorizontally &&
    gesture.dx > 0 &&
    (gesture.dx >= BACK_DISTANCE || gesture.vx >= BACK_VELOCITY)
  );
}
