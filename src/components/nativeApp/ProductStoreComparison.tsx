import React from "react";
import { Text, View } from "react-native";
import { money } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { formatSignedPercent } from "./priceDisplay";
import type { StorePriceDisplayGroup } from "./productDetailData";

type ProductStoreComparisonProps = {
  rows: StorePriceDisplayGroup[];
  loading: boolean;
};

export function ProductStoreComparison({
  rows,
  loading,
}: ProductStoreComparisonProps) {
  return (
    <View style={st.productStoreComparisonCard}>
      <Text style={st.productTrendHeading}>Compare stores</Text>
      {loading ? (
        <Text style={st.itemMeta}>Loading store prices...</Text>
      ) : rows.length === 0 ? (
        <Text style={st.itemMeta}>No current store prices yet.</Text>
      ) : (
        <>
          <StorePriceBarChart rows={rows} />
          {rows.map((row, index) => (
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
                      ? `${row.branchCount} branches${
                          row.areaLabel ? ` · ${row.areaLabel}` : ""
                        }`
                      : row.areaLabel || "Single branch"}
                  </Text>
                </View>
                <View style={st.storeComparePriceBlock}>
                  <Text style={st.historyPrice}>
                    {money.format(row.price)}
                  </Text>
                  {index === 0 ? (
                    <Text style={st.storeCompareLowest}>Lowest</Text>
                  ) : null}
                </View>
              </View>
              <View style={st.storeCompareMetaRow}>
                <Text style={st.itemMeta} numberOfLines={1}>
                  {row.comparison_label}
                </Text>
                {row.price_delta_percent !== null ? (
                  <Text
                    style={st.storeCompareTrendText}
                    numberOfLines={1}
                  >
                    {row.price_delta_percent > 0
                      ? "Up "
                      : row.price_delta_percent < 0
                        ? "Down "
                        : "Flat "}
                    {formatSignedPercent(row.price_delta_percent)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function StorePriceBarChart({
  rows,
}: {
  rows: StorePriceDisplayGroup[];
}) {
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
              {row.branchCount > 1 ? (
                <Text style={st.storeChartBest}>
                  {row.branchCount} branches
                </Text>
              ) : null}
              {index === 0 ? (
                <Text style={st.storeChartBest}>Lowest</Text>
              ) : null}
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
            <Text style={st.storeChartPrice}>
              {money.format(row.price)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
