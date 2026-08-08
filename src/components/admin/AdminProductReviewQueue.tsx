import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import type {
  AdminProduct,
  AdminProductIdentityReview,
} from "../../services/adminBackoffice";
import { toDateOnlyLabel, WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";
import { productDisplayName } from "../../utils/productNames";

type Props = {
  products: AdminProduct[];
  reviews: AdminProductIdentityReview[];
  loading: boolean;
  resolvingReviewId: string | null;
  styles: Record<string, any>;
  onManageProducts: () => void;
  onResolveReview: (reviewId: string) => void;
  onAssignReview: (review: AdminProductIdentityReview, targetProductId: string) => void;
};

function reasonLabel(reason: string): string {
  if (reason === "ambiguous_product_match") return "Multiple possible products";
  if (reason === "ambiguous_manual_product_match") return "This entry may match multiple products";
  if (reason === "product_id_not_found") return "The linked product was not found";
  if (reason === "gtin_conflict") return "Legacy identifier does not match the saved product";
  if (reason === "invalid_gtin") return "Legacy identifier needs review";
  if (reason === "existing_duplicate_candidates") return "Existing products may be duplicates";
  return reason.replace(/_/g, " ");
}

function payloadText(review: AdminProductIdentityReview, key: string): string | null {
  const value = review.payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function AdminProductReviewQueue({
  products,
  reviews,
  loading,
  resolvingReviewId,
  styles: st,
  onManageProducts,
  onResolveReview,
  onAssignReview,
}: Props) {
  const [manualProductIds, setManualProductIds] = React.useState<Record<string, string>>({});
  const sortedProducts = React.useMemo(
    () => [...products].sort((left, right) => productDisplayName(left).localeCompare(productDisplayName(right))),
    [products],
  );
  if (loading) {
    return (
      <View style={st.productReviewCard}>
        <Text style={st.productReviewTitle}>Checking product match reviews…</Text>
      </View>
    );
  }
  if (!reviews.length) return null;

  return (
    <View style={st.productReviewCard}>
      <View style={st.dataCardHeader}>
        <View style={st.productReviewHeading}>
          <Text style={st.productReviewTitle}>Products need review · {reviews.length}</Text>
          <Text style={st.productReviewDescription}>
            Choose the product for each held spreadsheet row. This imports its price without merging any products.
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onManageProducts} style={[st.btn, st.btnGhost]}>
          <Text style={st.btnGhostText}>Open Products</Text>
        </Pressable>
      </View>

      <View style={st.productReviewList}>
        {reviews.slice(0, 8).map((review) => {
          const productName = payloadText(review, "english_name") ??
            payloadText(review, "korean_name") ?? payloadText(review, "name") ??
            "Unnamed spreadsheet product";
          const unit = payloadText(review, "unit");
          const resolving = resolvingReviewId === review.id;
          const candidates = review.candidate_product_ids
            .map((id) => products.find((product) => product.id === id))
            .filter((product): product is AdminProduct => Boolean(product));
          return (
            <View key={review.id} style={st.productReviewRow}>
              <View style={st.dataRowMain}>
                <Text style={st.dataRowTitle}>{productName}</Text>
                <Text style={st.productReviewReason}>
                  {reasonLabel(review.reason)}
                  {review.candidate_count > 1 ? ` · ${review.candidate_count} possible matches` : ""}
                </Text>
                <Text style={st.dataMuted}>
                  {[unit, review.row_number ? `Spreadsheet row ${review.row_number}` : null]
                    .filter(Boolean).join(" · ")}
                </Text>
                {candidates.length ? (
                  <View style={st.productReviewActions}>
                    {candidates.slice(0, 4).map((candidate) => (
                      <Pressable
                        key={candidate.id}
                        accessibilityRole="button"
                        accessibilityState={{ busy: resolving, disabled: resolving }}
                        onPress={() => onAssignReview(review, candidate.id)}
                        style={[st.btn, st.btnGhost, resolving && st.btnDisabled]}
                        disabled={resolving}
                      >
                        <Text style={st.btnGhostText}>
                          Use {productDisplayName(candidate)}{candidate.unit ? ` · ${candidate.unit}` : ""}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : Platform.OS === "web" ? (
                  <View style={st.productReviewActions}>
                    <select
                      aria-label={`Product for spreadsheet row ${review.row_number ?? "unknown"}`}
                      value={manualProductIds[review.id] ?? ""}
                      onChange={(event) => setManualProductIds((current) => ({
                        ...current,
                        [review.id]: (event.target as HTMLSelectElement).value,
                      }))}
                      style={WEB_FILTER_SELECT_STYLE}
                      disabled={resolving}
                    >
                      <option value="">Choose any product…</option>
                      {sortedProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {productDisplayName(product)}{product.unit ? ` · ${product.unit}` : ""}
                        </option>
                      ))}
                    </select>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onAssignReview(review, manualProductIds[review.id] ?? "")}
                      style={[st.btn, st.btnGhost, (!manualProductIds[review.id] || resolving) && st.btnDisabled]}
                      disabled={!manualProductIds[review.id] || resolving}
                    >
                      <Text style={st.btnGhostText}>Assign row</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
              <View style={st.productReviewActions}>
                <Text style={st.dataMeta}>{toDateOnlyLabel(review.created_at)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: resolving, disabled: resolving }}
                  onPress={() => onResolveReview(review.id)}
                  style={[st.btn, st.btnGhost, resolving && st.btnDisabled]}
                  disabled={resolving}
                >
                  <Text style={st.btnGhostText}>
                    {resolving ? "Saving…" : candidates.length ? "Dismiss" : "Mark reviewed"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
      {reviews.length > 8 ? <Text style={st.dataMuted}>Showing 8 of {reviews.length} pending reviews.</Text> : null}
    </View>
  );
}
