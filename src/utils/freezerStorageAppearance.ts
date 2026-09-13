export const STORAGE_EMOJIS = [
  { value: "🏠", label: "Home" },
  { value: "🧊", label: "Ice" },
  { value: "❄️", label: "Snowflake" },
  { value: "🥬", label: "Vegetables" },
  { value: "🍎", label: "Apple" },
  { value: "🥩", label: "Meat" },
  { value: "🐟", label: "Fish" },
  { value: "🍱", label: "Meals" },
] as const;

export const STORAGE_COLORS = [
  { value: "#176B45", label: "Green" },
  { value: "#245EA8", label: "Blue" },
  { value: "#7050A0", label: "Purple" },
  { value: "#A6531A", label: "Orange" },
  { value: "#A83F65", label: "Rose" },
  { value: "#167475", label: "Teal" },
  { value: "#79563D", label: "Brown" },
  { value: "#526174", label: "Slate" },
] as const;
export const DEFAULT_STORAGE_COLOR = STORAGE_COLORS[0].value;
export type StorageAppearance = { emoji: string | null; color: string };

export function validateStorageAppearance(appearance: StorageAppearance) {
  if (appearance.emoji !== null && !STORAGE_EMOJIS.some(option => option.value === appearance.emoji)) {
    return { ok: false as const, error: "Choose an emoji from the available options." };
  }
  if (!STORAGE_COLORS.some(option => option.value === appearance.color)) {
    return { ok: false as const, error: "Choose a color from the available options." };
  }
  return { ok: true as const, value: appearance };
}
