type RevenueCatSubscriber = {
  entitlements?: Record<string, { expires_date?: string | null; product_identifier?: string; purchase_date?: string }>;
  subscriptions?: Record<string, { grace_period_expires_date?: string | null; is_sandbox?: boolean }>;
};
export function revenueCatHasAccess(
  subscriber: RevenueCatSubscriber | undefined, entitlementId: string,
  now = Date.now(), allowSandbox = false,
): boolean {
  const entitlement = subscriber?.entitlements?.[entitlementId];
  if (!entitlement?.product_identifier || !entitlement.purchase_date) return false;
  const purchased = Date.parse(entitlement.purchase_date);
  if (!Number.isFinite(purchased) || purchased > now) return false;
  const subscription = subscriber?.subscriptions?.[entitlement.product_identifier];
  if (subscription?.is_sandbox && !allowSandbox) return false;
  if (entitlement.expires_date === null) return true;
  const expiry = Date.parse(entitlement.expires_date ?? "");
  if (!Number.isFinite(expiry)) return false;
  const grace = Date.parse(subscription?.grace_period_expires_date ?? "");
  return expiry > now || (Number.isFinite(grace) && grace > now);
}
