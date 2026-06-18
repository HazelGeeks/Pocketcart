import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { AdminPriceEntry } from "../../services/adminBackoffice";
import { marketingPalette as C } from "../../shared/design/palette";
import { dateInputValue } from "../../utils/adminScreenHelpers";

type AdminPriceManagementPanelProps = {
  prices: AdminPriceEntry[];
  productNameById: Map<string, string>;
  storeNameById: Map<string, string>;
  editingPriceId: string | null;
  priceProductId: string;
  priceStoreId: string;
  priceValue: string;
  priceStartDate: string;
  priceEndDate: string;
  deletingKey: string | null;
  submitting: boolean;
  styles: Record<string, any>;
  onProductIdChange: (value: string) => void;
  onStoreIdChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSavePrice: () => void;
  onResetPriceForm: () => void;
  onEditPrice: (price: AdminPriceEntry) => void;
  onDeletePrice: (priceId: string) => void;
};

export default function AdminPriceManagementPanel({
  prices,
  productNameById,
  storeNameById,
  editingPriceId,
  priceProductId,
  priceStoreId,
  priceValue,
  priceStartDate,
  priceEndDate,
  deletingKey,
  submitting,
  styles: st,
  onProductIdChange,
  onStoreIdChange,
  onPriceChange,
  onStartDateChange,
  onEndDateChange,
  onSavePrice,
  onResetPriceForm,
  onEditPrice,
  onDeletePrice,
}: AdminPriceManagementPanelProps) {
  return (
    <View style={st.dataCard}>
      <View style={st.dataCardHeader}>
        <Text style={st.dataCardTitle}>Price Management</Text>
        <Text style={st.dataMuted}>Add, update, or delete product price rows.</Text>
      </View>

      <View style={st.productFilterCard}>
        <View style={st.formRow}>
          <TextInput
            value={priceProductId}
            onChangeText={onProductIdChange}
            placeholder="Product ID"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, st.priceFormInputWide]}
          />
          <TextInput
            value={priceStoreId}
            onChangeText={onStoreIdChange}
            placeholder="Store ID"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, st.priceFormInputWide]}
          />
          <TextInput
            value={priceValue}
            onChangeText={onPriceChange}
            placeholder="Price"
            placeholderTextColor={C.textMuted}
            keyboardType="decimal-pad"
            style={[st.input, st.priceFormInputSmall]}
          />
          <TextInput
            value={priceStartDate}
            onChangeText={onStartDateChange}
            placeholder="Start YYYY-MM-DD"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, st.priceFormInputMedium]}
          />
          <TextInput
            value={priceEndDate}
            onChangeText={onEndDateChange}
            placeholder="End YYYY-MM-DD"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, st.priceFormInputMedium]}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onSavePrice}
            style={[st.btn, st.btnPrimary]}
            disabled={submitting}
          >
            <Text style={st.btnPrimaryText}>
              {submitting ? "Saving..." : editingPriceId ? "Update Price" : "Add Price"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onResetPriceForm}
            style={[st.btn, st.btnGhost, !editingPriceId && st.btnDisabled]}
            disabled={!editingPriceId || submitting}
          >
            <Text style={st.btnGhostText}>Cancel Edit</Text>
          </Pressable>
        </View>
        <Text style={st.dataMuted}>Select Edit on a row to load it here. Dates are optional.</Text>
      </View>

      {prices.length === 0 ? (
        <Text style={st.dataMuted}>No price rows yet.</Text>
      ) : (
        prices.map((item) => {
          const deleteKey = `price:${item.id}`;
          const deleting = deletingKey === deleteKey;
          const productLabel = productNameById.get(item.product_id) || item.product_name || item.product_id;
          const storeLabel = storeNameById.get(item.store_id) || item.store_name || item.store_id;
          return (
            <View key={item.id} style={st.listRow}>
              <View style={st.listMain}>
                <Text style={st.listTitle}>{productLabel}</Text>
                <Text style={st.dataMuted}>{storeLabel}</Text>
                <Text style={st.dataMuted}>
                  {item.product_id} | {item.store_id}
                </Text>
              </View>
              <View style={st.listRight}>
                <Text style={st.listPrice}>${item.price.toFixed(2)}</Text>
                <Text style={st.listDate}>
                  {dateInputValue(item.valid_from || item.observed_at) || "No date"}
                  {item.valid_to ? ` - ${dateInputValue(item.valid_to)}` : ""}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onEditPrice(item)}
                  style={[st.btn, st.btnGhost]}
                  disabled={deleting || submitting}
                >
                  <Text style={st.btnGhostText}>Edit</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onDeletePrice(item.id)}
                  style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                  disabled={deleting || submitting}
                >
                  <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
