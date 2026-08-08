import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import type { ProductPriceStats } from "../../utils/adminScreenHelpers";
import {
  buildProductDuplicateGroups,
  type ProductDuplicateGroup,
} from "../../utils/productDuplicateGroups";
import { productDisplayName } from "../../utils/productNames";

type Props = {
  products: AdminProduct[];
  priceStats: Map<string, ProductPriceStats>;
  loading: boolean;
  error: string | null;
  styles: Record<string, any>;
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
  loading,
  error,
  styles: st,
  onReviewGroup,
}: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const duplicateGroups = React.useMemo(
    () => buildProductDuplicateGroups(products),
    [products],
  );
  const missingImage = products.filter(
    (product) => !product.thumbnail_url?.trim(),
  ).length;
  const hasDuplicateGroups = duplicateGroups.length > 0;
  const isReady = !loading && !error && !hasDuplicateGroups;
  const statusDescription = error
    ? `Error: Products could not be loaded, so duplicate groups could not be checked. ${error}`
    : loading
      ? "Checking products for possible duplicates…"
      : hasDuplicateGroups
        ? `${duplicateGroups.length} possible duplicate groups need review. Confirm the product name and package size before merging. Nothing is merged automatically.`
        : "No duplicate product candidates were found.";

  React.useEffect(() => {
    if (loading || error || !hasDuplicateGroups) setExpanded(false);
  }, [error, hasDuplicateGroups, loading]);

  return (
    <View
      style={[
        st.productReviewCard,
        error
          ? st.productReviewCardError
          : isReady
            ? st.productReviewCardReady
            : null,
      ]}
    >
      <View style={st.dataCardHeader}>
        <View style={st.productReviewHeading}>
          <Text
            style={[
              st.productReviewTitle,
              error
                ? st.productReviewTitleError
                : isReady
                  ? st.productReviewTitleReady
                  : null,
            ]}
          >
            {error ? "Duplicate check failed" : "Product identity workbench"}
          </Text>
          <Text
            accessibilityRole={error ? "alert" : undefined}
            style={[
              st.productReviewDescription,
              error
                ? st.productReviewDescriptionError
                : isReady
                  ? st.productReviewDescriptionReady
                  : null,
            ]}
          >
            {statusDescription}
          </Text>
        </View>
        {!loading && !error ? (
          <View style={st.productReviewActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpanded((current) => !current)}
              style={[
                st.btn,
                hasDuplicateGroups ? st.btnPrimary : st.btnGhost,
              ]}
              disabled={!hasDuplicateGroups}
            >
              <Text
                style={
                  hasDuplicateGroups ? st.btnPrimaryText : st.btnGhostText
                }
              >
                {hasDuplicateGroups
                  ? `${expanded ? "Hide" : "Review"} ${duplicateGroups.length} groups`
                  : "No exact matches"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {!loading && !error ? (
        <View style={st.dataHealthIssueRow}>
          <Text style={st.dataHealthIssueText}>
            Possible duplicate groups {duplicateGroups.length}
          </Text>
          <Text style={st.dataHealthIssueText}>Missing image {missingImage}</Text>
        </View>
      ) : null}

      {expanded && hasDuplicateGroups && !loading && !error ? (
        <View style={st.productReviewList}>
          {duplicateGroups.slice(0, 12).map((group) => {
            const storeBrands = groupStoreBrands(group, priceStats);
            return (
              <View key={group.id} style={st.productReviewRow}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{group.label}</Text>
                  <Text style={st.productReviewReason}>
                    Same normalized name and unit
                    {" · "}
                    {group.products.length} products
                  </Text>
                  <Text style={st.dataMuted}>
                    {group.products
                      .map((product) => `${productDisplayName(product)}${product.unit ? ` · ${product.unit}` : ""}`)
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
