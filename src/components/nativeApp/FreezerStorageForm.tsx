import React from "react";
import { DEFAULT_STORAGE_COLOR, type StorageAppearance } from "../../utils/freezerStorageAppearance";
import { FreezerAppearancePicker } from "./FreezerAppearancePicker";
import { randomUUID } from "expo-crypto";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import type useFreezerStorage from "../../hooks/useFreezerStorage";
import type { FreezerStorageUnit } from "../../services/freezerStorage";
import type { FreezerStorageArea } from "../../utils/freezerItem";
import { storageTypeLabel, validateStorageName } from "../../utils/freezerStorage";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";

export function FreezerStorageForm({ storage, unit, initialArea = "fridge", onSaved, onDeleted }: {
  storage: ReturnType<typeof useFreezerStorage>; unit: FreezerStorageUnit | null; initialArea?: FreezerStorageArea; onSaved: (area: FreezerStorageArea) => void; onDeleted: () => void;
}) {
  const [name, setName] = React.useState(unit?.name ?? "");
  const [area, setArea] = React.useState<FreezerStorageArea>(unit?.storage_area ?? initialArea);
  const [appearance, setAppearance] = React.useState<StorageAppearance>({ emoji: unit?.emoji ?? null, color: unit?.color ?? DEFAULT_STORAGE_COLOR });
  const [creationId] = React.useState(randomUUID);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const busy = storage.saving || storage.deleting;
  const confirmDelete = () => {
    if (!unit || busy) return;
    Alert.alert("Delete storage?", `Delete “${unit.name}”? Food inside will stay in the default ${storageTypeLabel(unit.storage_area)} list.${unit.family_id ? " Shared storage will be removed for your family too." : ""}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void storage.remove(unit).then(deleted => { if (deleted) onDeleted(); }); } },
    ]);
  };
  const submit = async () => {
    const valid = validateStorageName(name, area);
    if (!valid.ok) { setValidationError(valid.error); return; }
    setValidationError(null);
    if (await storage.save(name, area, creationId, unit ?? undefined, appearance)) onSaved(area);
  };
  return <View style={st.freezerField}>
    <Text style={st.freezerFieldLabel}>Type</Text>
    <View style={st.freezerSegmentedControl}>
      {(["fridge", "freezer"] as FreezerStorageArea[]).map(type => (
        <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: area === type, disabled: Boolean(unit) || busy }}
          disabled={Boolean(unit) || busy} onPress={() => setArea(type)}
          style={[st.freezerSegment, { gap: 6, padding: 12 }, area === type && st.freezerSegmentSelected]}>
          <AppIcon name={type === "fridge" ? "fridge" : "freezer"} color={C.primaryDeep} size={28} />
          <Text style={st.freezerSegmentText}>{storageTypeLabel(type)}</Text>
        </Pressable>
      ))}
    </View>
    <Text style={st.freezerFieldLabel}>Name</Text>
    <TextInput accessibilityLabel="Storage name" value={name} onChangeText={setName} maxLength={60}
      editable={!busy} placeholder={area === "fridge" ? "e.g. Kitchen refrigerator" : "e.g. Garage freezer"}
      placeholderTextColor={C.textMuted} style={st.freezerInput} />
    <FreezerAppearancePicker area={area} name={name} value={appearance} onChange={setAppearance} disabled={busy} />
    {validationError || storage.error ? <Text accessibilityRole="alert" style={st.freezerMessageText}>{validationError ?? storage.error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy}
      onPress={() => void submit()} style={[st.freezerPrimaryButton, busy && st.freezerButtonDisabled]}>
      <Text style={st.freezerPrimaryButtonText}>{storage.saving ? "Saving…" : unit ? "Save changes" : "Add storage"}</Text>
    </Pressable>
    {unit ? <Pressable accessibilityRole="button" accessibilityLabel="Delete storage" accessibilityState={{ disabled: busy }}
      disabled={busy} onPress={confirmDelete}
      style={({ pressed }) => [st.freezerPrimaryButton, { backgroundColor: "#FFF1F1", marginTop: 6 }, pressed && st.freezerButtonPressed, busy && st.freezerButtonDisabled]}>
      <Text style={[st.freezerPrimaryButtonText, { color: "#A83939" }]}>{storage.deleting ? "Deleting…" : "Delete"}</Text>
    </Pressable> : null}
  </View>;
}
