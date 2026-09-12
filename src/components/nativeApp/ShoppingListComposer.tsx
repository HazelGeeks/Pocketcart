import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useShoppingProductSearch } from "../../hooks/useShoppingProductSearch";
import { st } from "../../screens/nativeAppStyles";
import type { MarketProduct } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { productDisplayName } from "../../utils/productNames";
import { AppIcon } from "../icons/AppIcon";

type Props = {
  disabled: boolean;
  onAddProduct: (product: MarketProduct) => void;
  onAddCustom: (name: string) => void;
};

export function ShoppingListComposer({ disabled, onAddProduct, onAddCustom }: Props) {
  const [query, setQuery] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const { products, loading, error } = useShoppingProductSearch(disabled ? "" : query);
  const finish = (name: string) => { setQuery(""); setNotice(`Added ${name}`); };
  const addCustom = () => {
    if (disabled || !query.trim()) return;
    onAddCustom(query.trim());
    finish(query.trim());
  };
  return (
    <View style={st.shoppingComposer}>
      <View style={st.shoppingSearchBox}>
        <AppIcon name="search" color={C.textSoft} size={20} />
        <TextInput accessibilityLabel="Search products or add a custom item" placeholder="Search or add an item"
          placeholderTextColor={C.textMuted} value={query} editable={!disabled} maxLength={120}
          onChangeText={(text) => { setQuery(text); setNotice(""); }} style={st.shoppingSearchInput}
          returnKeyType="search" autoCorrect={false} />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear item search"
          onPress={() => setQuery("")} style={st.shoppingRemoveBtn}>
          <AppIcon name="close" color={C.textSoft} size={18} />
        </Pressable> : null}
      </View>
      {query.trim() && !disabled ? (
        <View style={st.shoppingSearchResults}>
          {loading ? <Text style={st.shoppingBodyText}>Searching products…</Text> : null}
          {error ? <Text accessibilityRole="alert" style={st.shoppingWarningText}>{error}</Text> : null}
          {!loading && !error && query.trim().length >= 2 && products.length === 0 ?
            <Text style={st.shoppingBodyText}>No catalog matches. You can still add this item.</Text> : null}
          {products.map((product) => (
            <Pressable key={product.id} accessibilityRole="button"
              accessibilityLabel={`Add ${productDisplayName(product)} to shopping list`}
              onPress={() => { onAddProduct(product); finish(productDisplayName(product)); }} style={st.shoppingSearchResult}>
              <View style={st.shoppingItemCopy}>
                <Text style={st.shoppingProductName}>{productDisplayName(product)}</Text>
                <Text style={st.shoppingBodyText}>{[product.unit, product.category].filter(Boolean).join(" · ")}</Text>
              </View>
              <AppIcon name="add" color={C.primaryDeep} size={20} />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={addCustom} style={st.shoppingSearchResult}>
            <View style={st.shoppingItemCopy}>
              <Text style={st.shoppingRefreshText}>Add “{query.trim()}” as a custom item</Text>
              <Text style={st.shoppingFootnote}>No tracked price · saved on this device</Text>
            </View>
            <AppIcon name="add" color={C.primaryDeep} size={20} />
          </Pressable>
        </View>
      ) : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={st.shoppingRefreshText}>{notice}</Text> : null}
    </View>
  );
}
