import type { HomeRoute, NativeTabId } from "../screens/nativeAppData";

export function shouldHandleHomeDetailBack(
  activeTab: NativeTabId,
  route: HomeRoute,
) {
  return activeTab === "home" && route === "detail";
}
