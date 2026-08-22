import { Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";

export function FoodScanNotice({
  error,
  showSafetyNote,
}: {
  error: string | null;
  showSafetyNote: boolean;
}) {
  return (
    <>
      {error ? (
        <View style={st.foodScanErrorCard} accessibilityRole="alert">
          <Text style={st.foodScanSectionTitle}>Couldn’t complete the scan</Text>
          <Text style={st.foodScanErrorText}>{error}</Text>
        </View>
      ) : null}
      {showSafetyNote ? (
        <Text style={st.foodScanFootnote}>
          Food Scan cannot detect bacteria, internal spoilage, contamination, or guarantee that food
          is safe to eat.
        </Text>
      ) : null}
    </>
  );
}
