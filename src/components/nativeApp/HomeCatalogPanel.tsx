import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MarketProduct } from "../../services/marketData";
import type { SummaryCard } from "../../screens/nativeAppData";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { formatSignedPercent } from "./priceDisplay";

type HomeSortMode = "deals" | "lowestPrice" | "biggestDrop";

type HomeCatalogPanelProps = {
  query: string;
  category: string;
  categories: string[];
  message: string | null;
  actionMessage: string | null;
  loading: boolean;
  products: MarketProduct[];
  selectedProduct: MarketProduct | null;
  targetPriceByProduct: Map<string, number>;
  summaryCards: SummaryCard[];
  sortMode: HomeSortMode;
  watchedProductIds: Set<string>;
  storeFilterName: string | null;
  onClearStoreFilter: () => void;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeSort: (mode: HomeSortMode) => void;
  onSelectProduct: (productId: string) => void;
  onWatchProduct: (productId: string) => void;
  onOpenStoreOnMap: (storeId: string, storeName?: string) => void;
};

const SORT_OPTIONS: Array<{ value: HomeSortMode; label: string }> = [
  { value: "deals", label: "Best deals" },
  { value: "lowestPrice", label: "Lowest price" },
  { value: "biggestDrop", label: "Biggest drop" },
];

const byPrice = (product: MarketProduct) => product.current_price ?? Number.MAX_VALUE;
const byDrop = (product: MarketProduct) => product.price_delta_percent ?? Number.MAX_VALUE;

const formatTrendLabel = (product: MarketProduct) => {
  if (product.price_delta_percent === null) return null;
  const percent = formatSignedPercent(product.price_delta_percent);
  const direction =
    product.price_delta === null || product.price_delta === 0
      ? "Flat"
      : product.price_delta < 0
        ? "Down"
        : "Up";

  return `${direction} ${percent}`;
};

const formatPriceLabel = (value: number | null): string => {
  if (value === null) return "No price";
  return money.format(value);
};

export function HomeCatalogPanel({
  query,
  category,
  categories,
  message,
  actionMessage,
  loading,
  products,
  selectedProduct,
  targetPriceByProduct,
  summaryCards,
  watchedProductIds,
  sortMode,
  storeFilterName,
  onClearStoreFilter,
  onChangeQuery,
  onChangeCategory,
  onChangeSort,
  onSelectProduct,
  onWatchProduct,
  onOpenStoreOnMap,
}: HomeCatalogPanelProps) {
  const groupedProducts = React.useMemo(() => {
    const groups = new Map<
      string,
      { name: string; products: MarketProduct[]; sortKey: number }
    >();

    for (const product of products) {
      const id = product.best_store_id || "unlinked-store";
      const name = product.best_store_name || "Other stores";
      const existing = groups.get(id);

      const sortKey =
        sortMode === "biggestDrop"
          ? byDrop(product)
          : product.best_store_price !== null
            ? product.best_store_price
            : Number.MAX_VALUE;

      if (existing) {
        existing.products.push(product);
      } else {
        groups.set(id, {
          name,
          sortKey,
          products: [product],
        });
      }
    }

    return Array.from(groups.entries())
      .map(([storeId, group]) => {
        const sorted = group.products.slice().sort((a, b) => {
          if (sortMode === "biggestDrop") {
            const aDrop = a.price_delta_percent;
            const bDrop = b.price_delta_percent;
            const aStable = aDrop === null ? Number.MAX_VALUE : aDrop;
            const bStable = bDrop === null ? Number.MAX_VALUE : bDrop;
            if (aStable === bStable) {
              return byPrice(a) - byPrice(b);
            }
            return aStable - bStable;
          }

          return byPrice(a) - byPrice(b);
        });

        return {
          storeId,
          name: group.name,
          products: sorted,
          sortKey: group.sortKey,
        };
      })
      .sort((left, right) => {
        if (left.sortKey === right.sortKey) {
          return left.name.localeCompare(right.name);
        }

        if (sortMode === "biggestDrop") {
          return left.sortKey - right.sortKey;
        }

            return left.sortKey - right.sortKey;
        });
  }, [products, sortMode]);

  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Deals</Text>
      <View style={st.dealHeaderRow}>
        <Text style={st.sectionSub}>Next update in 4h · All Deals</Text>
        <Text style={st.badge}>Live</Text>
      </View>

      {summaryCards.length > 0 ? (
        <View style={st.summaryRowWrap}>
          {summaryCards.map((card) => (
            <View key={card.id} style={st.summaryCard}>
              <Text style={st.summaryLabel}>
                {card.label}
              </Text>
              <Text style={st.summaryValue}>{card.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {storeFilterName ? (
        <View style={st.dealFilterRow}>
          <Text style={st.sectionSub}>Showing deals for {storeFilterName}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClearStoreFilter}
            style={st.inlinePill}
          >
            <Text style={st.inlinePillText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={st.dealSearchRow}>
        <View style={st.searchAndSortRow}>
          <View style={[st.searchCard, st.homeSearchCard]}>
            <TextInput
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Search products"
              placeholderTextColor="#7F9068"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={st.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.sortOptionsWrap}
            style={st.sortOptionsScroll}
          >
            {SORT_OPTIONS.map((option) => {
              const active = sortMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => onChangeSort(option.value)}
                  style={[st.inlinePill, st.sortPill, active && st.sortPillActive]}
                >
                  <Text style={[st.inlinePillText, active && st.sortPillTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.categoryRow}
        >
          {[
            "All",
            ...categories,
          ].map((categoryOption) => {
            const active = category === categoryOption;
            return (
              <Pressable
                key={categoryOption}
                accessibilityRole="button"
                onPress={() => onChangeCategory(categoryOption)}
                style={[st.categoryChip, active && st.categoryChipActive]}
              >
                <Text style={[st.categoryChipText, active && st.categoryChipTextActive]}>
                  {categoryOption}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {actionMessage ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{actionMessage}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>
            {storeFilterName
              ? "No deals found for this store."
              : "No products found for this filter."}
          </Text>
        </View>
      ) : (
        groupedProducts.map((group) => (
          <View key={group.storeId} style={st.dealSectionCard}>
            <View style={st.dealSectionHeader}>
              <Text style={st.itemName}>{group.name}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (group.storeId !== "unlinked-store") {
                    onOpenStoreOnMap(group.storeId, group.name);
                  }
                }}
                disabled={group.storeId === "unlinked-store"}
                style={[
                  st.inlinePill,
                  group.storeId === "unlinked-store" && st.inlinePillDisabled,
                ]}
              >
                <Text
                  style={[
                    st.inlinePillText,
                    group.storeId === "unlinked-store" && st.inlinePillTextDisabled,
                  ]}
                >
                  Open map
                </Text>
              </Pressable>
            </View>

            <View style={st.dealFeedGrid}>
              {group.products.map((product) => {
                const targetPrice = targetPriceByProduct.get(product.id) ?? null;
                const belowTarget =
                  targetPrice !== null &&
                  product.current_price !== null &&
                  product.current_price <= targetPrice;
                const isDeal =
                  (product.price_delta_percent !== null &&
                    product.price_delta !== null &&
                    product.price_delta < 0) ||
                  belowTarget;
                const isWatching = watchedProductIds.has(product.id);
                const active = selectedProduct?.id === product.id;
                const unitLabel = product.unit ? ` / ${product.unit}` : "";
                const changeLabel = formatTrendLabel(product);
                const previous = product.previous_price;
                const targetGap =
                  targetPrice !== null && product.current_price !== null
                    ? product.current_price - targetPrice
                    : null;
                const targetStatus =
                  targetPrice !== null && targetGap !== null
                    ? targetGap <= 0
                      ? `Target beat by ${money.format(Math.abs(targetGap))}`
                      : `${money.format(targetGap)} above target`
                    : null;

                return (
                  <Pressable
                    key={product.id}
                    accessibilityRole="button"
                    onPress={() => onSelectProduct(product.id)}
                    style={[st.dealCard, active && st.dealFeedItemActive]}
                  >
                    {product.thumbnail_url ? (
                      <Image
                        source={{ uri: product.thumbnail_url }}
                        style={st.dealCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={st.dealCardImagePlaceholder}>
                        <Text style={st.productThumbPlaceholderText}>IMG</Text>
                      </View>
                    )}

                    <View style={st.dealCardBody}>
                      <Text style={st.itemName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={st.dealPrice} numberOfLines={1}>
                        {formatPriceLabel(product.current_price)}{unitLabel}
                      </Text>
                      <Text style={st.itemMeta} numberOfLines={1}>
                        {product.category} {product.best_store_area ? ` · ${product.best_store_area}` : ""}
                      </Text>
                      <View style={st.tagRow}>
                        {isDeal ? <Text style={st.tag}>Deal</Text> : null}
                        {changeLabel ? (
                          <Text style={st.tag}>{changeLabel}</Text>
                        ) : null}
                        {belowTarget ? <Text style={st.tag}>Target hit</Text> : null}
                        {previous !== null && product.price_delta_percent !== null && product.price_delta_percent < 0 ? (
                          <Text style={st.tag}>
                            Best {product.best_store_name ?? "store"}
                          </Text>
                        ) : null}
                        {isWatching ? <Text style={st.tag}>Watching</Text> : null}
                        {product.best_store_name ? (
                          <Text style={st.tag}>
                            Best at {product.best_store_name}
                          </Text>
                        ) : null}
                      </View>

                      <View style={st.dealCardBottomRow}>
                        <View>
                          <Text style={st.itemMeta}>
                            Last: {previous !== null ? money.format(previous) : "N/A"}
                          </Text>
                          {targetStatus ? (
                            <Text
                              style={[
                                st.itemMeta,
                                targetGap !== null && targetGap <= 0
                                  ? st.targetBadge
                                  : null,
                              ]}
                            >
                              {targetStatus}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          onPress={(event) => {
                            event.stopPropagation();
                            onWatchProduct(product.id);
                          }}
                          style={[
                            st.productActionBtn,
                            st.productActionPrimary,
                            isWatching && st.productActionSecondary,
                          ]}
                        >
                          <Text
                            style={[
                              st.productActionPrimaryText,
                              isWatching && st.productActionSecondaryText,
                            ]}
                          >
                            {isWatching ? "Watching" : "Watch"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}
