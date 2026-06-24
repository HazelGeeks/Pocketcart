import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
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
  targetPrice: string;
  addSubmitting: boolean;
  onBack: () => void;
  onChangeTargetPrice: (value: string) => void;
  onAddToWatchlist: () => void;
  onOpenStoreOnMap?: (storeId: string, storeName?: string) => void;
};

export function ProductDetailPanel({
  product,
  chart,
  previousPriceRows,
  actionMessage,
  historyMessage,
  historyLoading,
  storePrices,
  storePricesLoading,
  targetPrice,
  addSubmitting,
  onBack,
  onChangeTargetPrice,
  onAddToWatchlist,
  onOpenStoreOnMap,
}: ProductDetailPanelProps) {
  const parsedTarget = Number(targetPrice);
  const hasTarget = Number.isFinite(parsedTarget) && targetPrice.trim().length > 0;
  const currentPrice = product?.current_price ?? null;
  const previousPrice = product?.previous_price ?? null;
  const priceDelta = product?.price_delta ?? null;
  const priceDeltaPercent = product?.price_delta_percent ?? null;
  const isRising = priceDelta !== null && priceDelta > 0;
  const isFlat = priceDelta === 0;
  const isDropping = priceDelta !== null && priceDelta < 0;
  const chartWidth = 320;
  const chartHeight = 160;

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

  const belowTarget =
    hasTarget &&
    currentPrice !== null &&
    product !== null &&
    currentPrice <= parsedTarget;

  const distanceToTarget =
    hasTarget && currentPrice !== null
      ? currentPrice - parsedTarget
      : null;
  const nearTarget =
    hasTarget && currentPrice !== null
      ? distanceToTarget !== null && Math.abs(distanceToTarget) <= 0.5 * parsedTarget
      : false;
  const distanceToPrevious = previousPrice === null || currentPrice === null ? null : currentPrice - previousPrice;
  const hasTrend = priceDelta !== null && previousPrice !== null && currentPrice !== null;
  const hasPreviousData = previousPrice !== null && currentPrice !== null;
  const decisionText = hasPreviousData
    ? isDropping
      ? `${money.format(Math.abs(distanceToPrevious ?? 0))} cheaper than last cycle`
      : isRising
        ? `${money.format(distanceToPrevious ?? 0)} higher than last cycle`
        : "Flat vs last cycle"
    : "Need previous cycle price to compare.";
  const bestStoreId = product?.best_store_id ?? null;
  const bestStoreName = product?.best_store_name ?? null;
  const canOpenStore = bestStoreId !== null && onOpenStoreOnMap !== undefined;
  const bestStoreArea = product?.best_store_area ?? "TBD";
  const decisionLabel = hasTrend
    ? isRising
      ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} vs previous cycle (up)`
      : isDropping
        ? `Price trend: ${formatSignedPercent(priceDeltaPercent ?? 0)} vs previous cycle (down)`
        : "Price trend: stable vs previous cycle"
    : "Price trend data is not enough yet.";
  const targetLabel = hasTarget
    ? belowTarget
      ? `This is ${money.format(Math.abs(distanceToTarget ?? 0))} under your target.`
      : `Need ${money.format(distanceToTarget ?? 0)} to hit your target.`
    : "No target set.";

  return (
    <View style={st.sectionStack}>
      <View style={st.detailActionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
        >
          <Text style={st.authBtnSecondaryText}>Back to Home</Text>
        </Pressable>
        {canOpenStore ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenStoreOnMap?.(bestStoreId!, bestStoreName ?? undefined)}
            style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
          >
            <Text style={st.authBtnSecondaryText}>Open store</Text>
          </Pressable>
        ) : null}
      </View>

      {product ? (
        <View style={st.rowCard}>
          <Text style={st.itemName}>{product.name}</Text>
          <Text style={st.sectionSub}>
            {product.english_name ?? "Grocery price decision panel"}
          </Text>
          <View style={st.dealSummaryGrid}>
            <View style={st.dealSummaryCell}>
              <Text style={st.summaryLabel}>Decision</Text>
              <Text style={st.summaryValue}>
                {hasTrend ? (isDropping ? "Buy" : isRising ? "Wait" : "Watch") : "Track"}
              </Text>
            </View>
            <View style={st.dealSummaryCell}>
              <Text style={st.summaryLabel}>Current</Text>
              <Text style={st.summaryValue}>
                {currentPrice !== null ? money.format(currentPrice) : "-"}
              </Text>
            </View>
            <View style={st.dealSummaryCell}>
              <Text style={st.summaryLabel}>Change</Text>
              <Text
                style={[
                  st.summaryValue,
                  isRising ? st.historyDiffUp : isDropping ? st.historyDiffDown : undefined,
                ]}
              >
                {priceDelta !== null && priceDeltaPercent !== null
                  ? `${formatSignedPercent(priceDeltaPercent)}`
                  : "-"}
              </Text>
            </View>
            <View style={st.dealSummaryCell}>
              <Text style={st.summaryLabel}>Store</Text>
              <Text style={st.summaryValueSmall}>{bestStoreName ?? "-"}</Text>
              <Text style={st.itemMeta}>{bestStoreArea}</Text>
            </View>
          </View>

          <View style={st.watchTargetSummary}>
            <Text style={st.itemName}>Price judgment</Text>
            <Text style={st.itemMeta}>{decisionText}</Text>
            <Text style={st.itemMeta}>{decisionLabel}</Text>
            <Text style={st.itemMeta}>{targetLabel}</Text>
            {hasTarget ? (
              <Text style={[st.tag, nearTarget ? st.targetBadge : st.tag]}>
                {belowTarget ? "Target reached" : nearTarget ? "Close to target" : "Target active"}
              </Text>
            ) : null}
          </View>

          {actionMessage ? <Text style={st.itemMeta}>{actionMessage}</Text> : null}
          {historyMessage ? <Text style={st.itemMeta}>{historyMessage}</Text> : null}

          <View style={st.priceJudgmentGrid}>
            <View style={st.priceJudgmentCell}>
              <Text style={st.summaryLabel}>Current Price</Text>
              <Text style={st.summaryValue}>
                {currentPrice !== null ? money.format(currentPrice) : "-"}
              </Text>
            </View>
            <View style={st.priceJudgmentCell}>
              <Text style={st.summaryLabel}>Previous</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>
                {previousPrice !== null ? money.format(previousPrice) : "-"}
              </Text>
            </View>
            <View style={st.priceJudgmentCell}>
              <Text style={st.summaryLabel}>Unit</Text>
              <Text style={st.summaryValue}>{product.unit || "-"}</Text>
            </View>
            <View style={st.priceJudgmentCell}>
              <Text style={st.summaryLabel}>Store</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>
                {product.best_store_name ?? "Need store match"}
              </Text>
            </View>
            <View style={st.priceJudgmentCell}>
              <Text style={st.summaryLabel}>Store area</Text>
              <Text style={[st.summaryValue, st.summaryValueSmall]}>
                {product.best_store_area || "TBD"}
              </Text>
            </View>
          </View>

          <View style={st.tagRow}>
            {priceDelta !== null && priceDeltaPercent !== null ? (
              <Text style={st.tag}>
                {priceDeltaPercent > 0 ? "Price up " : priceDeltaPercent < 0 ? "Price down " : "Flat "}
                {formatSignedPercent(priceDeltaPercent)}
              </Text>
            ) : null}
            {product.best_store_name ? <Text style={st.tag}>Best store: {product.best_store_name}</Text> : null}
            {belowTarget ? <Text style={st.tag}>Below target</Text> : null}
          </View>

          <View style={st.historyRow}>
            <Text style={st.historyLabel}>Price vs previous cycle</Text>
            <Text style={st.historyPrice}>
              {distanceToPrevious === null ? "-" : `${distanceToPrevious > 0 ? "+" : ""}${money.format(distanceToPrevious)}`}
            </Text>
            <Text style={st.itemMeta}>
              {isRising ? "Upward" : isDropping ? "Downward" : isFlat ? "Flat" : "-"}
            </Text>
          </View>

          <Text style={st.historyTitle}>Target Price</Text>
          <View style={st.targetRow}>
            <TextInput
              value={targetPrice}
              onChangeText={onChangeTargetPrice}
              placeholder="Set target price"
              placeholderTextColor={C.textMuted}
              keyboardType="decimal-pad"
              autoCapitalize="none"
              autoCorrect={false}
              style={[st.formInput, st.targetInput]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onAddToWatchlist}
              style={[st.authBtn, st.authBtnPrimary, st.targetSaveBtn]}
              disabled={addSubmitting}
            >
              <Text style={st.authBtnPrimaryText}>
                {addSubmitting ? "Saving..." : "Watch"}
              </Text>
            </Pressable>
          </View>
          {hasTarget ? (
            <Text style={belowTarget ? st.dealText : st.itemMeta}>
              {belowTarget
                ? `Current price is ${money.format(Math.abs(distanceToTarget ?? 0))} below target.`
                : currentPrice !== null
                  ? `Need ${money.format(distanceToTarget ?? 0)} off to hit target.`
                  : "Target price is set. Add latest price to compare."}
            </Text>
          ) : null}

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

        <Text style={st.historyTitle}>Store price comparison</Text>
          {storePricesLoading ? (
            <Text style={st.itemMeta}>Loading store prices...</Text>
          ) : storePrices.length === 0 ? (
            <Text style={st.itemMeta}>No store price data yet.</Text>
          ) : (
            <>
              <StorePriceBarChart rows={storePrices} />
              {storePrices.map((row, index) => (
                <View
                  key={row.id}
                  style={[st.historyRow, index === 0 && st.bestStoreRow]}
                >
                  <View style={st.watchRowMain}>
                    <Text style={st.historyLabel}>
                      {row.store_name}
                      {row.store_area ? ` · ${row.store_area}` : ""}
                    </Text>
                    <Text style={st.itemMeta}>{new Date(row.observed_at).toLocaleDateString("en-US")}</Text>
                  </View>
                  <View style={st.storeRowRight}>
                    <Text style={st.historyPrice}>{money.format(row.price)}</Text>
                    <Text style={st.itemMeta} numberOfLines={2}>
                      {row.comparison_label}
                    </Text>
                    {row.price_delta_percent !== null ? (
                      <Text style={st.itemMeta}>
                        {row.price_delta_percent > 0 ? "Up " : row.price_delta_percent < 0 ? "Down " : "Flat "}
                        {formatSignedPercent(row.price_delta_percent)} vs previous cycle
                      </Text>
                    ) : null}
                  </View>
                  {index === 0 ? <Text style={st.tag}>Best</Text> : null}
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

function StorePriceBarChart({ rows }: { rows: MarketStorePrice[] }) {
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
                {row.store_name}
              </Text>
              {index === 0 ? <Text style={st.storeChartBest}>Best</Text> : null}
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
