import { FreezerFoodNameField } from "./FreezerFoodNameField";
import type { FreezerStorageUnit } from "../../services/freezerStorage";
import { FreezerStoragePicker } from "./FreezerStoragePicker";
import { BestBeforePicker } from "./BestBeforePicker";
import { Pressable, Text, TextInput, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { FreezerItemDraft } from "../../utils/freezerItem";

type Props = {
  hideHeader?: boolean;
  storageUnits: FreezerStorageUnit[];
  draft: FreezerItemDraft;
  editing: boolean;
  saving: boolean;
  onCancel: () => void;
  onChange: (draft: FreezerItemDraft) => void;
  onSubmit: () => void;
};

export function MyFreezerItemForm({ hideHeader = false, storageUnits, draft, editing, saving, onCancel, onChange, onSubmit }: Props) {
  const setField = <K extends keyof FreezerItemDraft>(key: K, value: FreezerItemDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <View style={[st.freezerForm, hideHeader && { backgroundColor: "transparent", padding: 0 }]}>
      {!hideHeader ? <View style={st.freezerFormHeader}>
        <View style={st.freezerFormHeaderCopy}>
          <Text style={st.freezerFormTitle}>{editing ? "Edit food" : "Add food"}</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={saving} onPress={onCancel} style={st.freezerTextButton}>
          <Text style={st.freezerTextButtonLabel}>Cancel</Text>
        </Pressable>
      </View> : null}

      <FreezerFoodNameField draft={draft} saving={saving} onChange={onChange} />

      <LabeledField label="Stored in">
        <FreezerStoragePicker units={storageUnits} draft={draft} disabled={saving} onChange={onChange} />
      </LabeledField>

      <View style={st.freezerFieldRow}>
        <View style={st.freezerQuantityField}>
          <LabeledField label="Quantity">
            <TextInput
              accessibilityLabel="Quantity"
              value={draft.quantity}
              onChangeText={(value) => setField("quantity", value)}
              placeholder="1"
              placeholderTextColor="#7A8B80"
              keyboardType="decimal-pad"
              style={st.freezerInput}
            />
          </LabeledField>
        </View>
        <View style={st.freezerUnitField}>
          <LabeledField label="Unit">
            <TextInput
              accessibilityLabel="Unit"
              value={draft.unit}
              onChangeText={(value) => setField("unit", value)}
              placeholder="bags, g, pcs"
              placeholderTextColor="#7A8B80"
              maxLength={30}
              style={st.freezerInput}
            />
          </LabeledField>
        </View>
      </View>

      <LabeledField label="Best before · optional">
        <BestBeforePicker value={draft.expiresOn} onChange={(value) => setField("expiresOn", value)} />
      </LabeledField>

      <LabeledField label="Note · optional">
        <TextInput
          accessibilityLabel="Food note"
          value={draft.note}
          onChangeText={(value) => setField("note", value)}
          placeholder="e.g. Top drawer"
          placeholderTextColor="#7A8B80"
          maxLength={300}
          multiline
          style={[st.freezerInput, st.freezerNoteInput]}
        />
      </LabeledField>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: saving }}
        disabled={saving}
        onPress={onSubmit}
        style={({ pressed }) => [
          st.freezerPrimaryButton,
          pressed && st.freezerButtonPressed,
          saving && st.freezerButtonDisabled,
        ]}
      >
        <Text style={st.freezerPrimaryButtonText}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add to My Freezer"}
        </Text>
      </Pressable>
    </View>
  );
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={st.freezerField}>
      <Text style={st.freezerFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}
