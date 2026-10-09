import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import useScopedState from "../../hooks/useScopedState";
import {
  fitPriceChart,
  money,
  nearestPriceChartPoint,
  type PriceChart,
} from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  selectLowestPriceByRetailer,
  retailerNameFromStoreDisplayName,
} from "../../utils/retailerPriceDisplay";

type ProductPriceTrendSectionProps = {
  chart: PriceChart | null;
  historyLoading: boolean;
};

export function ProductPriceTrendSection({ chart, historyLoading }: ProductPriceTrendSectionProps) {
  const [width, setWidth] = useState(0);
  const pressLocation = useRef<number | null>(null);
  const fitted = useMemo(
    () => (chart && width > 0 ? fitPriceChart(chart, width) : chart),
    [chart, width],
  );
  const scope = chart?.points.at(-1)?.id ?? "";
  const [selectedId, setSelectedId] = useScopedState<string | null>(scope, null);
  const selectedIndex = fitted
    ? Math.max(
        0,
        selectedId === null
          ? fitted.points.length - 1
          : fitted.points.findIndex((point) => point.id === selectedId),
      )
    : 0;
  const selected = fitted?.points[selectedIndex];
  const [expanded, setExpanded] = useScopedState(`${scope}:${selected?.id ?? ""}`, false);
  const latest = fitted?.points.at(-1);
  const previous = fitted?.points.at(-2);
  const delta = latest && previous ? Math.round((latest.value - previous.value) * 100) / 100 : null;
  const retailerPrices = selected ? selectLowestPriceByRetailer(selected.store_prices ?? []) : [];
  const lowestRetailer =
    retailerPrices[0]?.retailerName ?? retailerNameFromStoreDisplayName(selected?.store_name ?? "");
  const selectIndex = (index: number) => {
    if (!fitted) return;
    setSelectedId(fitted.points[Math.max(0, Math.min(fitted.points.length - 1, index))].id);
  };

  return (
    <View style={st.productTrendCard}>
      <View style={st.trendHeadingRow}>
        <Text style={st.trendHeading}>Price history</Text>
        {!historyLoading && chart ? (
          <Text style={st.trendCaption}>
            {chart.points.length} sale {chart.points.length === 1 ? "period" : "periods"} · CAD
          </Text>
        ) : null}
      </View>
      {historyLoading ? (
        <Text style={st.itemMeta}>Loading price history...</Text>
      ) : !fitted || !latest || !selected ? (
        <Text style={st.itemMeta}>
          No price history yet. We will chart it after the next weekly update.
        </Text>
      ) : (
        <>
          <View style={st.trendSummary}>
            <View style={st.trendSummaryPriceBlock}>
              <Text style={st.trendCaption}>Latest recorded low</Text>
              <Text style={st.trendPrice}>{money.format(latest.value)}</Text>
            </View>
            {delta !== null ? (
              <View style={st.trendChangeBlock}>
                <Text
                  style={[
                    st.trendChange,
                    delta > 0 ? st.historyDiffUp : delta < 0 ? st.historyDiffDown : undefined,
                  ]}
                >
                  {delta === 0
                    ? "Unchanged"
                    : `${delta < 0 ? "−" : "+"}${money.format(Math.abs(delta))}`}
                </Text>
                <Text style={st.trendChangeCaption}>vs. previous period</Text>
              </View>
            ) : null}
          </View>
          {fitted.points.length === 1 ? (
            <Text style={st.trendCaption}>
              First recorded sale. Another period is needed to show a trend.
            </Text>
          ) : null}
          <View
            style={st.trendChartWrap}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          >
            <Pressable
              accessibilityRole="adjustable"
              accessibilityLabel="Lowest price by sale period"
              accessibilityHint="Tap the chart to select a sale period, or use the previous and next period buttons."
              accessibilityValue={{
                min: 1,
                max: fitted.points.length,
                now: selectedIndex + 1,
                text: `${selected.label}, ${money.format(selected.value)} CAD, ${lowestRetailer}`,
              }}
              aria-valuemin={1}
              aria-valuemax={fitted.points.length}
              aria-valuenow={selectedIndex + 1}
              aria-valuetext={`${selected.label}, ${money.format(selected.value)} CAD, ${lowestRetailer}`}
              accessibilityActions={[
                { name: "increment", label: "Next sale period" },
                { name: "decrement", label: "Previous sale period" },
              ]}
              onAccessibilityAction={(event) =>
                selectIndex(selectedIndex + (event.nativeEvent.actionName === "increment" ? 1 : -1))
              }
              onPressIn={(event) => {
                const x = event.nativeEvent.locationX;
                pressLocation.current = Number.isFinite(x) ? x : null;
              }}
              onPress={(event) => {
                // Web click events lack locationX; press-in has responder coordinates.
                const x = Number.isFinite(event.nativeEvent.locationX)
                  ? event.nativeEvent.locationX
                  : pressLocation.current;
                if (x !== null) selectIndex(nearestPriceChartPoint(fitted, x));
              }}
            >
              <Svg
                width={fitted.width}
                height={fitted.height}
                accessible={false}
                pointerEvents="none"
              >
                <Defs>
                  <LinearGradient id="priceTrendArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={C.primary} stopOpacity={0.14} />
                    <Stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {fitted.ticks.map((tick) => (
                  <Line
                    key={`grid-${tick.value}`}
                    x1={fitted.plot.left}
                    x2={fitted.plot.right}
                    y1={tick.y}
                    y2={tick.y}
                    stroke={C.line}
                    strokeOpacity={0.45}
                    strokeWidth={1}
                  />
                ))}
                {fitted.points.length > 1 ? (
                  <>
                    <Path
                      d={`M${fitted.points.map((point) => `${point.x},${point.y}`).join(" L")} L${fitted.points.at(-1)?.x},${fitted.plot.bottom} L${fitted.points[0].x},${fitted.plot.bottom} Z`}
                      fill="url(#priceTrendArea)"
                    />
                    <Polyline
                      points={fitted.polyline}
                      fill="none"
                      stroke={C.primary}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </>
                ) : null}
                <Line
                  x1={selected.x}
                  x2={selected.x}
                  y1={fitted.plot.top}
                  y2={fitted.plot.bottom}
                  stroke={C.line}
                  strokeOpacity={0.5}
                />
                {fitted.points.map((point) => (
                  <Circle
                    key={point.id}
                    cx={point.x}
                    cy={point.y}
                    r={point.id === selected.id ? 4.5 : 2.5}
                    fill={C.primary}
                  />
                ))}
                <Circle
                  cx={selected.x}
                  cy={selected.y}
                  r={10}
                  fill={C.primary}
                  fillOpacity={0.12}
                />
                {fitted.ticks.map((tick) => (
                  <SvgText
                    key={`label-${tick.value}`}
                    x={0}
                    y={tick.y + 4}
                    fill={C.textMuted}
                    fontSize={11}
                  >
                    {money.format(tick.value)}
                  </SvgText>
                ))}
                <SvgText
                  x={fitted.points[0].x}
                  y={fitted.height - 5}
                  fill={C.textMuted}
                  fontSize={11}
                  textAnchor={fitted.points.length === 1 ? "middle" : "start"}
                >
                  {fitted.points[0].label.split("–")[0]}
                </SvgText>
                {fitted.points.length > 1 ? (
                  <SvgText
                    x={fitted.points.at(-1)?.x}
                    y={fitted.height - 5}
                    fill={C.textMuted}
                    fontSize={11}
                    textAnchor="end"
                  >
                    {latest.label.split("–")[0]}
                  </SvgText>
                ) : null}
              </Svg>
            </Pressable>
          </View>
          <View style={st.trendRange}>
            <Text style={st.trendCaption}>
              Tracked low <Text style={st.trendRangePrice}>{money.format(fitted.min)}</Text>
            </Text>
            <Text style={st.trendCaption}>
              Tracked high <Text style={st.trendRangePrice}>{money.format(fitted.max)}</Text>
            </Text>
          </View>
          <View style={st.trendSelectedSection}>
            <View style={st.trendPeriodNavigation}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous sale period"
                disabled={selectedIndex === 0}
                onPress={() => selectIndex(selectedIndex - 1)}
                style={[st.trendPeriodButton, selectedIndex === 0 && st.trendDisabled]}
              >
                <ChevronLeft size={18} color={C.textMuted} />
              </Pressable>
              <Text style={st.trendPeriodLabel}>{selected.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next sale period"
                disabled={selectedIndex === fitted.points.length - 1}
                onPress={() => selectIndex(selectedIndex + 1)}
                style={[
                  st.trendPeriodButton,
                  selectedIndex === fitted.points.length - 1 && st.trendDisabled,
                ]}
              >
                <ChevronRight size={18} color={C.textMuted} />
              </Pressable>
            </View>
            <View style={st.trendSelectedRow} accessibilityLiveRegion="polite">
              <Text style={st.trendSelectedRetailer}>{lowestRetailer}</Text>
              <Text style={st.trendSelectedPrice}>{money.format(selected.value)}</Text>
            </View>
            {retailerPrices.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((value) => !value)}
                style={st.trendCompareButton}
              >
                <Text style={st.trendCompareLabel}>
                  {expanded ? "Hide" : "Compare"} {retailerPrices.length} retailers
                </Text>
                {expanded ? (
                  <ChevronUp size={16} color={C.primaryDeep} />
                ) : (
                  <ChevronDown size={16} color={C.primaryDeep} />
                )}
              </Pressable>
            ) : null}
            {expanded
              ? retailerPrices.map(({ retailerName, source }, index) => (
                  <View key={source.id} style={st.trendRetailerRow}>
                    <View style={st.trendRetailerNameBlock}>
                      <Text style={st.trendRetailerName}>{retailerName}</Text>
                      {index === 0 ? <Text style={st.trendCaption}>Lowest</Text> : null}
                    </View>
                    <Text style={st.trendRetailerPrice}>{money.format(source.price)}</Text>
                  </View>
                ))
              : null}
          </View>
        </>
      )}
    </View>
  );
}
