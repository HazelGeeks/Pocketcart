import { Pressable, Text, TextInput, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { FreezerItemDraft, FreezerStorageArea } from "../../utils/freezerItem";

type Props = {
  draft: FreezerItemDraft;
  editing: boolean;
  saving: boolean;
  onCancel: () => void;
  onChange: (draft: FreezerItemDraft) => void;
  onSubmit: () => void;
};

export function MyFreezerItemForm({ draft, editing, saving, onCancel, onChange, onSubmit }: Props) {
  const setField = <K extends keyof FreezerItemDraft>(key: K, value: FreezerItemDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <View style={st.freezerForm}>
      <View style={st.freezerFormHeader}>
        <View style={st.freezerFormHeaderCopy}>
          <Text style={st.freezerFormTitle}>{editing ? "Edit food" : "Add food"}</Text>
          <Text style={st.freezerHelp}>Keep quantities and best-before dates easy to scan.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onCancel} style={st.freezerTextButton}>
          <Text style={st.freezerTextButtonLabel}>Cancel</Text>
        </Pressable>
      </View>

      <LabeledField label="Food name">
        <TextInput
          accessibilityLabel="Food name"
          value={draft.name}
          onChangeText={(value) => setField("name", value)}
          placeholder="e.g. Dumplings"
          placeholderTextColor="#7A8B80"
          maxLength={100}
          style={st.freezerInput}
        />
      </LabeledField>

      <LabeledField label="Stored in">
        <View style={st.freezerSegmentedControl}>
          <StorageOption
            area="fridge"
            label="Refrigerator"
            selected={draft.storageArea === "fridge"}
            onSelect={(area) => setField("storageArea", area)}
          />
          <StorageOption
            area="freezer"
            label="Freezer"
            selected={draft.storageArea === "freezer"}
            onSelect={(area) => setField("storageArea", area)}
          />
        </View>
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
        <TextInput
          accessibilityLabel="Best-before date"
          value={draft.expiresOn}
          onChangeText={(value) => setField("expiresOn", value)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#7A8B80"
          maxLength={10}
          style={st.freezerInput}
        />
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

function StorageOption({
  area,
  label,
  selected,
  onSelect,
}: {
  area: FreezerStorageArea;
  label: string;
  selected: boolean;
  onSelect: (area: FreezerStorageArea) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(area)}
      style={[st.freezerSegment, selected && st.freezerSegmentSelected]}
    >
      <Text style={[st.freezerSegmentText, selected && st.freezerSegmentTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}
