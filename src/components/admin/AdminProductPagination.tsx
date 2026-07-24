import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  ADMIN_PRODUCT_PAGE_SIZES,
  type AdminProductPageSize,
} from "../../utils/adminProductPagination";

type Props = {
  page: number;
  pageCount: number;
  pageSize: AdminProductPageSize;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  compact?: boolean;
  styles: Record<string, any>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminProductPageSize) => void;
};

export default function AdminProductPagination({
  page,
  pageCount,
  pageSize,
  rangeStart,
  rangeEnd,
  totalItems,
  compact = false,
  styles: st,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <View style={[st.productPaginationBar, compact && st.productPaginationCompact]}>
      {!compact ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Products per page"
          style={st.productPaginationSizeGroup}
        >
          <Text style={st.productPaginationLabel}>Rows per page</Text>
          {ADMIN_PRODUCT_PAGE_SIZES.map((size) => {
            const selected = pageSize === size;
            return (
              <Pressable
                key={size}
                accessibilityRole="radio"
                accessibilityLabel={`Show ${size} products per page`}
                accessibilityState={{ checked: selected }}
                onPress={() => onPageSizeChange(size)}
                style={[
                  st.productPaginationSizeButton,
                  selected && st.productPaginationSizeButtonActive,
                ]}
              >
                <Text
                  style={[
                    st.productPaginationSizeText,
                    selected && st.productPaginationSizeTextActive,
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Text accessibilityLiveRegion="polite" style={st.productPaginationSummary}>
        {rangeStart}–{rangeEnd} of {totalItems} filtered products
      </Text>

      <View style={st.productPaginationNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous products page"
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
          style={[
            st.btn,
            st.btnGhost,
            st.productPaginationNavButton,
            page <= 1 && st.btnDisabled,
          ]}
        >
          <Text style={st.btnGhostText}>Previous</Text>
        </Pressable>
        <Text style={st.productPaginationPage}>
          Page {page} of {pageCount}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next products page"
          disabled={page >= pageCount}
          onPress={() => onPageChange(page + 1)}
          style={[
            st.btn,
            st.btnGhost,
            st.productPaginationNavButton,
            page >= pageCount && st.btnDisabled,
          ]}
        >
          <Text style={st.btnGhostText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
