import React from "react";
import { Pressable, Text, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import type { WatchlistItem } from "../../services/watchlist";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";

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
          const targetPrice = parsePrice(item.target_price);
          const belowTarget =
            currentPrice !== null && targetPrice !== null && currentPrice <= targetPrice;
          const delta =
            currentPrice !== null && targetPrice !== null
              ? currentPrice - targetPrice
              : null;
          const progress =
            currentPrice !== null && targetPrice !== null && targetPrice > 0
              ? Math.max(0, Math.min(100, 100 - ((currentPrice - targetPrice) / targetPrice) * 100))
              : null;
          const unit = product?.unit ?? null;

          return {
            item,
            product,
            currentPrice,
            targetPrice,
            belowTarget,
            delta,
            unit,
            progress,
          };
        })
        .sort((a, b) => {
          const aScore = a.belowTarget ? -1 : a.targetPrice === null ? 1 : 0;
          const bScore = b.belowTarget ? -1 : b.targetPrice === null ? 1 : 0;
          if (aScore !== bScore) return aScore - bScore;

          const aTarget = a.targetPrice ?? Number.MAX_VALUE;
          const bTarget = b.targetPrice ?? Number.MAX_VALUE;
          return aTarget - bTarget;
        }),
    [items, productById],
  );

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Watchlist</Text>
      <Text style={st.sectionSub}>Products with active target price are highlighted.</Text>

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
          <Text style={st.itemMeta}>Loading watchlist...</Text>
        </View>
      ) : normalized.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>No watchlist items yet. Save a product from Home.</Text>
        </View>
      ) : (
        normalized.map((entry) => {
          const currentPriceText =
            entry.currentPrice !== null ? money.format(entry.currentPrice) : "-";
          const targetText = entry.targetPrice !== null ? money.format(entry.targetPrice) : "-";
          const deltaText =
            entry.delta === null
              ? null
              : `${entry.delta > 0 ? "+" : ""}${money.format(entry.delta)}`;

          return (
            <View key={entry.item.id} style={st.rowCard}>
              <View style={st.watchRowTop}>
                <View style={st.watchRowMain}>
                  <Text style={st.itemName}>{entry.item.name}</Text>
                  <Text style={st.itemMeta}>
                    {entry.product?.best_store_name || entry.item.store}
                    {entry.unit ? ` · ${entry.unit}` : ""}
                  </Text>
                  <Text style={st.storePrice}>
                    Current {currentPriceText} · Target {targetText}
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

              {entry.targetPrice !== null && entry.currentPrice !== null ? (
                <View style={st.watchTargetSummary}>
                  <Text style={[st.itemMeta, entry.belowTarget ? st.dealText : st.itemMeta]}>
                    {entry.belowTarget
                      ? `Below target by ${money.format(Math.abs(entry.delta ?? 0))}`
                      : `Need ${money.format(entry.delta ?? 0)} to hit target`}
                  </Text>
                  <Text style={[st.tag, entry.belowTarget ? st.targetBadge : st.tag]}>
                    {entry.belowTarget ? "Target reached" : "Watching target"}
                  </Text>
                </View>
              ) : (
                <Text style={st.itemMeta}>Set a target price to see progress.</Text>
              )}

              {entry.progress !== null ? (
                <View style={st.progressTrack}>
                  <View
                    style={[
                      st.progressFill,
                      { width: `${entry.progress}%` },
                    ]}
                  />
                </View>
              ) : null}
              {deltaText !== null ? (
                <Text style={st.itemMeta}>
                  {entry.currentPrice !== null && entry.targetPrice !== null && entry.currentPrice <= entry.targetPrice
                    ? "Best match for your target"
                    : `Gap: ${deltaText}`}
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
