import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
import {
  buildProductDuplicateGroups,
  type ProductDuplicateGroup,
} from "../../utils/productDuplicateGroups";

type Props = {
  products: AdminProduct[];
  priceStats: Map<string, ProductPriceStats>;
  styles: Record<string, any>;
  onExportIdentityGaps: () => void;
  onReviewGroup: (group: ProductDuplicateGroup) => void;
};

function groupStoreBrands(
  group: ProductDuplicateGroup,
  priceStats: Map<string, ProductPriceStats>,
): string[] {
  return [
    ...new Set(
      group.products.flatMap(
        (product) => priceStats.get(product.id)?.storeBrands ?? [],
      ),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export default function AdminProductIdentityWorkbench({
  products,
  priceStats,
  styles: st,
  onExportIdentityGaps,
  onReviewGroup,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const duplicateGroups = React.useMemo(
    () => buildProductDuplicateGroups(products),
    [products],
  );
  const missingGtin = products.filter((product) => !product.gtin?.trim()).length;
  const missingBrand = products.filter((product) => !product.brand?.trim()).length;
  const missingImage = products.filter((product) => !product.thumbnail_url?.trim()).length;

  return (
    <View style={st.productReviewCard}>
      <View style={st.dataCardHeader}>
        <View style={st.productReviewHeading}>
          <Text style={st.productReviewTitle}>Product identity workbench</Text>
          <Text style={st.productReviewDescription}>
            Review products that share a GTIN or the same normalized name and unit before merging their price history.
          </Text>
        </View>
        <View style={st.productReviewActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onExportIdentityGaps}
            style={[st.btn, st.btnGhost]}
          >
            <Text style={st.btnGhostText}>Export missing info</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((current) => !current)}
            style={[st.btn, duplicateGroups.length > 0 ? st.btnPrimary : st.btnGhost]}
            disabled={duplicateGroups.length === 0}
          >
            <Text
              style={duplicateGroups.length > 0 ? st.btnPrimaryText : st.btnGhostText}
            >
              {duplicateGroups.length > 0
                ? `${expanded ? "Hide" : "Review"} ${duplicateGroups.length} groups`
                : "No exact matches"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={st.dataHealthIssueRow}>
        <Text style={st.dataHealthIssueText}>Possible duplicate groups {duplicateGroups.length}</Text>
        <Text style={st.dataHealthIssueText}>Missing GTIN {missingGtin}</Text>
        <Text style={st.dataHealthIssueText}>Missing product brand {missingBrand}</Text>
        <Text style={st.dataHealthIssueText}>Missing image {missingImage}</Text>
      </View>

      {expanded ? (
        <View style={st.productReviewList}>
          {duplicateGroups.slice(0, 12).map((group) => {
            const storeBrands = groupStoreBrands(group, priceStats);
            return (
              <View key={group.id} style={st.productReviewRow}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{group.label}</Text>
                  <Text style={st.productReviewReason}>
                    {group.method === "gtin"
                      ? "Same verified GTIN"
                      : "Same normalized name and unit"}
                    {" · "}
                    {group.products.length} products
                  </Text>
                  <Text style={st.dataMuted}>
                    {group.products
                      .map((product) => `${product.name}${product.unit ? ` · ${product.unit}` : ""}`)
                      .join(" / ")}
                  </Text>
                  {storeBrands.length > 0 ? (
                    <Text style={st.dataMuted}>Stores: {storeBrands.join(", ")}</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onReviewGroup(group)}
                  style={[st.btn, st.btnGhost]}
                >
                  <Text style={st.btnGhostText}>Review merge</Text>
                </Pressable>
              </View>
            );
          })}
          {duplicateGroups.length > 12 ? (
            <Text style={st.dataMuted}>
              Showing 12 of {duplicateGroups.length} groups. Merge reviewed groups to reveal the next candidates.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
