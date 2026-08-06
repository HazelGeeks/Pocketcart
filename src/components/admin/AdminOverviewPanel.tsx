import React from "react";
import { Pressable, Text, View } from "react-native";
import type {
  AdminProduct,
  AdminProductIdentityReview,
  AdminSchemaReadiness,
} from "../../services/adminBackoffice";
import { productDisplayName } from "../../utils/productNames";
import {
  toDateOnlyLabel,
  type OverviewCard,
} from "../../utils/adminScreenHelpers";
import type { ProductDataHealth } from "../../utils/productDataHealth";

type AdminOverviewPanelProps = {
  cards: OverviewCard[];
  products: AdminProduct[];
  productsLoading: boolean;
  productDataHealth: ProductDataHealth;
  schemaReadiness: AdminSchemaReadiness | null;
  schemaReadinessLoading: boolean;
  productIdentityReviews: AdminProductIdentityReview[];
  productIdentityReviewsLoading: boolean;
  resolvingReviewId: string | null;
  styles: Record<string, any>;
  onManageProducts: () => void;
  onResolveReview: (reviewId: string) => void;
  onMergeReview: (
    reviewId: string,
    candidateProductIds: string[],
    targetProductId: string,
  ) => void;
};

function reviewReasonLabel(reason: string): string {
  if (reason === "ambiguous_product_match") return "Multiple possible products";
  if (reason === "ambiguous_manual_product_match") return "This entry may match multiple products";
  if (reason === "product_id_not_found") return "The linked product was not found";
  if (reason === "gtin_conflict") return "Barcode number does not match the saved product";
  if (reason === "invalid_gtin") return "Barcode number is invalid";
  if (reason === "existing_duplicate_candidates") return "Existing products may be duplicates";
  return reason.replace(/_/g, " ");
}

function payloadText(
  review: AdminProductIdentityReview,
  key: string,
): string | null {
  const value = review.payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default function AdminOverviewPanel({
  cards,
  products,
  productsLoading,
  productDataHealth,
  schemaReadiness,
  schemaReadinessLoading,
  productIdentityReviews,
  productIdentityReviewsLoading,
  resolvingReviewId,
  styles: st,
  onManageProducts,
  onResolveReview,
  onMergeReview,
}: AdminOverviewPanelProps) {
  const historyProgress =
    productDataHealth.totalProducts > 0
      ? Math.round(
          (productDataHealth.fourPlusSessions / productDataHealth.totalProducts) * 100,
        )
      : 0;

  return (
    <View style={st.overviewContent}>
      <View style={st.dataCard}>
        <View style={st.dataCardHeader}>
          <View>
            <Text style={st.dataCardTitle}>System Setup</Text>
            <Text style={st.dataMuted}>
              {schemaReadinessLoading
                ? "Checking the required product and price information…"
                : schemaReadiness?.ready
                  ? "All required product, price history, review, and My Stores information is ready."
                  : "One or more required system updates still need attention."}
            </Text>
          </View>
          <Text
            style={[
              st.dataHealthIssueText,
              schemaReadiness?.ready ? st.dataHealthReadyText : null,
            ]}
          >
            {schemaReadinessLoading
              ? "Checking"
              : schemaReadiness?.ready
                ? "Ready"
                : "Needs attention"}
          </Text>
        </View>
        {schemaReadiness?.checks.length ? (
          <View style={st.dataHealthIssueRow}>
            {schemaReadiness.checks.map((check) => (
              <Text
                key={check.id}
                style={[
                  st.dataHealthIssueText,
                  check.ready ? st.dataHealthReadyText : null,
                ]}
                accessibilityHint={check.detail ?? undefined}
              >
                {check.ready ? "✓" : "!"} {check.label}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {productIdentityReviewsLoading ? (
        <View style={st.productReviewCard}>
          <Text style={st.productReviewTitle}>Checking product match reviews…</Text>
        </View>
      ) : productIdentityReviews.length > 0 ? (
        <View style={st.productReviewCard}>
          <View style={st.dataCardHeader}>
            <View style={st.productReviewHeading}>
              <Text style={st.productReviewTitle}>
                Products need review · {productIdentityReviews.length}
              </Text>
              <Text style={st.productReviewDescription}>
                These spreadsheet rows were not added because they could not be confidently matched to a product.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onManageProducts}
              style={[st.btn, st.btnGhost]}
            >
              <Text style={st.btnGhostText}>Open Products</Text>
            </Pressable>
          </View>

          <View style={st.productReviewList}>
            {productIdentityReviews.slice(0, 8).map((review) => {
              const productName =
                payloadText(review, "english_name") ??
                payloadText(review, "korean_name") ??
                payloadText(review, "name") ??
                "Unnamed spreadsheet product";
              const unit = payloadText(review, "unit");
              const brand = payloadText(review, "product_brand");
              const resolving = resolvingReviewId === review.id;
              const candidateProducts = review.candidate_product_ids
                .map((productId) => products.find((product) => product.id === productId))
                .filter((product): product is AdminProduct => Boolean(product));
              const canMerge = candidateProducts.length > 1;

              return (
                <View key={review.id} style={st.productReviewRow}>
                  <View style={st.dataRowMain}>
                    <Text style={st.dataRowTitle}>{productName}</Text>
                    <Text style={st.productReviewReason}>
                      {reviewReasonLabel(review.reason)}
                      {review.candidate_count > 1
                        ? ` · ${review.candidate_count} possible matches`
                        : ""}
                    </Text>
                    <Text style={st.dataMuted}>
                      {[brand, unit, review.row_number ? `Spreadsheet row ${review.row_number}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {canMerge ? (
                      <View style={st.productReviewActions}>
                        {candidateProducts.slice(0, 4).map((candidate) => (
                          <Pressable
                            key={candidate.id}
                            accessibilityRole="button"
                            accessibilityState={{ busy: resolving, disabled: resolving }}
                            onPress={() =>
                              onMergeReview(
                                review.id,
                                candidateProducts.map((product) => product.id),
                                candidate.id,
                              )
                            }
                            style={[st.btn, st.btnGhost, resolving && st.btnDisabled]}
                            disabled={resolving}
                          >
                            <Text style={st.btnGhostText}>
                              Keep {productDisplayName(candidate)}
                              {candidate.unit ? ` · ${candidate.unit}` : ""}
                            </Text>
                          </Pressable>
                        ))}
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
                        {resolving ? "Saving…" : canMerge ? "Dismiss" : "Mark reviewed"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          {productIdentityReviews.length > 8 ? (
            <Text style={st.dataMuted}>
              Showing 8 of {productIdentityReviews.length} pending reviews.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={st.statGrid}>
        {cards.map((card) => (
          <View key={card.id} style={st.statCard}>
            <Text style={st.statLabel}>{card.label}</Text>
            <Text style={st.statValue}>{card.value}</Text>
            <Text style={st.statHint}>{card.hint}</Text>
          </View>
        ))}
      </View>

      <View style={st.dataHealthCard}>
        <View style={st.dataCardHeader}>
          <View style={st.dataHealthHeading}>
            <Text style={st.dataCardTitle}>Price History Progress</Text>
            <Text style={st.dataMuted}>
              Record prices from at least four different sale periods for each product to show a useful price trend.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onManageProducts}
            style={[st.btn, st.btnGhost]}
          >
            <Text style={st.btnGhostText}>Open Products</Text>
          </Pressable>
        </View>

        <View style={st.dataHealthProgressHeader}>
          <Text style={st.dataHealthProgressValue}>{historyProgress}%</Text>
          <Text style={st.dataMuted}>
            {productDataHealth.fourPlusSessions} of {productDataHealth.totalProducts} products have prices from 4 or more sale periods
          </Text>
        </View>
        <View style={st.dataHealthProgressTrack}>
          <View
            style={[
              st.dataHealthProgressFill,
              { width: `${Math.max(0, Math.min(100, historyProgress))}%` },
            ]}
          />
        </View>

        <View style={st.dataHealthMetricGrid}>
          {[
            ["No price history", productDataHealth.noHistory],
            ["1 sale period", productDataHealth.oneSession],
            ["2+ sale periods", productDataHealth.twoPlusSessions],
            ["4+ sale periods", productDataHealth.fourPlusSessions],
            ["8+ sale periods", productDataHealth.eightPlusSessions],
            ["Compared at 2+ stores", productDataHealth.comparableMultiStoreSessions],
            ["Compared across 2+ grocery chains", productDataHealth.comparableMultiBrandSessions],
            ["Sales with different store prices", productDataHealth.crossStorePriceDifferenceSessions],
          ].map(([label, value]) => (
            <View key={String(label)} style={st.dataHealthMetric}>
              <Text style={st.dataHealthMetricValue}>{value}</Text>
              <Text style={st.dataHealthMetricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={st.dataHealthIssueRow}>
          <Text style={st.dataHealthIssueText}>Barcode number needs correction · {productDataHealth.invalidGtin}</Text>
          <Text style={st.dataHealthIssueText}>No package size or unit · {productDataHealth.missingUnit}</Text>
          <Text style={st.dataHealthIssueText}>
            Missing sale dates · {productDataHealth.missingSalePeriodRows}
          </Text>
          <Text style={st.dataHealthIssueText}>
            Price not linked to a product or store · {productDataHealth.unlinkedPriceRows}
          </Text>
          <Text style={st.dataHealthIssueText}>Not updated in 30+ days · {productDataHealth.staleProducts}</Text>
        </View>
        <Text style={st.dataMuted}>
          {productDataHealth.comparableMultiBrandSessions === 0
            ? "No product has prices from two or more grocery chains for the same sale dates yet. Prices from every grocery chain are included, not only T&T and H Mart."
            : productDataHealth.crossStorePriceDifferenceSessions === 0
              ? `${productDataHealth.comparableMultiBrandSessions} sale periods include prices from two or more grocery chains, but the prices are the same.`
              : `${productDataHealth.crossStorePriceDifferenceSessions} sale periods have different store prices. ${productDataHealth.comparableMultiBrandSessions} sale periods include two or more grocery chains.`}
        </Text>

        <View style={st.dataHealthQueueHeader}>
          <View>
            <Text style={st.dataCardTitle}>Products Needing More Price History</Text>
            <Text style={st.dataMuted}>
              Shows up to 100 products. Current sale products closest to four sale periods appear first.
            </Text>
          </View>
          <Text style={st.dataMeta}>{productDataHealth.collectionQueue.length} products</Text>
        </View>

        {productDataHealth.collectionQueue.length === 0 ? (
          <Text style={st.dataMuted}>Every product has prices from at least four sale periods.</Text>
        ) : (
          <View style={st.dataHealthQueue}>
            {productDataHealth.collectionQueue.slice(0, 10).map((item) => (
              <View key={item.id} style={st.dataHealthQueueRow}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{item.name}</Text>
                  <Text style={st.dataMuted}>
                    {item.activeNow ? "Active sale" : "No active sale"}
                    {item.latestSessionAt
                      ? ` · Latest sale period ${toDateOnlyLabel(item.latestSessionAt)}`
                      : " · No price history"}
                  </Text>
                </View>
                <View style={st.dataHealthQueueStatus}>
                  <Text style={st.dataHealthSessionBadge}>
                    {item.sessionCount}/4 sale periods
                  </Text>
                  {item.invalidGtin || item.missingUnit ? (
                    <Text style={st.dataHealthIdentityWarning}>
                      {[
                        item.invalidGtin ? "Barcode needs correction" : null,
                        item.missingUnit ? "No size or unit" : null,
                      ].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={st.dataCard}>
        <View style={st.dataCardHeader}>
          <Text style={st.dataCardTitle}>Recent Products</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onManageProducts}
            style={[st.btn, st.btnLink]}
          >
            <Text style={st.btnLinkText}>Manage</Text>
          </Pressable>
        </View>

        {productsLoading ? (
          <Text style={st.dataMuted}>Loading products...</Text>
        ) : products.length === 0 ? (
          <Text style={st.dataMuted}>No products yet.</Text>
        ) : (
          <View style={st.recentProductGrid}>
            {products.slice(0, 6).map((item) => (
              <View key={item.id} style={[st.dataRow, st.recentProductRow]}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{productDisplayName(item)}</Text>
                  <Text style={st.dataMuted}>{item.category}</Text>
                </View>
                <Text style={st.dataMeta}>{toDateOnlyLabel(item.created_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
