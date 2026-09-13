import { FreezerStorageBadge } from "./FreezerStorageBadge";
import { Pressable, Text, View } from "react-native";
import type { FreezerStorageUnit } from "../../services/freezerStorage";
import type { FreezerItemDraft, FreezerStorageArea } from "../../utils/freezerItem";
import { storageTypeLabel } from "../../utils/freezerStorage";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";

export function FreezerStoragePicker({ units, draft, disabled, onChange }: {
  units: FreezerStorageUnit[]; draft: FreezerItemDraft; disabled: boolean;
  onChange: (draft: FreezerItemDraft) => void;
}) {
  const options = [
    ...units.map(unit => ({ id: unit.id, name: unit.name, area: unit.storage_area, emoji: unit.emoji, color: unit.color })),
    ...(["fridge", "freezer"] as FreezerStorageArea[]).map(area => ({ id: null, name: storageTypeLabel(area), area, emoji: null, color: undefined })),
  ];
  return <View style={st.freezerField}>
    {options.map(option => {
      const selected = (draft.storageUnitId ?? null) === option.id && draft.storageArea === option.area;
      return <Pressable key={option.id ?? option.area} accessibilityRole="button"
        accessibilityLabel={`${option.name}, ${storageTypeLabel(option.area)}`}
        accessibilityState={{ selected, disabled }} disabled={disabled}
        onPress={() => onChange({ ...draft, storageUnitId: option.id, storageArea: option.area })}
        style={[st.freezerStorageOption, selected && st.freezerSegmentSelected]}>
        <FreezerStorageBadge area={option.area} emoji={option.emoji} color={option.color} />
        <View style={st.freezerItemCopy}>
          <Text style={st.freezerSegmentText}>{option.name}</Text>
          <Text style={st.freezerHelp}>{option.id ? storageTypeLabel(option.area) : "No named location"}</Text>
        </View>
        {selected ? <AppIcon name="check" color={C.primaryDeep} size={20} /> : null}
      </Pressable>;
    })}
  </View>;
}
