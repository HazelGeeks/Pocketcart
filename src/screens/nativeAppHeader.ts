import type { NativeAccountRoute, NativeAuthMode } from "../hooks/useNativeAccount";
import type { HomeRoute, NativeTabId } from "./nativeAppData";

type HeaderOptions = {
  accountRoute: NativeAccountRoute;
  activeTab: NativeTabId;
  authMode: NativeAuthMode;
  category: string | null;
  isSignedIn: boolean;
  shoppingItemCount: number;
  storeCount: number;
  unreadAlertCount: number;
  homeRoute: HomeRoute;
};

export function getNativeHeaderContent(options: HeaderOptions) {
  if (options.activeTab === "home") {
    return options.homeRoute === "detail"
      ? { title: "Product Details", status: options.category ?? "Price history" }
      : { title: "Discover", status: "" };
  }
  if (options.activeTab === "shopping") {
    const count = options.shoppingItemCount;
    return { title: "Shopping List", status: `${count} ${count === 1 ? "item" : "items"}` };
  }
  if (options.activeTab === "map") {
    const count = options.storeCount;
    return { title: "Stores", status: `${count} ${count === 1 ? "store" : "stores"}` };
  }
  if (options.activeTab === "alerts") {
    return {
      title: "Price Alerts",
      status: options.unreadAlertCount > 0 ? `${options.unreadAlertCount} new` : "Up to date",
    };
  }
  if (options.activeTab === "scan") {
    return { title: "Food Scan", status: "Camera guide" };
  }
  if (options.accountRoute === "auth") {
    return options.authMode === "signIn"
      ? { title: "Sign In", status: "Account" }
      : { title: "Create Account", status: "Account" };
  }
  const accountHeaders: Partial<Record<NativeAccountRoute, { title: string; status: string }>> = {
    verify: { title: "Verify Email", status: "Email sent" },
    personalize: { title: "Shopping Profile", status: "Optional" },
    editProfile: { title: "Edit Profile", status: "Account" },
    resetPassword: { title: "New Password", status: "Secure" },
  };
  return accountHeaders[options.accountRoute] ?? {
    title: "Settings",
    status: "",
  };
}
