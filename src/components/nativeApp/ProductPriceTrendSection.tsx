import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import {
  money,
  type PreviousPriceRow,
  type PriceChart,
} from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type ProductPriceTrendSectionProps = {
  chart: PriceChart | null;
  previousPriceRows: PreviousPriceRow[];
  historyLoading: boolean;
};

export function ProductPriceTrendSection({
  chart,
  previousPriceRows,
  historyLoading,
}: ProductPriceTrendSectionProps) {
  const lowestStoresByPeriod = chart ? [...chart.points].reverse() : [];
  const [expandedPeriod, setExpandedPeriod] = React.useState<string | null>(null);

  React.useEffect(() => {
    setExpandedPeriod(null);
  }, [chart?.points.at(-1)?.id]);

  return (
    <View style={st.productTrendCard}>
      <Text style={st.productTrendHeading}>Lowest price trend</Text>
      {historyLoading ? (
        <Text style={st.itemMeta}>Loading lowest price trend...</Text>
      ) : !chart ? (
        <Text style={st.itemMeta}>
          No price history yet. We will chart it after the next weekly update.
        </Text>
      ) : (
        <>
          <Text style={st.itemMeta}>
            {chart.points.length === 1
              ? "1 sale period tracked. Another period is needed to show a trend."
              : `Lowest ${money.format(chart.min)} / Highest ${money.format(chart.max)} across sale periods`}
          </Text>
          <View style={st.chartWrap}>
            <Svg width={chart.width} height={chart.height}>
              <Line
                x1={14}
                y1={chart.height - 14}
                x2={chart.width - 14}
                y2={chart.height - 14}
                stroke={C.line}
                strokeWidth={1}
              />
              <Line
                x1={14}
                y1={14}
                x2={14}
                y2={chart.height - 14}
                stroke={C.line}
                strokeWidth={1}
              />
              {chart.points.length > 1 ? (
                <Polyline
                  points={chart.polyline}
                  fill="none"
                  stroke={C.primary}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {chart.points.map((point, index) => (
                <Circle
                  key={`${point.observed_at}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={3.7}
                  fill={
                    index === chart.points.length - 1
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
              {chart.points[0].label}: {money.format(chart.start)}
            </Text>
            <Text style={st.chartMetaText}>
              {chart.points.length > 1
                ? `${chart.points.at(-1)?.label}: ${money.format(chart.end)}`
                : "First tracked sale"}
            </Text>
          </View>

          <Text style={st.historyTitle}>Store prices by sale period</Text>
          <Text style={st.itemMeta}>
            Lowest price shown first. Tap a period to compare stores.
          </Text>
          {lowestStoresByPeriod.map((point, index) => {
            const periodKey = `${point.observed_at}\u0000${point.sale_end_at ?? "open"}`;
            const storePrices = point.store_prices ?? [];
            const hasStoreComparison = storePrices.length > 1;
            const expanded = expandedPeriod === periodKey;
            return (
              <View
                key={`lowest-store-${point.observed_at}-${point.id ?? index}`}
                style={st.periodHistoryGroup}
              >
                <Pressable
                  accessibilityRole={hasStoreComparison ? "button" : undefined}
                  accessibilityState={
                    hasStoreComparison ? { expanded } : undefined
                  }
                  onPress={
                    hasStoreComparison
                      ? () =>
                          setExpandedPeriod((current) =>
                            current === periodKey ? null : periodKey,
                          )
                      : undefined
                  }
                  style={[st.periodLowestRow, index === 0 && st.bestStoreRow]}
                >
                  <View style={st.periodLowestMain}>
                    <View style={st.periodLowestLabelRow}>
                      <Text style={st.historyLabel}>{point.label}</Text>
                      {index === 0 ? (
                        <Text style={st.periodLatestBadge}>Latest</Text>
                      ) : null}
                    </View>
                    <Text style={st.periodLowestStore} numberOfLines={1}>
                      {point.store_name}
                      {point.store_area ? ` · ${point.store_area}` : ""}
                    </Text>
                  </View>
                  <View style={st.periodLowestPriceBlock}>
                    <Text style={st.historyPrice}>
                      {money.format(point.value)}
                    </Text>
                    <Text style={st.storeCompareLowest}>
                      {hasStoreComparison
                        ? `${expanded ? "Hide" : "View"} ${storePrices.length} stores ${expanded ? "▴" : "▾"}`
                        : "Lowest"}
                    </Text>
                  </View>
                </Pressable>
                {expanded ? (
                  <View style={st.periodStoreList}>
                    {storePrices.map((storePrice, storeIndex) => (
                      <View
                        key={`${storePrice.store_id ?? storePrice.store_name}-${storePrice.id}`}
                        style={st.periodStoreRow}
                      >
                        <View style={st.periodStoreMain}>
                          <Text style={st.periodStoreName} numberOfLines={1}>
                            {storePrice.store_name}
                            {storePrice.store_area ? ` · ${storePrice.store_area}` : ""}
                          </Text>
                          {storeIndex === 0 ? (
                            <Text style={st.storeCompareLowest}>Lowest</Text>
                          ) : null}
                        </View>
                        <Text style={st.historyPrice}>
                          {money.format(storePrice.price)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
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
    </View>
  );
}
