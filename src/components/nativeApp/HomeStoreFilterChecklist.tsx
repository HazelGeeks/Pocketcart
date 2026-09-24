import React from "react";
import { Pressable, Text, View } from "react-native";
import { listStores } from "../../services/marketData";
import type { CatalogStoreFilter } from "../../services/catalogStoreFilters";
import { groupCatalogRetailers, toggleCatalogRetailer, type CatalogRetailer } from "../../utils/catalogRetailers";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";

type Props = { value: CatalogStoreFilter; onChange: (value: CatalogStoreFilter) => void };
export function HomeStoreFilterChecklist({ value, onChange }: Props) {
  const [retailers, setRetailers] = React.useState<CatalogRetailer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    void listStores().then(({ data, error: failure }) => {
      if (active) { setRetailers(groupCatalogRetailers(data)); setError(Boolean(failure)); setLoading(false); }
    }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [retry]);
  const row = (label: string, checked: boolean, onPress: () => void, mixed = false) => (
    <Pressable key={label} accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityState={{ checked: mixed ? "mixed" : checked }} onPress={onPress} style={st.homeSortOption}>
      <Text style={[st.homeSortOptionText, { flex: 1 }, checked && st.homeSortOptionTextActive]}>{label}</Text>
      <View style={[st.homeStoreCheckbox, (checked || mixed) && st.homeStoreCheckboxChecked]}>
        {mixed ? <Text style={{ color: C.white }}>−</Text> : checked ? <AppIcon name="check" color={C.white} size={15} /> : null}
      </View>
    </Pressable>
  );
  return <View>
    <Text accessibilityRole="header" style={st.homeSortMenuTitle}>Stores</Text>
    <Text style={[st.homeFilterToggleHelp, { paddingHorizontal: 10, marginBottom: 8 }]}>Choose one or more stores. Your selection is saved on this device for your account.</Text>
    {row("All stores", !value, () => onChange(null))}
    {loading ? <Text style={st.itemMeta}>Loading stores...</Text> : error ?
      <Pressable accessibilityRole="button" onPress={() => setRetry((n) => n + 1)} style={st.homeSortOption}>
        <Text style={st.homeSortOptionText}>Couldn't load stores. Tap to retry.</Text>
      </Pressable> : retailers.length === 0 ? <Text style={st.itemMeta}>No stores available yet.</Text> :
      retailers.map((retailer) => {
        const selected = value?.ids ?? [];
        const checked = retailer.ids.every((id) => selected.includes(id));
        const mixed = !checked && retailer.ids.some((id) => selected.includes(id));
        return row(retailer.name, checked, () => {
          const ids = toggleCatalogRetailer(selected, retailer);
          const names = retailers.filter((item) => item.ids.some((id) => ids.includes(id))).map((item) => item.name);
          onChange(ids.length ? { ids, name: names.length <= 2 ? names.join(", ") || "Selected stores" : `${names.length} stores` } : null);
        }, mixed);
      })}
  </View>;
}
