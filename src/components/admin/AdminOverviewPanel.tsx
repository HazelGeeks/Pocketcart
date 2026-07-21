import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminProduct } from "../../services/adminBackoffice";
import {
  toDateOnlyLabel,
  type OverviewCard,
} from "../../utils/adminScreenHelpers";

type AdminOverviewPanelProps = {
  cards: OverviewCard[];
  products: AdminProduct[];
  productsLoading: boolean;
  styles: Record<string, any>;
  onManageProducts: () => void;
};

export default function AdminOverviewPanel({
  cards,
  products,
  productsLoading,
  styles: st,
  onManageProducts,
}: AdminOverviewPanelProps) {
  return (
    <View style={st.overviewContent}>
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
