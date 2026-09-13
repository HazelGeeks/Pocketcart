export function notificationFormIssue(retailerSelected: boolean, date: string): string | null {
  if (!retailerSelected) return "Choose a retailer to enable test sending.";
  if (!date) return "Choose the Flyer start date to enable test sending.";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return "Enter a valid Flyer start date (YYYY-MM-DD).";
  }
  if (date > new Date().toISOString().slice(0, 10))
    return "The Flyer start date cannot be in the future.";
  return null;
}

export function notificationLoadError(
  error: { message?: string; code?: string } | null,
): string | null {
  if (!error) return null;
  if (
    error.code === "PGRST202" ||
    /could not find the function|does not exist|schema cache/i.test(error.message ?? "")
  ) {
    return "Notification setup is incomplete on the server. Apply the notification database migration and deploy the admin-flyer-notification function, then refresh.";
  }
  return error.message || "Unable to load notification data. Please refresh.";
}
