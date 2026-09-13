import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MapSearchLocation } from "../../services/mapLocationSearch";
import { marketingPalette as C } from "../../shared/design/palette";

export type LocationSearchProps = {
  locationResults: MapSearchLocation[];
  searchingLocation: boolean;
  searchOrigin: MapSearchLocation | null;
  onSearchLocation: () => void;
  onSelectLocation: (place: MapSearchLocation) => void;
  onSubmitSearch: () => void;
};

export function StoreLocationResults({ query, locationResults, searchingLocation, searchOrigin,
  onSearchLocation, onSelectLocation }: LocationSearchProps & { query: string }) {
  if (!query.trim() || searchOrigin) return null;
  return (
    <View style={styles.panel}>
      <Pressable accessibilityRole="button" disabled={searchingLocation}
        accessibilityLabel={`Look up address or city: ${query}`} onPress={onSearchLocation} style={styles.row}>
        {searchingLocation ? <ActivityIndicator color={C.primaryDeep} /> : null}
        <Text style={styles.action}>{searchingLocation ? "Looking up location…" : "Search this address, city or postal code"}</Text>
      </Pressable>
      {locationResults.length ? (
        <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
          {locationResults.map((place) => (
            <Pressable key={`${place.latitude}:${place.longitude}`} accessibilityRole="button"
              accessibilityLabel={`Show stores around ${place.label}`}
              onPress={() => onSelectLocation(place)} style={styles.row}>
              <Text style={styles.label}>{place.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { backgroundColor: C.white, borderRadius: 14, marginBottom: 8, overflow: "hidden" },
  row: { minHeight: 44, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  action: { color: C.primaryDeep, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  label: { color: C.text, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  results: { maxHeight: 180 },
});
