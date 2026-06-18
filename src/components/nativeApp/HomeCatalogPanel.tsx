import React from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import type { MarketProduct } from "../../services/marketData";
import { marketingPalette as C } from "../../shared/design/palette";
import { money, type SummaryCard } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";

type HomeCatalogPanelProps = {
  query: string;
  category: string;
  categories: string[];
  summaryCards: SummaryCard[];
  message: string | null;
  loading: boolean;
  products: MarketProduct[];
  selectedProduct: MarketProduct | null;
  onChangeQuery: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onSelectProduct: (productId: string) => void;
};

export function HomeCatalogPanel({
  query,
  category,
  categories,
  summaryCards,
  message,
  loading,
  products,
  selectedProduct,
  onChangeQuery,
  onChangeCategory,
  onSelectProduct,
}: HomeCatalogPanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Home</Text>
      <Text style={st.sectionSub}>
        Search and browse products, then open detail page for trend data.
      </Text>

      <View style={st.searchCard}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search products"
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={st.searchInput}
        />
      </View>

      <View style={st.categoryRow}>
        {["All", ...categories].map((categoryOption) => {
          const active = category === categoryOption;
          return (
            <Pressable
              key={categoryOption}
              accessibilityRole="button"
              onPress={() => onChangeCategory(categoryOption)}
              style={[st.categoryChip, active && st.categoryChipActive]}
            >
              <Text style={[st.categoryChipText, active && st.categoryChipTextActive]}>
                {categoryOption}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={st.summaryPanel}>
        {summaryCards.map((card, index) => (
          <View
            key={card.id}
            style={[
              st.summaryRow,
              index < summaryCards.length - 1 && st.summaryRowDivider,
            ]}
          >
            <Text style={st.summaryLabel}>{card.label}</Text>
            <Text style={st.summaryValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>No products found for this filter.</Text>
        </View>
      ) : (
        products.map((product) => {
          const active = selectedProduct?.id === product.id;
          return (
            <Pressable
              key={product.id}
              accessibilityRole="button"
              onPress={() => onSelectProduct(product.id)}
              style={[st.rowCard, active && st.rowCardActive]}
            >
              <View style={st.productRow}>
                <View style={st.productMain}>
                  <Text style={st.itemName}>{product.name}</Text>
                  <Text style={st.itemMeta}>{product.category}</Text>
                  <Text style={st.storePrice}>
                    Current {product.current_price !== null ? money.format(product.current_price) : "-"}
                  </Text>
                </View>
                <View style={st.productThumb}>
                  {product.thumbnail_url ? (
                    <Image
                      source={{ uri: product.thumbnail_url }}
                      style={st.productThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={st.productThumbPlaceholder}>
                      <Text style={st.productThumbPlaceholderText}>IMG</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
