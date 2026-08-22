export type FreezerStorageArea = "fridge" | "freezer";

export type FreezerItemDraft = {
  name: string;
  storageArea: FreezerStorageArea;
  quantity: string;
  unit: string;
  expiresOn: string;
  note: string;
};

export type ValidFreezerItemInput = {
  name: string;
  storageArea: FreezerStorageArea;
  quantity: number;
  unit: string | null;
  expiresOn: string | null;
  note: string | null;
};

export type FreezerExpiryState = "expired" | "soon" | "later";

export function emptyFreezerItemDraft(): FreezerItemDraft {
  return {
    name: "",
    storageArea: "fridge",
    quantity: "1",
    unit: "",
    expiresOn: "",
    note: "",
  };
}

function validDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateFreezerItemDraft(
  draft: FreezerItemDraft,
): { ok: true; value: ValidFreezerItemInput } | { ok: false; error: string } {
  const name = draft.name.trim();
  if (!name) return { ok: false, error: "Food name is required." };
  if (name.length > 100) return { ok: false, error: "Food name must be 100 characters or fewer." };

  const quantity = Number(draft.quantity.trim());
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 9999) {
    return { ok: false, error: "Quantity must be greater than 0 and no more than 9,999." };
  }

  const unit = draft.unit.trim();
  if (unit.length > 30) return { ok: false, error: "Unit must be 30 characters or fewer." };

  const expiresOn = draft.expiresOn.trim();
  if (expiresOn && !validDateOnly(expiresOn)) {
    return { ok: false, error: "Best-before date must use YYYY-MM-DD." };
  }

  const note = draft.note.trim();
  if (note.length > 300) return { ok: false, error: "Note must be 300 characters or fewer." };

  return {
    ok: true,
    value: {
      name,
      storageArea: draft.storageArea,
      quantity: Math.round(quantity * 100) / 100,
      unit: unit || null,
      expiresOn: expiresOn || null,
      note: note || null,
    },
  };
}

export function getFreezerExpiryState(
  expiresOn: string | null,
  today = new Date(),
): FreezerExpiryState | null {
  if (!expiresOn || !validDateOnly(expiresOn)) return null;
  const [year, month, day] = expiresOn.split("-").map(Number);
  const expiryTime = Date.UTC(year, month - 1, day);
  const todayTime = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((expiryTime - todayTime) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= 3) return "soon";
  return "later";
}
