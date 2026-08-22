export function formatAlertActivityTime(value: string, now = Date.now()): string {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return "";

  const elapsedMinutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return new Date(createdAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}
