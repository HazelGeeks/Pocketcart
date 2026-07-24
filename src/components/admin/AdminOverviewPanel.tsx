import React from "react";
import { Pressable, Text, View } from "react-native";
import type {
  AdminProduct,
  AdminProductIdentityReview,
  AdminSchemaReadiness,
} from "../../services/adminBackoffice";
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
  if (reason === "ambiguous_manual_product_match") return "Manual entry matches multiple products";
  if (reason === "product_id_not_found") return "Product ID was not found";
  if (reason === "gtin_conflict") return "GTIN conflicts with the saved product";
  if (reason === "invalid_gtin") return "GTIN format or check digit is invalid";
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
            <Text style={st.dataCardTitle}>Database Readiness</Text>
            <Text style={st.dataMuted}>
              {schemaReadinessLoading
                ? "Checking required tables and columns…"
                : schemaReadiness?.ready
                  ? "All required product, history, review, and My stores schemas are ready."
                  : "One or more required migrations still need attention."}
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
                These CSV rows were not imported because the product identity was uncertain.
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
                payloadText(review, "name") ??
                payloadText(review, "english_name") ??
                "Unnamed CSV product";
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
                        ? ` · ${review.candidate_count} candidates`
                        : ""}
                    </Text>
                    <Text style={st.dataMuted}>
                      {[brand, unit, review.row_number ? `CSV row ${review.row_number}` : null]
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
                              Keep {candidate.name}
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
            <Text style={st.dataCardTitle}>Price History Coverage</Text>
            <Text style={st.dataMuted}>
              Build at least four sale sessions for the same product before treating its graph as a useful trend.
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
            {productDataHealth.fourPlusSessions} of {productDataHealth.totalProducts} products have 4+ sessions
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
            ["No history", productDataHealth.noHistory],
            ["1 session", productDataHealth.oneSession],
            ["2+ sessions", productDataHealth.twoPlusSessions],
            ["4+ sessions", productDataHealth.fourPlusSessions],
            ["8+ sessions", productDataHealth.eightPlusSessions],
            ["Comparable store sessions", productDataHealth.comparableMultiStoreSessions],
            ["Cross-brand sessions", productDataHealth.comparableMultiBrandSessions],
            ["Store price differences", productDataHealth.crossStorePriceDifferenceSessions],
          ].map(([label, value]) => (
            <View key={String(label)} style={st.dataHealthMetric}>
              <Text style={st.dataHealthMetricValue}>{value}</Text>
              <Text style={st.dataHealthMetricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={st.dataHealthIssueRow}>
          <Text style={st.dataHealthIssueText}>Missing GTIN · {productDataHealth.missingGtin}</Text>
          <Text style={st.dataHealthIssueText}>Missing product brand · {productDataHealth.missingBrand}</Text>
          <Text style={st.dataHealthIssueText}>Invalid GTIN · {productDataHealth.invalidGtin}</Text>
          <Text style={st.dataHealthIssueText}>Missing unit · {productDataHealth.missingUnit}</Text>
          <Text style={st.dataHealthIssueText}>
            Missing sale period · {productDataHealth.missingSalePeriodRows}
          </Text>
          <Text style={st.dataHealthIssueText}>
            Unlinked price rows · {productDataHealth.unlinkedPriceRows}
          </Text>
          <Text style={st.dataHealthIssueText}>Stale products · {productDataHealth.staleProducts}</Text>
        </View>
        <Text style={st.dataMuted}>
          {productDataHealth.comparableMultiBrandSessions === 0
            ? "No same-period cross-brand comparisons exist yet. This is expected until the same product overlaps at chains such as T&T and H-Mart."
            : productDataHealth.crossStorePriceDifferenceSessions === 0
              ? `${productDataHealth.comparableMultiBrandSessions} same-period cross-brand sessions exist, but their prices are currently identical.`
              : `${productDataHealth.crossStorePriceDifferenceSessions} sessions contain a store price difference; ${productDataHealth.comparableMultiBrandSessions} sessions span multiple store brands.`}
        </Text>

        <View style={st.dataHealthQueueHeader}>
          <View>
            <Text style={st.dataCardTitle}>Next History Collection Queue</Text>
            <Text style={st.dataMuted}>
              Up to 100 products, prioritizing active sales closest to the four-session target.
            </Text>
          </View>
          <Text style={st.dataMeta}>{productDataHealth.collectionQueue.length} queued</Text>
        </View>

        {productDataHealth.collectionQueue.length === 0 ? (
          <Text style={st.dataMuted}>Every tracked product has at least four sale sessions.</Text>
        ) : (
          <View style={st.dataHealthQueue}>
            {productDataHealth.collectionQueue.slice(0, 10).map((item) => (
              <View key={item.id} style={st.dataHealthQueueRow}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{item.name}</Text>
                  <Text style={st.dataMuted}>
                    {item.activeNow ? "Active sale" : "No active sale"}
                    {item.latestSessionAt
                      ? ` · Latest ${toDateOnlyLabel(item.latestSessionAt)}`
                      : " · Never tracked"}
                  </Text>
                </View>
                <View style={st.dataHealthQueueStatus}>
                  <Text style={st.dataHealthSessionBadge}>
                    {item.sessionCount}/4 sessions
                  </Text>
                  {item.missingGtin || item.missingBrand || item.invalidGtin || item.missingUnit ? (
                    <Text style={st.dataHealthIdentityWarning}>
                      {[
                        item.missingGtin ? "Missing GTIN" : null,
                        item.missingBrand ? "Missing brand" : null,
                        item.invalidGtin ? "Invalid GTIN" : null,
                        item.missingUnit ? "Missing unit" : null,
                      ].filter(Boolean).join(" + ")}
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
                  <Text style={st.dataRowTitle}>{item.name}</Text>
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
