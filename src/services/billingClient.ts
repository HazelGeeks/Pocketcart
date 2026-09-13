import { Platform } from "react-native";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { supabase } from "./supabaseClient";

export const PLUS_ENTITLEMENT = "pocketcart_plus";
const PLAN_PERIOD = "P1M";
export const purchasesEnabled = process.env.EXPO_PUBLIC_PURCHASES_ENABLED === "true";
const publicKey = Platform.OS === "ios" ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
  : Platform.OS === "android" ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : undefined;
export const billingConfigured = Boolean(publicKey && (
  (Platform.OS === "ios" && publicKey.startsWith("appl_")) ||
  (Platform.OS === "android" && publicKey.startsWith("goog_"))
));
let desiredUser: string | null = null;
let chain: Promise<unknown> = Promise.resolve();
const sdk = async () => (await import("react-native-purchases")).default;
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work); chain = next.catch(() => {}); return next;
}
async function authenticated(userId: string) {
  if (desiredUser !== userId || !supabase) throw new Error("Sign in to manage your subscription.");
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId || desiredUser !== userId) throw new Error("Your account changed. Please try again.");
}
async function identified(userId: string) {
  if (!billingConfigured) throw new Error("Subscriptions are not available yet.");
  await authenticated(userId);
  const client = await sdk();
  if (!(await client.isConfigured())) client.configure({ apiKey: publicKey!, appUserID: userId });
  else if ((await client.getAppUserID()) !== userId) await client.logIn(userId);
  await authenticated(userId);
  return client;
}
export function setBillingUser(userId: string | null) {
  desiredUser = userId;
  return serial(async () => {
    if (!billingConfigured || desiredUser !== userId) return;
    if (userId) await identified(userId);
    else {
      const client = await sdk();
      if (await client.isConfigured() && !(await client.isAnonymous())) await client.logOut();
    }
  });
}
export function loadBilling(userId: string): Promise<{ info: CustomerInfo; packages: PurchasesPackage[] }> {
  return serial(async () => {
    const client = await identified(userId);
    await client.invalidateCustomerInfoCache();
    const info = await client.getCustomerInfo();
    // Restore/status remain usable if no offering has been published yet.
    const offerings = await client.getOfferings().catch(() => null);
    return { info, packages: offerings?.current?.availablePackages.filter(item => item.product.subscriptionPeriod === PLAN_PERIOD) ?? [] };
  });
}
export function purchaseBillingPackage(userId: string, packageId: string) {
  return serial(async () => {
    if (!purchasesEnabled) throw new Error("Subscriptions are not available for purchase yet.");
    const client = await identified(userId);
    const info = await client.getCustomerInfo();
    if (info.entitlements.active[PLUS_ENTITLEMENT]) throw new Error("You already have a subscription. Use Manage subscription.");
    const packages = (await client.getOfferings()).current?.availablePackages ?? [];
    const item = packages.find(candidate => candidate.identifier === packageId && candidate.product.subscriptionPeriod === PLAN_PERIOD);
    if (!item) throw new Error("This plan is no longer available. Refresh and try again.");
    await authenticated(userId);
    return (await client.purchasePackage(item)).customerInfo;
  });
}
export function restoreBillingPurchases(userId: string) {
  return serial(async () => (await identified(userId)).restorePurchases());
}
export function manageBillingSubscription(userId: string) {
  return serial(async () => (await identified(userId)).showManageSubscriptions());
}
export async function verifyBillingAccess(): Promise<boolean> {
  if (!supabase) throw new Error("Sign in to check your subscription.");
  const { data, error } = await supabase.functions.invoke("billing-status");
  if (error || typeof data?.isPlus !== "boolean") throw new Error("Subscription verification is unavailable. Please try again.");
  return data.isPlus;
}
export function billingError(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "userCancelled" in error && error.userCancelled) return null;
  if (typeof error === "object" && error !== null && "code" in error && String(error.code) === "20") return "Payment is awaiting store approval. Your subscription will update after approval.";
  return error instanceof Error ? error.message : "The store could not complete this request. Please try again.";
}

export async function observeBillingChanges(userId: string, onChange: () => void): Promise<() => void> {
  if (!billingConfigured) return () => {};
  const client = await sdk();
  if (!(await client.isConfigured()) || desiredUser !== userId) return () => {};
  let last = JSON.stringify((await client.getCustomerInfo()).entitlements.all);
  const listener = (info: CustomerInfo) => {
    if (desiredUser !== userId) return;
    const next = JSON.stringify(info.entitlements.all);
    if (next !== last) { last = next; onChange(); }
  };
  client.addCustomerInfoUpdateListener(listener);
  return () => client.removeCustomerInfoUpdateListener(listener);
}
