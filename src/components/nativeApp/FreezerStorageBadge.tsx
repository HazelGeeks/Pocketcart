import { Text, View } from "react-native";
import type { FreezerStorageArea } from "../../utils/freezerItem";
import { DEFAULT_STORAGE_COLOR } from "../../utils/freezerStorageAppearance";
import { AppIcon } from "../icons/AppIcon";

export function FreezerStorageBadge({ area, emoji, color = DEFAULT_STORAGE_COLOR }: {
  area: FreezerStorageArea; emoji?: string | null; color?: string;
}) {
  return <View accessible={false} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}>
    {emoji ? <Text style={{ fontSize: 24 }}>{emoji}</Text> : <AppIcon name={area === "fridge" ? "fridge" : "freezer"} color={color} size={24} />}
  </View>;
}
