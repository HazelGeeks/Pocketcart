import { Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import type { FoodScanMode } from "../../services/foodScan";

export function FoodScanModeSelector({
  mode,
  onChange,
}: {
  mode: FoodScanMode;
  onChange: (mode: FoodScanMode) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={st.foodScanModeRow}>
      <ModeButton label="Fresh food" active={mode === "fresh"} onPress={() => onChange("fresh")} />
      <ModeButton
        label="Ingredient label"
        active={mode === "label"}
        onPress={() => onChange("label")}
      />
    </View>
  );
}

function ModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[st.foodScanModeButton, active && st.foodScanModeButtonActive]}
    >
      <Text style={[st.foodScanModeText, active && st.foodScanModeTextActive]}>{label}</Text>
    </Pressable>
  );
}
