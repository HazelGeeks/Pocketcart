import { Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

export function StoreMapModeButton({
  mode,
  onPress,
}: {
  mode: "map" | "list";
  onPress: () => void;
}) {
  const label = mode === "map" ? "Map" : "List";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={st.storeMapModeButton}
    >
      {mode === "map" ? <MapIcon /> : <ListIcon />}
      <Text style={st.storeMapModeButtonText}>{label}</Text>
    </Pressable>
  );
}

function ListIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6h12M7 12h12M7 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke={C.white}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MapIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"
        stroke={C.white}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M9 4v14M15 6v14" stroke={C.white} strokeWidth={2} />
    </Svg>
  );
}
