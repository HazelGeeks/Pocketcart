import { Pressable, Text, View } from "react-native";
import type { FreezerStorageArea } from "../../utils/freezerItem";
import { STORAGE_COLORS, STORAGE_EMOJIS, type StorageAppearance } from "../../utils/freezerStorageAppearance";
import { st } from "../../screens/nativeAppStyles";
import { AppIcon } from "../icons/AppIcon";
import { FreezerStorageBadge } from "./FreezerStorageBadge";

export function FreezerAppearancePicker({ area, name, value, disabled, onChange }: {
  area: FreezerStorageArea; name: string; value: StorageAppearance; disabled: boolean;
  onChange: (value: StorageAppearance) => void;
}) {
  return <View style={{ gap: 12 }}>
    <View style={[st.freezerStorageOption, { borderColor: value.color }]}>
      <FreezerStorageBadge area={area} {...value} />
      <Text style={[st.freezerItemName, { flex: 1 }]}>{name.trim() || "Your storage"}</Text>
    </View>
    <Text style={st.freezerFieldLabel}>Emoji</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {[{ value: null, label: "Default icon" }, ...STORAGE_EMOJIS].map(option => (
        <Pressable key={option.label} accessibilityRole="button" accessibilityLabel={option.label}
          accessibilityState={{ selected: value.emoji === option.value, disabled }} disabled={disabled}
          onPress={() => onChange({ ...value, emoji: option.value })}
          style={[st.freezerStorageOption, { width: 48, minHeight: 48, padding: 0, justifyContent: "center" }, value.emoji === option.value && st.freezerSegmentSelected]}>
          {option.value ? <Text style={{ fontSize: 25 }}>{option.value}</Text> : <AppIcon name={area === "fridge" ? "fridge" : "freezer"} color={value.color} size={25} />}
        </Pressable>
      ))}
    </View>
    <Text style={st.freezerFieldLabel}>Color</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {STORAGE_COLORS.map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${option.label} color`}
        accessibilityState={{ selected: value.color === option.value, disabled }} disabled={disabled}
        onPress={() => onChange({ ...value, color: option.value })}
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: option.value, alignItems: "center", justifyContent: "center" }}>
        {value.color === option.value ? <AppIcon name="check" color="#FFFFFF" size={24} /> : null}
      </Pressable>)}
    </View>
  </View>;
}
