import React from "react";
import { Pressable, Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import type { WatchlistItem } from "../../services/watchlist";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { productDisplayName } from "../../utils/productNames";

type WatchlistPanelProps = {
  hasSupabaseEnv: boolean;
  items: WatchlistItem[];
  productById: Map<string, MarketProduct>;
  loading: boolean;
  removingId: string | null;
  message: string | null;
  onRemoveItem: (itemId: string) => void;
};

export function WatchlistPanel({
  hasSupabaseEnv,
  items,
  productById,
  loading,
  removingId,
  message,
  onRemoveItem,
}: WatchlistPanelProps) {
  const normalized = React.useMemo(
    () =>
      items
        .map((item) => {
          const product = item.product_id ? productById.get(item.product_id) : null;
          const currentPrice = product?.current_price ?? parsePrice(item.latest_price);
          const previousPrice = product?.previous_price ?? null;
          const priceDelta = product?.price_delta ?? null;
          const isOnSale = priceDelta !== null && priceDelta < 0;
          const unit = product?.unit ?? null;

          return {
            item,
            product,
            displayName: product ? productDisplayName(product) : item.name,
            currentPrice,
            previousPrice,
            priceDelta,
            isOnSale,
            unit,
          };
        })
        .sort((a, b) => {
          const aScore = a.isOnSale ? -1 : 0;
          const bScore = b.isOnSale ? -1 : 0;
          if (aScore !== bScore) return aScore - bScore;

          return entryTime(b.item.created_at) - entryTime(a.item.created_at);
        }),
    [items, productById],
  );

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Price Alert Subscriptions</Text>
      <Text style={st.sectionSub}>Products you want PocketCart to monitor across future weekly sales.</Text>

      {!hasSupabaseEnv ? (
        <View style={st.rowCard}>
          <Text style={st.itemName}>Supabase configuration required</Text>
          <Text style={st.itemMeta}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
          </Text>
        </View>
      ) : null}

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading price alert subscriptions...</Text>
        </View>
      ) : normalized.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>No subscriptions yet. Choose “Notify me when on sale” from a product detail page.</Text>
        </View>
      ) : (
        normalized.map((entry) => {
          const currentPriceText =
            entry.currentPrice !== null ? money.format(entry.currentPrice) : "-";
          const previousPriceText =
            entry.previousPrice !== null ? money.format(entry.previousPrice) : "-";
          const deltaText =
            entry.priceDelta === null
              ? null
              : `${entry.priceDelta > 0 ? "+" : ""}${money.format(entry.priceDelta)}`;

          return (
            <View key={entry.item.id} style={st.rowCard}>
              <View style={st.watchRowTop}>
                <View style={st.watchRowMain}>
                  <Text style={st.itemName}>{entry.displayName}</Text>
                  <Text style={st.itemMeta}>
                    {entry.product?.best_store_name || entry.item.store}
                    {entry.unit ? ` · ${entry.unit}` : ""}
                  </Text>
                  <Text style={st.storePrice}>
                    Current {currentPriceText} · Previous sale {previousPriceText}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRemoveItem(entry.item.id)}
                  style={[st.removeBtn, removingId === entry.item.id && st.removeBtnDisabled]}
                  disabled={removingId === entry.item.id}
                >
                  <Text style={st.removeBtnText}>
                    {removingId === entry.item.id ? "Removing..." : "Remove"}
                  </Text>
                </Pressable>
              </View>

              <View style={st.watchTargetSummary}>
                <Text style={[st.itemMeta, entry.isOnSale ? st.dealText : st.itemMeta]}>
                  {entry.isOnSale
                    ? "Sale signal is active from the latest weekly update."
                    : "We'll highlight this when the weekly price drops."}
                </Text>
                <Text style={[st.tag, entry.isOnSale ? st.targetBadge : st.tag]}>
                  {entry.isOnSale ? "On sale now" : "Sale alert on"}
                </Text>
              </View>

              {deltaText !== null ? (
                <Text style={st.itemMeta}>
                  Weekly change: {deltaText}
                </Text>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

function parsePrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function entryTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
