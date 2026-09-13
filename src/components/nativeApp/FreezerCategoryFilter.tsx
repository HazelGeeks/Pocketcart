import { Pressable, Text, View } from "react-native";
import type { FreezerStorageArea } from "../../utils/freezerItem";
import { st } from "../../screens/nativeAppStyles";

export type FreezerCategory = "all" | FreezerStorageArea;
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "fridge", label: "Refrigerator" },
  { id: "freezer", label: "Freezer" },
] as const;

export function FreezerCategoryFilter({ selected, onSelect }: {
  selected: FreezerCategory; onSelect: (category: FreezerCategory) => void;
}) {
  return <View style={st.freezerSegmentedControl}>
    {CATEGORIES.map(category => <Pressable key={category.id} accessibilityRole="button"
      accessibilityLabel={`Show ${category.label} storage`}
      accessibilityState={{ selected: selected === category.id }}
      onPress={() => onSelect(category.id)}
      style={({ pressed }) => [st.freezerSegment, { borderRadius: 22 }, selected === category.id && st.freezerSegmentSelected, pressed && st.freezerButtonPressed]}>
      <Text style={[st.freezerSegmentText, selected === category.id && st.freezerSegmentTextSelected]}>{category.label}</Text>
    </Pressable>)}
  </View>;
}
