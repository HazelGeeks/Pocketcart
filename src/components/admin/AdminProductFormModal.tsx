import React from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { AdminStore } from "../../services/adminBackoffice";
import type { StorePriceSetInput } from "../../utils/adminScreenHelpers";

type Props = {
  visible: boolean;
  isLg: boolean;
  editingProductId: string | null;
  submitting: boolean;
  imageUploading: boolean;
  productName: string;
  productCategory: string;
  productCategoryCustom: string;
  productThumb: string;
  storePriceSets: StorePriceSetInput[];
  periodStartDate: string;
  periodEndDate: string;
  categoryOptions: string[];
  recentStoreOptions: AdminStore[];
  styles: any;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCategoryCustomChange: (value: string) => void;
  onUploadImage: () => void;
  onAddStorePriceSet: () => void;
  onRemoveStorePriceSet: (id: string) => void;
  onUpdateStorePriceSet: (id: string, field: "storeId" | "price", value: string) => void;
  onPickPeriodDate: (type: "start" | "end") => void;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AdminProductFormModal({
  visible,
  isLg,
  editingProductId,
  submitting,
  imageUploading,
  productName,
  productCategory,
  productCategoryCustom,
  productThumb,
  storePriceSets,
  periodStartDate,
  periodEndDate,
  categoryOptions,
  recentStoreOptions,
  styles: st,
  onNameChange,
  onCategoryChange,
  onCategoryCustomChange,
  onUploadImage,
  onAddStorePriceSet,
  onRemoveStorePriceSet,
  onUpdateStorePriceSet,
  onPickPeriodDate,
  onPeriodStartChange,
  onPeriodEndChange,
  onClose,
  onSave,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBackdrop}>
        <View style={st.modalCard}>
          <View style={st.modalHeader}>
            <View>
              <Text style={st.modalTitle}>{editingProductId ? "Edit Product" : "Add Product"}</Text>
              <Text style={st.modalSub}>
                {editingProductId
                  ? "Update product details or add an image. Store price sets are optional."
                  : "Register a catalog product. Image and Store | Price sets are optional."}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
            <View style={st.modalTopGrid}>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Product Name</Text>
                <TextInput value={productName} onChangeText={onNameChange} placeholder="Product name" placeholderTextColor={C.textMuted} style={st.input} />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Custom Category</Text>
                <TextInput
                  value={productCategoryCustom}
                  onChangeText={(value) => {
                    onCategoryCustomChange(value);
                    onCategoryChange(value.trim());
                  }}
                  placeholder="Type custom category (optional)"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
                <Text style={st.dataMuted}>Selected: {productCategory.trim() || "None"}</Text>
              </View>
            </View>

            <Text style={st.fieldLabel}>Category</Text>
            <View style={st.choiceRow}>
              {categoryOptions.map((category) => {
                const active = productCategory.trim().toLowerCase() === category.toLowerCase();
                return (
                  <Pressable key={category} accessibilityRole="button" onPress={() => { onCategoryChange(category); onCategoryCustomChange(""); }} style={[st.choiceChip, active && st.choiceChipActive]}>
                    <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={st.modalTopGrid}>
              <View style={st.modalTopCell}>
                <Text style={st.fieldLabel}>Product Image</Text>
                <Pressable accessibilityRole="button" onPress={onUploadImage} style={[st.imageUploadArea, (imageUploading || submitting) && st.btnDisabled]} disabled={imageUploading || submitting}>
                  {productThumb ? (
                    <Image source={{ uri: productThumb }} style={st.modalImagePreview} resizeMode="cover" />
                  ) : (
                    <View style={[st.modalImagePreview, st.modalImagePlaceholder]}>
                      <Text style={st.dataMuted}>Tap to upload product image</Text>
                    </View>
                  )}
                  <View style={st.imageUploadOverlay}>
                    {imageUploading ? <ActivityIndicator color="#ffffff" size="small" /> : null}
                    <Text style={st.imageUploadOverlayText}>{imageUploading ? "Uploading..." : productThumb ? "Tap to replace image" : "Tap to upload image"}</Text>
                  </View>
                </Pressable>
                <Text style={st.dataMuted}>Optional. Click image area to upload to Supabase Storage.</Text>
              </View>
            </View>

            <View style={st.storePriceHeaderRow}>
              <Text style={st.fieldLabel}>Optional Store | Price Sets</Text>
              <Pressable accessibilityRole="button" onPress={onAddStorePriceSet} style={[st.btn, st.btnGhost]} disabled={submitting}>
                <Text style={st.btnGhostText}>Add Set</Text>
              </Pressable>
            </View>
            <View style={st.storePriceGrid}>
              {storePriceSets.map((set, index) => (
                <View key={set.id} style={[st.storePriceCard, isLg ? st.storePriceCardThreeCol : st.storePriceCardTwoCol]}>
                  <View style={st.storePriceCardHeader}>
                    <Text style={st.storePriceCardTitle}>Set {index + 1}</Text>
                    <Pressable accessibilityRole="button" onPress={() => onRemoveStorePriceSet(set.id)} style={[st.btn, st.btnDangerSoft]} disabled={submitting}>
                      <Text style={st.btnDangerSoftText}>{storePriceSets.length === 1 ? "Clear" : "Remove"}</Text>
                    </Pressable>
                  </View>

                  <Text style={st.dataMuted}>Store</Text>
                  <View style={st.storePillRow}>
                    {recentStoreOptions.length === 0 ? (
                      <Text style={st.dataMuted}>No stores loaded.</Text>
                    ) : (
                      recentStoreOptions.map((store) => {
                        const active = set.storeId === store.id;
                        return (
                          <Pressable key={`${set.id}-${store.id}`} accessibilityRole="button" onPress={() => onUpdateStorePriceSet(set.id, "storeId", store.id)} style={[st.storePill, active && st.storePillActive]}>
                            <Text style={[st.storePillText, active && st.storePillTextActive]}>{store.name}</Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>

                  <TextInput value={set.storeId} onChangeText={(value) => onUpdateStorePriceSet(set.id, "storeId", value)} placeholder="Store ID" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={st.input} />
                  <TextInput value={set.price} onChangeText={(value) => onUpdateStorePriceSet(set.id, "price", value)} placeholder="Price" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" style={st.input} />
                </View>
              ))}
            </View>
            <Text style={st.dataMuted}>Leave blank to save the product without price data. Multiple sets are supported.</Text>

            <Text style={st.fieldLabel}>Price Period</Text>
            <View style={st.formRow}>
              <Pressable accessibilityRole="button" onPress={() => onPickPeriodDate("start")} style={[st.btn, st.btnGhost, st.dateBtn]}>
                <Text style={periodStartDate ? st.dateBtnText : st.dateBtnPlaceholder}>{periodStartDate || "Select start date"}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onPickPeriodDate("end")} style={[st.btn, st.btnGhost, st.dateBtn]}>
                <Text style={periodEndDate ? st.dateBtnText : st.dateBtnPlaceholder}>{periodEndDate || "Select end date"}</Text>
              </Pressable>
            </View>
            <View style={st.formRow}>
              <TextInput value={periodStartDate} onChangeText={onPeriodStartChange} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
              <TextInput value={periodEndDate} onChangeText={onPeriodEndChange} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
            </View>
            <Text style={st.dataMuted}>Date format: YYYY-MM-DD</Text>
          </ScrollView>

          <View style={st.modalActionRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]}>
              <Text style={st.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSave} style={[st.btn, st.btnPrimary]} disabled={submitting}>
              <Text style={st.btnPrimaryText}>{submitting ? "Saving..." : editingProductId ? "Save Product" : "Create Product"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
