import React from "react";
import { Pressable, Text, View } from "react-native";
import type { WatchlistItem } from "../../services/watchlist";
import { listProducts, type MarketProduct } from "../../services/marketData";
import { productDisplayName } from "../../utils/productNames";
import { st } from "../../screens/nativeAppStyles";
import { AppSheet } from "./AppSheet";
import { CartProductThumbnail } from "./CartProductThumbnail";

export function AlertManager({ items, activeIds, unlimited, removingId, onRemove, onOpenProduct }: {
  items: WatchlistItem[]; activeIds: string[]; unlimited: boolean; removingId: string | null;
  onRemove: (id: string) => void; onOpenProduct: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<MarketProduct[]>([]);
  const key = items.map(item => item.product_id).filter(Boolean).sort().join("|");
  React.useEffect(() => {
    if (!open || !key) return;
    let active = true;
    void listProducts({ productIds: key.split("|"), onSaleOnly: false, includePriceSummaries: false })
      .then(({ data }) => { if (active) setProducts(data); }).catch(() => {});
    return () => { active = false; };
  }, [open, key]);
  return <>
    <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[st.shoppingAddButton, { alignSelf: "flex-start" }]}>
      <Text style={st.shoppingRefreshText}>Manage alerts · {unlimited ? activeIds.length : `${activeIds.length}/5`}</Text>
    </Pressable>
    <AppSheet title="Product alerts" visible={open} onClose={() => setOpen(false)}>
      <Text style={st.shoppingFootnote}>General: 5 products · Plus: unlimited.</Text>
      {!items.length ? <Text style={st.shoppingBodyText}>Enable alerts from a product's details.</Text> : null}
      {items.map(item => {
        const product = products.find(value => value.id === item.product_id);
        const name = product ? productDisplayName(product) : item.name;
        return <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dce8df" }}>
          <CartProductThumbnail uri={product?.thumbnail_url} name={name} category={product?.category ?? undefined} />
          <Pressable accessibilityRole="button" disabled={!item.product_id} onPress={() => { if (item.product_id) { setOpen(false); onOpenProduct(item.product_id); } }} style={{ flex: 1 }}>
            <Text style={st.shoppingProductName}>{name}</Text>
            {!activeIds.includes(item.id) ? <Text style={st.shoppingFootnote}>Paused · General plan limit</Text> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove alert for ${name}`} disabled={Boolean(removingId)} onPress={() => onRemove(item.id)} style={st.shoppingAddButton}>
            <Text style={st.shoppingRefreshText}>{removingId === item.id ? "Removing…" : "Remove"}</Text>
          </Pressable>
        </View>;
      })}
    </AppSheet>
  </>;
}
