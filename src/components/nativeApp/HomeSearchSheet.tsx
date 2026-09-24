import React from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useShoppingProductSearch } from "../../hooks/useShoppingProductSearch";
import { listStores, type MarketProduct, type MarketStore } from "../../services/marketData";
import { readRecentCatalogSearches, updateRecentCatalogSearches } from "../../services/recentCatalogSearches";
import { marketingPalette as C } from "../../shared/design/palette";
import { cleanSearch, searchSuggestions } from "../../utils/catalogSearch";
import { getStoreLogoBackground } from "../../utils/storeBrandLogo";
import { AppIcon } from "../icons/AppIcon";
import { searchStyles as s } from "./HomeSearchStyles";
import { getStoreInitials, getStoreLogo } from "./StoreMapResultCard";

type Props = {
  query: string;
  profileId: string | null;
  products: MarketProduct[];
  favoriteStoreIds: string[];
  onClose: () => void;
  onSearch: (query: string) => void;
  onStore: (ids: string[], name: string) => void;
};

export function HomeSearchSheet({ query, profileId, products, favoriteStoreIds, onClose, onSearch, onStore }: Props) {
  const [draft, setDraft] = React.useState(query);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [historyError, setHistoryError] = React.useState(false);
  const [stores, setStores] = React.useState<MarketStore[]>([]);
  const [storeLoading, setStoreLoading] = React.useState(true);
  const [storeError, setStoreError] = React.useState(false);
  const input = React.useRef<TextInput>(null);
  const matches = useShoppingProductSearch(draft);
  const term = cleanSearch(draft);
  React.useEffect(() => {
    let active = true;
    void readRecentCatalogSearches(profileId).then((data) => { if (active) setRecent(data); })
      .catch(() => { if (active) setHistoryError(true); });
    void listStores().then(({ data, error }) => {
      if (active) { setStores(data); setStoreError(Boolean(error)); setStoreLoading(false); }
    }).catch(() => { if (active) { setStoreError(true); setStoreLoading(false); } });
    return () => { active = false; };
  }, [profileId]);
  const retailers = React.useMemo(() => {
    const groups = new Map<string, { name: string; ids: string[]; store: MarketStore; favorite: boolean }>();
    for (const store of stores) {
      const name = store.brand?.trim() || store.name;
      const key = name.toLowerCase();
      const group = groups.get(key) ?? { name, ids: [], store, favorite: false };
      group.ids.push(store.id);
      group.favorite ||= favoriteStoreIds.includes(store.id);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name));
  }, [stores, favoriteStoreIds]);
  const suggestions = searchSuggestions([...matches.products, ...products].map((p) => p.english_name ?? ""), term);
  const matchingStores = retailers.filter((retailer) => retailer.name.toLowerCase().includes(term.toLowerCase()));
  const submit = (value: string) => {
    const search = cleanSearch(value);
    if (search) void updateRecentCatalogSearches(profileId, (current) => [search, ...current]).catch(() => undefined);
    onSearch(search);
  };
  const removeRecent = (value: string) => {
    setRecent((current) => current.filter((entry) => entry !== value));
    void updateRecentCatalogSearches(profileId, (current) => current.filter((entry) => entry !== value))
      .catch(() => setHistoryError(true));
  };
  const storeTiles = (items: typeof retailers) => (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={s.stores}>
      {items.map((retailer) => {
        const logo = getStoreLogo(retailer.store);
        return <Pressable key={retailer.name} accessibilityRole="button" accessibilityLabel={`Search products at ${retailer.name}`}
          onPress={() => onStore(retailer.ids, retailer.name)} style={s.store}>
          <View style={[s.logoFrame, { backgroundColor: getStoreLogoBackground(retailer.store) ?? C.bg }]}>
            {logo ? <Image source={logo} resizeMode="contain" style={s.logo} /> : <Text style={s.action}>{getStoreInitials(retailer.store)}</Text>}
          </View>
          <Text style={s.storeName} numberOfLines={2}>{retailer.name}</Text>
        </Pressable>;
      })}
    </ScrollView>
  );
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} onShow={() => input.current?.focus()}>
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Text accessibilityRole="header" style={s.title}>Search</Text>
        <View style={s.toolbar}>
          <View style={s.field}>
            <AppIcon name="search" color={C.textMuted} size={20} />
            <TextInput ref={input} value={draft} onChangeText={setDraft} accessibilityLabel="Search products and stores"
              placeholder="Search products and stores" placeholderTextColor={C.textMuted} autoCapitalize="none"
              autoCorrect={false} returnKeyType="search" onSubmitEditing={() => submit(draft)} style={s.input} />
            {draft ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setDraft("")} style={s.button}>
              <AppIcon name="close" color={C.textMuted} size={18} />
            </Pressable> : null}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={s.button}><Text style={s.action}>Cancel</Text></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={s.content}>
          {!term ? <>
            {retailers.some((r) => r.favorite) ? <>
              <Text accessibilityRole="header" style={s.sectionTitle}>Your stores</Text>
              {storeTiles(retailers.filter((r) => r.favorite))}
            </> : null}
            <Text accessibilityRole="header" style={s.sectionTitle}>Browse stores</Text>
            {storeLoading ? <Text style={s.muted}>Loading stores…</Text> : storeError ? <Text style={s.muted}>Couldn't load stores. Reopen search to retry.</Text>
              : retailers.length ? storeTiles(retailers) : <Text style={s.muted}>No stores available yet.</Text>}
            <View style={s.heading}>
              <Text accessibilityRole="header" style={s.sectionTitle}>Recent searches</Text>
              {recent.length ? <Pressable accessibilityRole="button" onPress={() => setEditing(!editing)} style={s.button}><Text style={s.action}>{editing ? "Done" : "Edit"}</Text></Pressable> : null}
            </View>
            {historyError ? <Text style={s.muted}>Recent searches couldn't be saved or loaded.</Text> : null}
            {!recent.length ? <Text style={s.muted}>Your searches will appear here.</Text> : <View style={s.chips}>
              {recent.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={editing ? `Remove search ${value}` : `Search ${value}`}
                onPress={() => editing ? removeRecent(value) : submit(value)} style={s.chip}>
                <AppIcon name={editing ? "close" : "search"} color={C.textMuted} size={16} /><Text style={s.chipText}>{value}</Text>
              </Pressable>)}
            </View>}
          </> : <>
            <View>
              <Pressable accessibilityRole="button" onPress={() => submit(term)} style={s.result}>
                <AppIcon name="search" color={C.primaryDeep} size={20} /><Text style={s.resultText}>Search for “{term}”</Text>
              </Pressable>
              {suggestions.map((value) => <Pressable key={value} accessibilityRole="button" onPress={() => submit(value)} style={s.result}>
                <AppIcon name="search" color={C.textMuted} size={18} /><Text style={s.resultText}>{value}</Text>
                <AppIcon name="chevron-right" color={C.textMuted} size={16} />
              </Pressable>)}
            </View>
            {matches.loading ? <Text style={s.muted}>Finding suggestions…</Text> : matches.error ? <Text style={s.muted}>Suggestions are unavailable. You can still submit your search.</Text>
              : !suggestions.length ? <Text style={s.muted}>No matching suggestions. Try searching above.</Text> : null}
            {matchingStores.length ? <><Text accessibilityRole="header" style={s.sectionTitle}>Stores</Text>{storeTiles(matchingStores)}</> : null}
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
