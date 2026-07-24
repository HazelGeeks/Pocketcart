import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import {
  dateInputValue,
  toDateOnlyLabel,
  type ProductPriceStats,
} from "../../utils/adminScreenHelpers";
import { AdminTechnicalDetailsPanel } from "./AdminTechnicalDetails";

type Props = {
  product: AdminProduct;
  stats?: ProductPriceStats;
  selected: boolean;
  deleting: boolean;
  bulkDeleting: boolean;
  submitting: boolean;
  styles: Record<string, any>;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function AdminProductCard({
  product,
  stats,
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
  const latestPrice = stats?.latestPrice ?? null;
  const storeCount = stats?.storeIds.size ?? 0;
  const priceRangeLabel =
    stats && stats.minPrice !== null && stats.maxPrice !== null
      ? `$${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toFixed(2)}`
      : "N/A";
  const salePeriodLabel = stats?.latestValidFrom
    ? `${dateInputValue(stats.latestValidFrom)} - ${
        stats.latestValidTo ? dateInputValue(stats.latestValidTo) : "No end date"
      }`
    : null;
  const disabled = deleting || bulkDeleting || submitting;

  return (
    <View
      style={[
        st.productGridCard,
        selected && st.productGridCardSelected,
      ]}
    >
      <View style={st.productGridCardHeader}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Select ${product.name}`}
          accessibilityState={{ checked: selected }}
          onPress={onToggle}
          style={[st.productCheckboxHitArea, disabled && st.btnDisabled]}
          disabled={disabled}
        >
          <View
            style={[
              st.productCheckboxBox,
              selected && st.productCheckboxBoxChecked,
            ]}
          >
            {selected ? <View style={st.productCheckboxMark} /> : null}
          </View>
        </Pressable>

        <View style={st.productGridIdentity}>
          <Text style={st.productGridTitle}>{product.name}</Text>
          {product.english_name ? (
            <Text style={st.productGridSubtitle}>{product.english_name}</Text>
          ) : null}
          <Text style={st.productGridCategory}>
            {product.category}
            {product.unit ? ` · ${product.unit}` : ""}
          </Text>
        </View>

        {product.thumbnail_url ? (
          <Image
            source={{ uri: product.thumbnail_url }}
            style={st.productGridThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={st.productGridThumbnailPlaceholder}>
            <Text style={st.productGridThumbnailPlaceholderText}>No image</Text>
          </View>
        )}
      </View>

      <View style={st.productGridMetrics}>
        <View style={st.productGridMetric}>
          <Text style={st.productGridMetricLabel}>Latest</Text>
          <Text style={st.productGridMetricValue}>
            {latestPrice === null ? "N/A" : `$${latestPrice.toFixed(2)}`}
          </Text>
        </View>
        <View style={st.productGridMetric}>
          <Text style={st.productGridMetricLabel}>Stores</Text>
          <Text style={st.productGridMetricValue}>{storeCount}</Text>
        </View>
        <View style={st.productGridMetricWide}>
          <Text style={st.productGridMetricLabel}>Price range</Text>
          <Text style={st.productGridMetricValue}>{priceRangeLabel}</Text>
        </View>
      </View>

      {salePeriodLabel ? (
        <View style={st.productGridSale}>
          <Text style={st.productGridSaleLabel}>Sale period</Text>
          <Text style={st.productGridSaleValue}>{salePeriodLabel}</Text>
        </View>
      ) : null}

      <View style={st.productGridCardFooter}>
        <Text style={st.productGridCreated}>
          Created {toDateOnlyLabel(product.created_at)}
        </Text>
        <View style={st.productGridActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${detailsExpanded ? "Hide" : "Show"} technical details for ${product.name}`}
            accessibilityState={{ expanded: detailsExpanded }}
            onPress={() => setDetailsExpanded((current) => !current)}
            style={[
              st.btn,
              st.btnGhost,
              st.productGridActionButton,
              detailsExpanded && st.productGridDetailsButtonActive,
            ]}
          >
            <Text style={st.btnGhostText}>Details</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={[st.btn, st.btnGhost, st.productGridActionButton]}
            disabled={disabled}
          >
            <Text style={st.btnGhostText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            style={[
              st.btn,
              st.btnDanger,
              st.productGridActionButton,
              deleting && st.btnDisabled,
            ]}
            disabled={deleting || bulkDeleting}
          >
            <Text style={st.btnDangerText}>
              {deleting ? "Deleting…" : "Delete"}
            </Text>
          </Pressable>
        </View>
      </View>

      {detailsExpanded ? (
        <AdminTechnicalDetailsPanel
          items={[{ key: "product-id", label: "Product ID", value: product.id }]}
          styles={st}
        />
      ) : null}
    </View>
  );
}
