import type { FreezerStorageArea } from "./freezerItem";

export function validateStorageName(name: string, area: FreezerStorageArea) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60) return { ok: false as const, error: "Enter a name between 1 and 60 characters." };
  if (area !== "fridge" && area !== "freezer") return { ok: false as const, error: "Choose a refrigerator or freezer." };
  return { ok: true as const, name: trimmed };
}

export function storageTypeLabel(area: FreezerStorageArea) {
  return area === "fridge" ? "Refrigerator" : "Freezer";
}
