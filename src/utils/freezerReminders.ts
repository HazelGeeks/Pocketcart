export type FreezerReminderItem = { id: string; name: string; expires_on: string | null };
export type FreezerReminder = { key: string; at: number; title: string; body: string; signature: string };

export function buildFreezerReminders(items: FreezerReminderItem[], now = new Date()): FreezerReminder[] {
  const days = new Map<number, string[]>();
  for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!item.expires_on || !/^\d{4}-\d{2}-\d{2}$/.test(item.expires_on)) continue;
    const [year, month, day] = item.expires_on.split("-").map(Number);
    const expiry = new Date(year, month - 1, day, 9);
    if (expiry.getFullYear() !== year || expiry.getMonth() !== month - 1 || expiry.getDate() !== day) continue;
    for (const [offset, label] of [[-3, "D-3"], [0, "D-Day"], [3, "D+3"]] as const) {
      const date = new Date(year, month - 1, day + offset, 9);
      if (date.getTime() <= now.getTime()) continue;
      const entries = days.get(date.getTime()) ?? [];
      entries.push(`${label}: ${item.name}`);
      days.set(date.getTime(), entries);
    }
  }
  return [...days.entries()].sort(([a], [b]) => a - b).map(([at, entries]) => {
    const body = entries.slice(0, 5).join("\n") + (entries.length > 5 ? `\n+${entries.length - 5} more · Open My Freezer` : "");
    return { key: String(at), at, title: "My Freezer · Best-before reminder", body,
      signature: JSON.stringify([at, entries]) };
  });
}
