import React from "react";
import { AppState } from "react-native";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import { billingConfigured, billingError, loadBilling, manageBillingSubscription, PLUS_ENTITLEMENT,
  purchaseBillingPackage, purchasesEnabled, restoreBillingPurchases, setBillingUser, verifyBillingAccess, observeBillingChanges } from "../services/billingClient";

type Snapshot = { owner: string; info: CustomerInfo; packages: PurchasesPackage[]; isPlus: boolean };
export default function useBilling(userId: string | null) {
  const [snapshot, setSnapshot] = React.useState<Snapshot | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const currentUser = React.useRef(userId); currentUser.current = userId;
  const generation = React.useRef(0);
  const operating = React.useRef(false);
  const refresh = React.useCallback(async () => {
    if (currentUser.current !== userId) return;
    const request = ++generation.current;
    setMessage(null); setLoading(true);
    try {
      await setBillingUser(userId);
      if (request !== generation.current || currentUser.current !== userId) return;
      if (!userId || !billingConfigured) { setSnapshot(null); return; }
      const result = await loadBilling(userId);
      let isPlus = false;
      let warning: string | null = null;
      try { isPlus = await verifyBillingAccess(); } catch (error) { warning = billingError(error); }
      if (request !== generation.current || currentUser.current !== userId) return;
      setSnapshot({ ...result, owner: userId, isPlus }); setMessage(warning);
      return warning ? null : isPlus;
    } catch (error) {
      if (request === generation.current) { setSnapshot(null); setMessage(billingError(error)); }
    } finally { if (request === generation.current) setLoading(false); }
  }, [userId]);
  React.useEffect(() => {
    setSnapshot(null); setMessage(null);
    let alive = true;
    let removeUpdates = () => {};
    void refresh().then(async () => {
      if (!alive || !userId) return;
      const remove = await observeBillingChanges(userId, () => { if (!operating.current) void refresh(); });
      if (alive) removeUpdates = remove; else remove();
    }).catch(() => {});
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active" && !operating.current) void refresh();
    });
    return () => { alive = false; generation.current++; subscription.remove(); removeUpdates(); };
  }, [refresh]);

  const execute = async (action: "purchase" | "restore" | "manage", packageId?: string) => {
    if (!userId || operating.current || loading) return;
    operating.current = true; setBusy(true); setMessage(null);
    try {
      if (action === "purchase") await purchaseBillingPackage(userId, packageId ?? "");
      else if (action === "restore") await restoreBillingPurchases(userId);
      else await manageBillingSubscription(userId);
      if (currentUser.current !== userId) return;
      const active = await refresh();
      if (currentUser.current === userId && active === false) setMessage(action === "restore"
        ? "No active Plus subscription was found for this account."
        : action === "purchase" ? "Purchase received. Please refresh your subscription status shortly." : null);
    } catch (error) { if (currentUser.current === userId) setMessage(billingError(error)); }
    finally { operating.current = false; setBusy(false); }
  };
  const state = snapshot?.owner === userId ? snapshot : null;
  const entitlement = state?.info.entitlements.active[PLUS_ENTITLEMENT];
  return {
    configured: billingConfigured, purchasesEnabled, isPlus: state?.isPlus ?? false,
    storeActive: Boolean(entitlement), expirationDate: entitlement?.expirationDate ?? null,
    willRenew: entitlement?.willRenew ?? false, packages: state?.packages ?? [], loading, busy, message,
    refresh, purchase: (id: string) => execute("purchase", id),
    restore: () => execute("restore"), manage: () => execute("manage"),
  };
}
