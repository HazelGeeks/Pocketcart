import React from "react";
import { Pressable, Text, View } from "react-native";
import type {
  AdminProduct,
  AdminAuditLog,
  AdminProductIdentityReview,
  AdminSchemaReadiness,
} from "../../services/adminBackoffice";
import { productDisplayName } from "../../utils/productNames";
import {
  toDateOnlyLabel,
  type OverviewCard,
} from "../../utils/adminScreenHelpers";
import type { ProductDataHealth } from "../../utils/productDataHealth";
import AdminProductReviewQueue from "./AdminProductReviewQueue";

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
  auditLogs: AdminAuditLog[];
  auditLogsLoading: boolean;
  styles: Record<string, any>;
  onManageProducts: () => void;
  onResolveReview: (reviewId: string) => void;
  onAssignReview: (review: AdminProductIdentityReview, targetProductId: string) => void;
};

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
  auditLogs,
  auditLogsLoading,
  styles: st,
  onManageProducts,
  onResolveReview,
  onAssignReview,
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

      <AdminProductReviewQueue
        products={products}
        reviews={productIdentityReviews}
        loading={productIdentityReviewsLoading}
        resolvingReviewId={resolvingReviewId}
        styles={st}
        onManageProducts={onManageProducts}
        onResolveReview={onResolveReview}
        onAssignReview={onAssignReview}
      />

      <View style={st.statGrid}>
        {cards.map((card) => (
          <View key={card.id} style={st.statCard}>
            <Text style={st.statLabel}>{card.label}</Text>
            <Text style={st.statValue}>{card.value}</Text>
            <Text style={st.statHint}>{card.hint}</Text>
          </View>
        ))}
      </View>

      <View style={st.dataCard}>
        <View style={st.dataCardHeader}>
          <View>
            <Text style={st.dataCardTitle}>Recent Admin Activity</Text>
            <Text style={st.dataMuted}>Product, price import, merge, review, and store changes.</Text>
          </View>
          <Text style={st.dataMeta}>{auditLogs.length} recent entries</Text>
        </View>
        {auditLogsLoading && auditLogs.length === 0 ? (
          <Text style={st.dataMuted}>Loading activity…</Text>
        ) : auditLogs.length === 0 ? (
          <Text style={st.dataMuted}>No admin activity has been recorded yet.</Text>
        ) : (
          <View>
            {auditLogs.slice(0, 10).map((log) => (
              <View key={log.id} style={st.dataRow}>
                <View style={st.dataRowMain}>
                  <Text style={st.dataRowTitle}>{log.summary}</Text>
                  <Text style={st.dataMuted}>{log.action.replace(/_/g, " ")} · {log.actor_email || "Admin"}</Text>
                </View>
                <Text style={st.dataMeta}>{toDateOnlyLabel(log.created_at)}</Text>
              </View>
            ))}
          </View>
        )}
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
                  {item.missingUnit ? (
                    <Text style={st.dataHealthIdentityWarning}>
                      {[
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
