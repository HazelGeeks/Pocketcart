import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import type { MarketProduct, MarketStorePrice } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  money,
  type PreviousPriceRow,
  type PriceChart,
} from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { formatSignedPercent } from "./priceDisplay";

type ProductDetailPanelProps = {
  product: MarketProduct | null;
  chart: PriceChart | null;
  previousPriceRows: PreviousPriceRow[];
  actionMessage: string | null;
  historyMessage: string | null;
  historyLoading: boolean;
  storePrices: MarketStorePrice[];
  storePricesLoading: boolean;
  addSubmitting: boolean;
  onBack: () => void;
  onAddToWatchlist: () => void;
  onOpenStoreOnMap?: (storeId: string, storeName?: string) => void;
};

type StorePriceDisplayGroup = {
  id: string;
  storeLabel: string;
  areaLabel: string | null;
  branchCount: number;
  price: number;
  observed_at: string;
  price_delta_percent: number | null;
  comparison_label: string;
};

function priceKey(value: number | null): string {
  return value === null ? "none" : Math.round(value * 100).toString();
}

function percentKey(value: number | null): string {
  return value === null ? "none" : value.toFixed(4);
}

function splitStoreDisplayName(row: MarketStorePrice): {
  brand: string;
  branch: string | null;
} {
  const [brandPart, ...branchParts] = row.store_name.split(" - ");
  const brand = brandPart.trim() || row.store_name.trim() || "Unknown store";
  const branchFromName = branchParts.join(" - ").trim();
  const branch = branchFromName || row.store_area?.trim() || null;
  return { brand, branch };
}

function buildStorePriceGroups(rows: MarketStorePrice[]): StorePriceDisplayGroup[] {
  const groups = new Map<
    string,
    {
      brand: string;
      rows: MarketStorePrice[];
      branches: string[];
    }
  >();

  for (const row of rows) {
    const { brand, branch } = splitStoreDisplayName(row);
    const key = [
      brand.toLowerCase(),
      priceKey(row.price),
      row.comparison_session_current ?? "current",
      row.comparison_session_previous ?? "previous",
      priceKey(row.previous_price),
      priceKey(row.price_delta),
      percentKey(row.price_delta_percent),
    ].join("|");
    const group = groups.get(key) ?? {
      brand,
      rows: [],
      branches: [],
    };
    group.rows.push(row);
    if (branch && !group.branches.includes(branch)) {
      group.branches.push(branch);
    }
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const [sourceRow] = group.rows;
      const firstBranch = group.branches[0] ?? sourceRow.store_area ?? null;
      const areaLabel =
        group.rows.length > 1
          ? firstBranch
            ? `${firstBranch} + ${group.rows.length - 1} more`
            : `${group.rows.length} branches`
          : firstBranch;

      return {
        id: group.rows.map((row) => row.id).join("|"),
        storeLabel: group.rows.length > 1 ? group.brand : sourceRow.store_name,
        areaLabel,
        branchCount: group.rows.length,
        price: sourceRow.price,
        observed_at: sourceRow.observed_at,
        price_delta_percent: sourceRow.price_delta_percent,
        comparison_label: sourceRow.comparison_label,
      };
    })
    .sort((a, b) => a.price - b.price || a.storeLabel.localeCompare(b.storeLabel));
}

export function ProductDetailPanel({
  product,
  chart,
  previousPriceRows,
  actionMessage,
  historyMessage,
  historyLoading,
  storePrices,
  storePricesLoading,
  addSubmitting,
  onBack,
  onAddToWatchlist,
  onOpenStoreOnMap,
}: ProductDetailPanelProps) {
  const currentPrice = product?.current_price ?? null;
  const previousPrice = product?.previous_price ?? null;
  const priceDelta = product?.price_delta ?? null;
  const priceDeltaPercent = product?.price_delta_percent ?? null;
  const isRising = priceDelta !== null && priceDelta > 0;
  const isDropping = priceDelta !== null && priceDelta < 0;
  const chartWidth = 320;
  const chartHeight = 160;
  const storePriceGroups = React.useMemo(
    () => buildStorePriceGroups(storePrices),
    [storePrices],
  );

  const fallbackChart: PriceChart | null = React.useMemo(() => {
    if (chart) return null;
    const fallbackValue = currentPrice ?? 0;
    const width = chartWidth;
    const height = chartHeight;
    const padding = 14;
    const y = height / 2;
    const points = [
      {
        x: padding,
        y,
        value: fallbackValue,
        label: "Now",
        observed_at: new Date().toISOString(),
      },
      {
        x: width - padding,
        y,
        value: fallbackValue,
        label: "Now",
        observed_at: new Date().toISOString(),
      },
    ];

    return {
      points,
      polyline: `${points[0].x},${points[0].y} ${points[1].x},${points[1].y}`,
      width,
      height,
      min: fallbackValue,
      max: fallbackValue,
      start: fallbackValue,
      end: fallbackValue,
    };
  }, [chart, currentPrice]);
  const displayChart = chart ?? fallbackChart;

  const distanceToPrevious = previousPrice === null || currentPrice === null ? null : currentPrice - previousPrice;
  const hasTrend = priceDelta !== null && previousPrice !== null && currentPrice !== null;
  const hasPreviousData = previousPrice !== null && currentPrice !== null;
  const decisionText = hasPreviousData
    ? isDropping
      ? `${money.format(Math.abs(distanceToPrevious ?? 0))} cheaper than the last sale`
      : isRising
        ? `${money.format(distanceToPrevious ?? 0)} higher than the last sale`
        : "Same as the last sale"
    : "No earlier sale price to compare yet.";
  const bestStoreId = product?.best_store_id ?? null;
  const bestStoreName = product?.best_store_name ?? null;
  const canOpenStore = bestStoreId !== null && onOpenStoreOnMap !== undefined;
  const bestStoreArea = product?.best_store_area ?? "TBD";
  const storeLine = bestStoreName
    ? `${bestStoreName}${bestStoreArea ? ` · ${bestStoreArea}` : ""}`
    : "Store not linked yet";
  const decisionLabel = hasTrend
    ? isRising
      ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} from the last sale (up)`
      : isDropping
        ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} from the last sale (down)`
        : "Price trend: same as the last sale"
    : "Price trend data is not enough yet.";

  return (
    <View style={st.sectionStack}>
      <View style={st.detailActionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[st.detailNavBtn, st.detailActionBtn]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18 9 12l6-6"
              stroke={C.primaryDeep}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={st.detailNavText}>Home</Text>
        </Pressable>
        {canOpenStore ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenStoreOnMap?.(bestStoreId!, bestStoreName ?? undefined)}
            style={[st.detailNavBtn, st.detailNavBtnAccent, st.detailActionBtn]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11Z"
                stroke={C.primaryDeep}
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx={12} cy={10} r={2} stroke={C.primaryDeep} strokeWidth={2.1} />
            </Svg>
            <Text style={st.detailNavText}>Store map</Text>
          </Pressable>
        ) : null}
      </View>

      {product ? (
        <View style={st.productDetailStack}>
          <View style={st.productHeroCard}>
            {product.thumbnail_url ? (
              <Image
                source={{ uri: product.thumbnail_url }}
                style={st.productHeroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={st.productHeroPlaceholder}>
                <Text style={st.productHeroPlaceholderText}>
                  {product.category || "Product"}
                </Text>
                <Text style={st.productHeroPlaceholderSub}>Image ready</Text>
              </View>
            )}

            <View style={st.productHeroBody}>
              <View style={st.productHeroTitleRow}>
                <View style={st.productHeroTitleBlock}>
                  <Text style={st.productHeroName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.english_name ? (
                    <Text style={st.itemMeta} numberOfLines={1}>
                      {product.english_name}
                    </Text>
                  ) : null}
                </View>
                <Text style={st.productHeroDecision}>
                  {hasTrend ? (isDropping ? "Buy" : isRising ? "Wait" : "Monitor") : "Track"}
                </Text>
              </View>

              <Text style={st.productHeroStore} numberOfLines={1}>
                {storeLine}
              </Text>

              <View style={st.productHeroPriceRow}>
                <View>
                  <Text style={st.summaryLabel}>Current price</Text>
                  <Text style={st.productHeroPrice}>
                    {currentPrice !== null ? money.format(currentPrice) : "-"}
                  </Text>
                  {product.unit ? <Text style={st.itemMeta}>per {product.unit}</Text> : null}
                </View>
                <View style={st.productHeroChangeCard}>
                  <Text style={st.summaryLabel}>Change</Text>
                  <Text
                    style={[
                      st.productHeroChange,
                      isRising ? st.historyDiffUp : isDropping ? st.historyDiffDown : undefined,
                    ]}
                  >
                    {priceDelta !== null && priceDeltaPercent !== null
                      ? formatSignedPercent(priceDeltaPercent)
                      : "-"}
                  </Text>
                  <Text style={st.itemMeta} numberOfLines={1}>
                    vs last sale
                  </Text>
                </View>
              </View>

              <Text style={st.productDecisionText}>{decisionText}</Text>

              <View style={st.productHeroActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onAddToWatchlist}
                  style={[st.watchlistCtaBtn, st.productHeroPrimaryAction]}
                  disabled={addSubmitting}
                >
                  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="m12 4 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L12 4Z"
                      stroke={C.white}
                      strokeWidth={2.1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={st.watchlistCtaText}>
                    {addSubmitting ? "Adding..." : "Add to Watchlist"}
                  </Text>
                </Pressable>
                {canOpenStore ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onOpenStoreOnMap?.(bestStoreId!, bestStoreName ?? undefined)}
                    style={[st.watchlistSecondaryBtn, st.productHeroSecondaryAction]}
                  >
                    <Text style={st.watchlistSecondaryText}>Store</Text>
                  </Pressable>
                ) : null}
              </View>
              <Text style={st.watchlistCtaHelp}>
                Save this product to your watchlist and get sale alerts when the price drops.
              </Text>
            </View>
          </View>

          {actionMessage ? <Text style={st.itemMeta}>{actionMessage}</Text> : null}
          {historyMessage ? <Text style={st.itemMeta}>{historyMessage}</Text> : null}

          <View style={st.productInfoGrid}>
            <View style={st.productInfoCell}>
              <Text style={st.summaryLabel}>Previous</Text>
              <Text
                style={[
                  st.summaryValue,
                  st.summaryValueSmall,
                ]}
              >
                {previousPrice !== null ? money.format(previousPrice) : "-"}
              </Text>
            </View>
            <View style={st.productInfoCell}>
              <Text style={st.summaryLabel}>Category</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>{product.category || "-"}</Text>
            </View>
            <View style={st.productInfoCell}>
              <Text style={st.summaryLabel}>Unit</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>{product.unit || "-"}</Text>
            </View>
            <View style={st.productInfoCell}>
              <Text style={st.summaryLabel}>Best store</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>
                {product.best_store_name ?? "Need store match"}
              </Text>
            </View>
          </View>

          <View style={st.tagRow}>
            <Text style={st.tag}>{decisionLabel}</Text>
            {priceDelta !== null && priceDeltaPercent !== null ? (
              <Text style={st.tag}>
                {priceDeltaPercent > 0 ? "Price up " : priceDeltaPercent < 0 ? "Price down " : "Flat "}
                {formatSignedPercent(priceDeltaPercent)}
              </Text>
            ) : null}
            {product.best_store_name ? <Text style={st.tag}>Lowest store: {product.best_store_name}</Text> : null}
          </View>

          <Text style={st.historyTitle}>Price Trend</Text>
          {historyLoading ? (
            <Text style={st.itemMeta}>Loading price trend...</Text>
          ) : !displayChart ? (
            <Text style={st.itemMeta}>No price history yet for this product.</Text>
          ) : (
            <>
              <Text style={st.itemMeta}>
                {chart
                  ? `Lowest ${money.format(chart.min)} / Highest ${money.format(chart.max)}`
                  : "Waiting for historical data. Showing current price baseline."}
              </Text>
              <View style={st.chartWrap}>
                <Svg width={displayChart.width} height={displayChart.height}>
                  <Line
                    x1={14}
                    y1={displayChart.height - 14}
                    x2={displayChart.width - 14}
                    y2={displayChart.height - 14}
                    stroke={C.line}
                    strokeWidth={1}
                  />
                  <Line
                    x1={14}
                    y1={14}
                    x2={14}
                    y2={displayChart.height - 14}
                    stroke={C.line}
                    strokeWidth={1}
                  />
                  <Polyline
                    points={displayChart.polyline}
                    fill="none"
                    stroke={C.primary}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {displayChart.points.map((point, index) => (
                    <Circle
                      key={`${point.observed_at}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={3.7}
                      fill={
                        index === displayChart.points.length - 1
                          ? C.primaryDeep
                          : C.white
                      }
                      stroke={C.primary}
                      strokeWidth={2}
                    />
                  ))}
                </Svg>
              </View>
              <View style={st.chartMetaRow}>
                <Text style={st.chartMetaText}>
                  {displayChart.points[0].label}: {money.format(displayChart.start)}
                </Text>
                <Text style={st.chartMetaText}>
                  {displayChart.points[displayChart.points.length - 1].label}: {money.format(displayChart.end)}
                </Text>
              </View>
            </>
          )}

          <Text style={st.historyTitle}>Previous prices</Text>
          {previousPriceRows.length === 0 ? (
            <Text style={st.itemMeta}>No previous price points yet.</Text>
          ) : (
            previousPriceRows.map((row) => (
              <View key={row.key} style={st.historyRow}>
                <Text style={st.historyLabel}>{row.label}</Text>
                <Text style={st.historyPrice}>{money.format(row.price)}</Text>
                <Text
                  style={[
                    st.historyDiff,
                    row.diff > 0 ? st.historyDiffUp : st.historyDiffDown,
                  ]}
                >
                  {row.diff > 0 ? "+" : ""}
                  {money.format(row.diff)}
                </Text>
              </View>
            ))
          )}

          <Text style={st.historyTitle}>Compare stores</Text>
          {storePricesLoading ? (
            <Text style={st.itemMeta}>Loading store prices...</Text>
          ) : storePriceGroups.length === 0 ? (
            <Text style={st.itemMeta}>No current store prices yet.</Text>
          ) : (
            <>
              <StorePriceBarChart rows={storePriceGroups} />
              {storePriceGroups.map((row, index) => (
                <View
                  key={row.id}
                  style={[st.storeCompareRow, index === 0 && st.bestStoreRow]}
                >
                  <View style={st.storeCompareTopRow}>
                    <View style={st.storeCompareTitleBlock}>
                      <Text style={st.storeCompareName} numberOfLines={1}>
                        {row.storeLabel}
                      </Text>
                      <Text style={st.storeCompareBranchText} numberOfLines={1}>
                        {row.branchCount > 1
                          ? `${row.branchCount} branches${row.areaLabel ? ` · ${row.areaLabel}` : ""}`
                          : row.areaLabel || "Single branch"}
                      </Text>
                    </View>
                    <View style={st.storeComparePriceBlock}>
                      <Text style={st.historyPrice}>{money.format(row.price)}</Text>
                      {index === 0 ? <Text style={st.storeCompareLowest}>Lowest</Text> : null}
                    </View>
                  </View>

                  <View style={st.storeCompareMetaRow}>
                    <Text style={st.itemMeta} numberOfLines={1}>
                      {row.comparison_label}
                    </Text>
                    {row.price_delta_percent !== null ? (
                      <Text style={st.storeCompareTrendText} numberOfLines={1}>
                        {row.price_delta_percent > 0 ? "Up " : row.price_delta_percent < 0 ? "Down " : "Flat "}
                        {formatSignedPercent(row.price_delta_percent)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      ) : (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Product not found. Go back and choose again.</Text>
        </View>
      )}
    </View>
  );
}

function StorePriceBarChart({ rows }: { rows: StorePriceDisplayGroup[] }) {
  const source = rows.slice(0, 5);
  const maxPrice = Math.max(...source.map((row) => row.price), 1);

  return (
    <View style={st.storeChartCard}>
      {source.map((row, index) => {
        const widthPercent = Math.max(16, (row.price / maxPrice) * 100);
        return (
          <View key={row.id} style={st.storeChartRow}>
            <View style={st.storeChartLabelWrap}>
              <Text style={st.storeChartLabel} numberOfLines={1}>
                {row.storeLabel}
              </Text>
              {row.branchCount > 1 ? <Text style={st.storeChartBest}>{row.branchCount} branches</Text> : null}
              {index === 0 ? <Text style={st.storeChartBest}>Lowest</Text> : null}
            </View>
            <View style={st.storeChartTrack}>
              <View
                style={[
                  st.storeChartBar,
                  index === 0 && st.storeChartBarBest,
                  { width: `${widthPercent}%` },
                ]}
              />
            </View>
            <Text style={st.storeChartPrice}>{money.format(row.price)}</Text>
          </View>
        );
      })}
    </View>
  );
}
