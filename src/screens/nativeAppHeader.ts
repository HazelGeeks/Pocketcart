import type { NativeAccountRoute, NativeAuthMode } from "../hooks/useNativeAccount";
import type { HomeRoute, NativeTabId } from "./nativeAppData";

type HeaderOptions = {
  accountRoute: NativeAccountRoute;
  activeTab: NativeTabId;
  authMode: NativeAuthMode;
  homeRoute: HomeRoute;
};

export function getNativeHeaderContent(options: HeaderOptions) {
  if (options.activeTab === "home") {
    return options.homeRoute === "detail" ? { title: "Product Details" } : { title: "Discover" };
  }
  if (options.activeTab === "shopping") {
    return { title: "Shopping List" };
  }
  if (options.activeTab === "map") {
    return { title: "Stores" };
  }
  if (options.activeTab === "alerts") {
    return { title: "Notifications" };
  }
  if (options.activeTab === "scan") {
    return { title: "Food Scan" };
  }
  if (options.accountRoute === "auth") {
    return options.authMode === "signIn" ? { title: "Sign In" } : { title: "Create Account" };
  }
  const accountHeaders: Partial<Record<NativeAccountRoute, { title: string }>> = {
    verify: { title: "Verify Email" },
    personalize: { title: "Shopping Profile" },
    freezer: { title: "My Freezer" },
    editProfile: { title: "Edit Profile" },
    resetPassword: { title: "New Password" },
  };
  return accountHeaders[options.accountRoute] ?? { title: "Settings" };
}
