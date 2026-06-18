import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import type { MarketProduct } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  money,
  type PreviousPriceRow,
  type PriceChart,
} from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";

type ProductDetailPanelProps = {
  product: MarketProduct | null;
  chart: PriceChart | null;
  previousPriceRows: PreviousPriceRow[];
  actionMessage: string | null;
  historyMessage: string | null;
  historyLoading: boolean;
  addSubmitting: boolean;
  onBack: () => void;
  onAddToWatchlist: () => void;
};

export function ProductDetailPanel({
  product,
  chart,
  previousPriceRows,
  actionMessage,
  historyMessage,
  historyLoading,
  addSubmitting,
  onBack,
  onAddToWatchlist,
}: ProductDetailPanelProps) {
  return (
    <View style={st.sectionStack}>
      <View style={st.detailActionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
        >
          <Text style={st.authBtnSecondaryText}>Back to Product List</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onAddToWatchlist}
          style={[st.authBtn, st.authBtnPrimary, st.detailActionBtn]}
          disabled={addSubmitting || !product}
        >
          <Text style={st.authBtnPrimaryText}>
            {addSubmitting ? "Adding..." : "Add to Watchlist"}
          </Text>
        </Pressable>
      </View>

      {product ? (
        <View style={st.rowCard}>
          <Text style={st.itemName}>{product.name}</Text>
          <Text style={st.sectionSub}>Price trend detail</Text>
          {actionMessage ? <Text style={st.itemMeta}>{actionMessage}</Text> : null}
          {historyMessage ? <Text style={st.itemMeta}>{historyMessage}</Text> : null}

          {historyLoading ? (
            <Text style={st.itemMeta}>Loading price history...</Text>
          ) : !chart ? (
            <Text style={st.itemMeta}>No price history yet for this product.</Text>
          ) : (
            <>
              <Text style={st.itemMeta}>
                Lowest {money.format(chart.min)} / Highest {money.format(chart.max)}
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
                  <Polyline
                    points={chart.polyline}
                    fill="none"
                    stroke={C.primary}
                    strokeWidth={3}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {chart.points.map((point, idx) => (
                    <Circle
                      key={`${point.observed_at}-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r={3.8}
                      fill={idx === chart.points.length - 1 ? C.primaryDeep : C.white}
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
                  {chart.points[chart.points.length - 1].label}: {money.format(chart.end)}
                </Text>
              </View>

              <Text style={st.historyTitle}>Previous Prices</Text>
              {previousPriceRows.length === 0 ? (
                <Text style={st.itemMeta}>No previous prices available.</Text>
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
