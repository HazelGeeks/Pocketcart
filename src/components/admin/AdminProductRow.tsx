import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import {
  dateInputValue,
  type ProductPriceStats,
  toDateOnlyLabel,
} from "../../utils/adminScreenHelpers";
import { categoryToIconVariant } from "../../utils/categoryIcon";
import { productDisplayName, productSecondaryName } from "../../utils/productNames";
import { CategoryPlaceholderIcon } from "../nativeApp/CategoryPlaceholderIcon";
import { AdminTechnicalDetailsPanel } from "./AdminTechnicalDetails";

type Props = {
  product: AdminProduct;
  stats?: ProductPriceStats;
  compact: boolean;
  selected: boolean;
  deleting: boolean;
  bulkDeleting: boolean;
  submitting: boolean;
  styles: Record<string, any>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AdminProductRow({
  product,
  stats,
  compact,
  selected,
  deleting,
  bulkDeleting,
  submitting,
  styles: st,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);
  const disabled = deleting || bulkDeleting || submitting;
  const displayName = productDisplayName(product);
  const secondaryName = productSecondaryName(product);
  const latestPrice = stats?.latestPrice ?? null;
  const currentSalePeriodLabel = stats?.currentSaleValidFrom
    ? `${dateInputValue(stats.currentSaleValidFrom)} - ${
        stats.currentSaleValidTo ? dateInputValue(stats.currentSaleValidTo) : "No end date"
      }`
    : null;
  const currentSaleRetailers = stats?.currentSaleStoreBrands ?? [];
  const currentSaleRetailerLabel =
    currentSaleRetailers.length > 0 ? currentSaleRetailers.join(", ") : "No active sale";

  const actionButtons = (
    <View style={[st.productListActions, compact && st.productListActionsCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${detailsExpanded ? "Hide" : "Show"} technical details for ${displayName}`}
        accessibilityState={{ expanded: detailsExpanded }}
        onPress={() => setDetailsExpanded((current) => !current)}
        style={[
          st.btn,
          st.btnGhost,
          st.productListActionButton,
          detailsExpanded && st.productListDetailsButtonActive,
        ]}
      >
        <Text style={st.btnGhostText}>Details</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${displayName}`}
        onPress={onEdit}
        style={[st.btn, st.btnGhost, st.productListActionButton]}
        disabled={disabled}
      >
        <Text style={st.btnGhostText}>Edit</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${displayName}`}
        onPress={onDelete}
        style={[st.btn, st.btnDanger, st.productListActionButton, deleting && st.btnDisabled]}
        disabled={deleting || bulkDeleting}
      >
        <Text style={st.btnDangerText}>{deleting ? "Deleting…" : "Delete"}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[st.productListRow, selected && st.productListRowSelected]}>
      <View style={[st.productListRowMain, compact && st.productListRowMainCompact]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Select ${displayName}`}
          accessibilityState={{ checked: selected }}
          onPress={onToggle}
          style={[
            st.productCheckboxHitArea,
            st.productListSelectColumn,
            disabled && st.btnDisabled,
          ]}
          disabled={disabled}
        >
          <View style={[st.productCheckboxBox, selected && st.productCheckboxBoxChecked]}>
            {selected ? <View style={st.productCheckboxMark} /> : null}
          </View>
        </Pressable>

        <View style={[st.productListProductCell, compact && st.productListProductCellCompact]}>
          {product.thumbnail_url ? (
            <Image
              source={{ uri: product.thumbnail_url }}
              style={st.productListThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={st.productListThumbnailPlaceholder}>
              <CategoryPlaceholderIcon variant={categoryToIconVariant(product.category)} />
            </View>
          )}
          <View style={st.productListIdentity}>
            <Text numberOfLines={compact ? 2 : 1} style={st.productListTitle}>
              {displayName}
            </Text>
            {secondaryName ? (
              <Text numberOfLines={1} style={st.productListSubtitle}>
                {secondaryName}
              </Text>
            ) : null}
            <Text style={st.productListCategory}>
              {product.category}
              {product.unit ? ` · ${product.unit}` : ""}
            </Text>
            <Text style={st.productListCreated}>Created {toDateOnlyLabel(product.created_at)}</Text>
          </View>
        </View>

        {compact ? (
          <>
            <View style={st.productListCompactMetrics}>
              <View style={st.productListCompactMetric}>
                <Text style={st.productListMetricLabel}>Latest</Text>
                <Text style={st.productListMetricValue}>
                  {latestPrice === null ? "N/A" : `$${latestPrice.toFixed(2)}`}
                </Text>
              </View>
              <View style={st.productListCompactMetric}>
                <Text style={st.productListMetricLabel}>History</Text>
                <Text style={st.productListMetricValue}>{stats?.saleSessions.size ?? 0}×</Text>
              </View>
            </View>
            <View style={st.productListCompactSale}>
              <View style={st.productListSaleGroup}>
                <Text style={st.productListMetricLabel}>Current sale</Text>
                <Text style={st.productListSaleValue}>{currentSaleRetailerLabel}</Text>
                {currentSalePeriodLabel ? (
                  <Text style={st.productListMetricSecondary}>{currentSalePeriodLabel}</Text>
                ) : null}
              </View>
            </View>
            {actionButtons}
          </>
        ) : (
          <>
            <View style={st.productListLatestColumn}>
              <Text style={st.productListMetricValue}>
                {latestPrice === null ? "N/A" : `$${latestPrice.toFixed(2)}`}
              </Text>
            </View>
            <View style={st.productListHistoryColumn}>
              <Text style={st.productListMetricValue}>{stats?.saleSessions.size ?? 0}×</Text>
            </View>
            <View style={st.productListSaleColumn}>
              <Text numberOfLines={2} style={st.productListSaleValue}>
                {currentSaleRetailerLabel}
              </Text>
              {currentSalePeriodLabel ? (
                <Text numberOfLines={1} style={st.productListMetricSecondary}>
                  {currentSalePeriodLabel}
                </Text>
              ) : null}
            </View>
            <View style={st.productListActionsColumn}>{actionButtons}</View>
          </>
        )}
      </View>

      {detailsExpanded ? (
        <View style={st.productListDetailsPanel}>
          <AdminTechnicalDetailsPanel
            items={[{ key: "product-id", label: "Product ID", value: product.id }]}
            styles={st}
          />
        </View>
      ) : null}
    </View>
  );
}
