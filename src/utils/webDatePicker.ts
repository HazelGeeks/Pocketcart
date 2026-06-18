import { Platform } from "react-native";

type WebDatePickerResult =
  | { ok: true }
  | { ok: false; error: string };

export function openWebDatePicker(params: {
  value: string;
  onChange: (value: string) => void;
  nativeMessage: string;
}): WebDatePickerResult {
  if (Platform.OS !== "web") {
    return { ok: false, error: params.nativeMessage };
  }

  const doc = (globalThis as { document?: any }).document;
  if (!doc || typeof doc.createElement !== "function") {
    return { ok: false, error: "Date picker is not available in this environment." };
  }

  const input = doc.createElement("input");
  input.type = "date";
  input.value = params.value;
  input.onchange = () => {
    const value = String(input.value ?? "").trim();
    if (value) params.onChange(value);
  };

  if (typeof input.showPicker === "function") input.showPicker();
  else input.click();

  return { ok: true };
}
