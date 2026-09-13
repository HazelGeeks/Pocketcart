import React from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { useShoppingProductSearch } from "../../hooks/useShoppingProductSearch";
import { listProducts, type MarketProduct } from "../../services/marketData";
import type { FreezerItemDraft } from "../../utils/freezerItem";
import { applyFreezerProduct } from "../../utils/freezerAutofill";
import { productDisplayName } from "../../utils/productNames";
import { st } from "../../screens/nativeAppStyles";
import { CartProductThumbnail } from "./CartProductThumbnail";

export function FreezerFoodNameField({ draft, saving, onChange }: {
  draft: FreezerItemDraft; saving: boolean; onChange: (draft: FreezerItemDraft) => void;
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<MarketProduct | null>(null);
  const search = useShoppingProductSearch(searchOpen && !saving && !draft.productId ? draft.name : "");
  const preview = selectedProduct?.id === draft.productId ? selectedProduct : null;
  React.useEffect(() => {
    if (!draft.productId || preview) return;
    let active = true;
    void listProducts({ productIds: [draft.productId], onSaleOnly: false, includePriceSummaries: false })
      .then(({ data }) => { if (active) setSelectedProduct(data[0] ?? null); })
      .catch(() => { /* Keep the linked food editable when its image cannot load. */ });
    return () => { active = false; };
  }, [draft.productId, preview]);
  const select = (product: MarketProduct) => {
    if (saving) return;
    setSelectedProduct(product); setSearchOpen(false); Keyboard.dismiss();
    onChange(applyFreezerProduct(draft, product));
  };
  const useCustom = () => {
    setSearchOpen(false); setSelectedProduct(null); Keyboard.dismiss();
    onChange({ ...draft, productId: null });
  };
  return <View style={st.freezerField}>
    <Text style={st.freezerFieldLabel}>Food name</Text>
    <TextInput accessibilityLabel="Food name" value={draft.name} editable={!saving}
      onFocus={() => setSearchOpen(true)}
      onChangeText={name => { setSearchOpen(true); onChange({ ...draft, name, productId: null }); }}
      placeholder="Search products or type your own food" placeholderTextColor="#7A8B80"
      maxLength={100} autoCorrect={false} style={st.freezerInput} />
    {draft.productId ? <View style={st.freezerStorageOption}>
      <CartProductThumbnail uri={preview?.thumbnail_url} category={preview?.category} name={draft.name} />
      <View style={st.freezerItemCopy}>
        <Text style={st.freezerItemName}>{draft.name}</Text>
        <Text style={st.freezerHelp}>Product linked · check unit and best-before date</Text>
        <Pressable accessibilityRole="button" disabled={saving} onPress={useCustom} style={st.freezerTextButton}>
          <Text style={st.freezerTextButtonLabel}>Use as custom food</Text>
        </Pressable>
      </View>
    </View> : <Text style={st.freezerHelp}>Choose a product to fill its unit and image, or keep your own food name.</Text>}
    {searchOpen && !draft.productId && draft.name.trim().length >= 2 && !saving ? <View style={st.freezerField}>
      {search.loading ? <Text accessibilityLiveRegion="polite" style={st.freezerHelp}>Searching products…</Text> : null}
      {search.error ? <Text accessibilityRole="alert" style={st.freezerMessageText}>Product search is unavailable. You can still enter your food manually.</Text> : null}
      {!search.loading && !search.error && search.products.length === 0 ? <Text style={st.freezerHelp}>No matching products. Continue with your own food name.</Text> : null}
      {search.products.map(product => <Pressable key={product.id} accessibilityRole="button"
        accessibilityLabel={`Use ${productDisplayName(product)}${product.unit ? `, ${product.unit}` : ""}`}
        onPress={() => select(product)} style={({ pressed }) => [st.freezerStorageOption, pressed && st.freezerButtonPressed]}>
        <CartProductThumbnail uri={product.thumbnail_url} category={product.category} name={productDisplayName(product)} />
        <View style={st.freezerItemCopy}>
          <Text style={st.freezerItemName}>{productDisplayName(product)}</Text>
          <Text style={st.freezerHelp}>{[product.unit, product.category].filter(Boolean).join(" · ")}</Text>
        </View>
      </Pressable>)}
      <Pressable accessibilityRole="button" onPress={useCustom} style={st.freezerTextButton}>
        <Text style={st.freezerTextButtonLabel}>Use “{draft.name.trim()}” as custom food</Text>
      </Pressable>
    </View> : null}
  </View>;
}
