import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import { marketingPalette as C } from "../../shared/design/palette";
import type { StorePriceSetInput } from "../../utils/adminScreenHelpers";
import AdminProductPriceSetsEditor from "./AdminProductPriceSetsEditor";

type Props = {
  visible: boolean;
  editingProductId: string | null;
  submitting: boolean;
  imageUploading: boolean;
  productKoreanName: string;
  productEnglishName: string;
  productUnit: string;
  productCategory: string;
  productCategoryCustom: string;
  productThumb: string;
  storePriceSets: StorePriceSetInput[];
  categoryOptions: string[];
  storeOptions: AdminStore[];
  styles: any;
  onKoreanNameChange: (value: string) => void;
  onEnglishNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCategoryCustomChange: (value: string) => void;
  onThumbChange: (value: string) => void;
  onUploadImage: () => void;
  onPasteImage: () => void;
  onPasteImageEvent: (event: ClipboardEvent) => boolean;
  onAddStorePriceSet: () => void;
  onRemoveStorePriceSet: (id: string) => void;
  onUpdateStorePriceSet: (
    id: string,
    field: "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate",
    value: string,
  ) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AdminProductFormModal({
  visible,
  editingProductId,
  submitting,
  imageUploading,
  productKoreanName,
  productEnglishName,
  productUnit,
  productCategory,
  productCategoryCustom,
  productThumb,
  storePriceSets,
  categoryOptions,
  storeOptions,
  styles: st,
  onKoreanNameChange,
  onEnglishNameChange,
  onUnitChange,
  onCategoryChange,
  onCategoryCustomChange,
  onThumbChange,
  onUploadImage,
  onPasteImage,
  onPasteImageEvent,
  onAddStorePriceSet,
  onRemoveStorePriceSet,
  onUpdateStorePriceSet,
  onClose,
  onSave,
}: Props) {
  React.useEffect(() => {
    if (!visible || Platform.OS !== "web") return undefined;
    const win = (globalThis as { window?: Window }).window;
    if (!win) return undefined;
    const handlePaste = (event: ClipboardEvent) => {
      onPasteImageEvent(event);
    };
    win.addEventListener("paste", handlePaste);
    return () => {
      win.removeEventListener("paste", handlePaste);
    };
  }, [onPasteImageEvent, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBackdrop}>
        <View style={[st.modalCard, st.productEditorModalCard]}>
          <View style={st.modalHeader}>
            <View>
              <Text style={st.modalTitle}>{editingProductId ? "Edit Product" : "Add Product"}</Text>
              <Text style={st.modalSub}>
                {editingProductId
                  ? "Update product details, image, and dated sale price rows."
                  : "Register a product, then optionally attach dated sale price rows by store."}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
            <View style={st.productImageTopSection}>
              <View style={st.productImageTopCopy}>
                <Text style={st.fieldLabel}>Product Image</Text>
                <Text style={st.dataMuted}>
                  Upload a file, paste an image URL, or copy an image and press Cmd/Ctrl+V while
                  this modal is open.
                </Text>
              </View>
              <View style={st.productEditorTopLayout}>
                <View style={st.productImageControls}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={onUploadImage}
                    style={[st.imageUploadArea, (imageUploading || submitting) && st.btnDisabled]}
                    disabled={imageUploading || submitting}
                  >
                    {productThumb ? (
                      <Image
                        source={{ uri: productThumb }}
                        style={st.modalImagePreview}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[st.modalImagePreview, st.modalImagePlaceholder]}>
                        <Text style={st.dataMuted}>Tap to upload</Text>
                      </View>
                    )}
                    <View style={st.imageUploadOverlay}>
                      {imageUploading ? <ActivityIndicator color="#ffffff" size="small" /> : null}
                      <Text style={st.imageUploadOverlayText}>
                        {imageUploading
                          ? "Uploading..."
                          : productThumb
                            ? "Replace image"
                            : "Upload image"}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={st.productImageActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onUploadImage}
                      style={[st.btn, st.btnGhost, st.productImageActionBtn]}
                      disabled={imageUploading || submitting}
                    >
                      <Text style={st.btnGhostText}>Upload image</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onPasteImage}
                      style={[st.btn, st.btnGhost, st.productImageActionBtn]}
                      disabled={imageUploading || submitting}
                    >
                      <Text style={st.btnGhostText}>Paste image</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    value={productThumb}
                    onChangeText={onThumbChange}
                    placeholder="Paste image URL"
                    placeholderTextColor={C.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[st.input, st.productImageUrlInput]}
                  />
                </View>

                <View style={st.productDetailsTopSection}>
                  <View style={st.modalTopGrid}>
                    <View style={[st.modalTopCell, st.modalTopCellHalf]}>
                      <Text style={st.fieldLabel}>English Name (Primary)</Text>
                      <TextInput
                        value={productEnglishName}
                        onChangeText={onEnglishNameChange}
                        placeholder="Product name in English"
                        placeholderTextColor={C.textMuted}
                        autoCorrect={false}
                        style={st.input}
                      />
                    </View>
                    <View style={[st.modalTopCell, st.modalTopCellHalf]}>
                      <Text style={st.fieldLabel}>Korean Name</Text>
                      <TextInput
                        value={productKoreanName}
                        onChangeText={onKoreanNameChange}
                        placeholder="한국어 상품명"
                        placeholderTextColor={C.textMuted}
                        style={st.input}
                      />
                    </View>
                    <View style={st.modalTopCell}>
                      <Text style={st.fieldLabel}>Unit</Text>
                      <TextInput
                        value={productUnit}
                        onChangeText={onUnitChange}
                        placeholder="2L, 500g (optional)"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={st.input}
                      />
                    </View>
                  </View>

                  <View style={st.modalTopGrid}>
                    <View style={st.modalTopCell}>
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
                </View>
              </View>
            </View>

            <Text style={st.fieldLabel}>Category</Text>
            <View style={st.choiceRow}>
              {categoryOptions.map((category) => {
                const active = productCategory.trim().toLowerCase() === category.toLowerCase();
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    onPress={() => {
                      onCategoryChange(category);
                      onCategoryCustomChange("");
                    }}
                    style={[st.choiceChip, active && st.choiceChipActive]}
                  >
                    <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AdminProductPriceSetsEditor
              visible={visible}
              submitting={submitting}
              sets={storePriceSets}
              stores={storeOptions}
              styles={st}
              onAdd={onAddStorePriceSet}
              onRemove={onRemoveStorePriceSet}
              onUpdate={onUpdateStorePriceSet}
            />
          </ScrollView>

          <View style={st.modalActionRow}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[st.btn, st.btnGhost]}>
              <Text style={st.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onSave}
              style={[st.btn, st.btnPrimary]}
              disabled={submitting}
            >
              <Text style={st.btnPrimaryText}>
                {submitting ? "Saving..." : editingProductId ? "Save Product" : "Create Product"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
