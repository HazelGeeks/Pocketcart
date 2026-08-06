import React from "react";
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import type { AdminStore } from "../../services/adminBackoffice";
import { WEB_FILTER_SELECT_STYLE, type StorePriceSetInput } from "../../utils/adminScreenHelpers";

type Props = {
  visible: boolean;
  editingProductId: string | null;
  submitting: boolean;
  imageUploading: boolean;
  productKoreanName: string;
  productEnglishName: string;
  productBrand: string;
  productGtin: string;
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
  onBrandChange: (value: string) => void;
  onGtinChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCategoryCustomChange: (value: string) => void;
  onThumbChange: (value: string) => void;
  onUploadImage: () => void;
  onPasteImage: () => void;
  onPasteImageEvent: (event: ClipboardEvent) => boolean;
  onAddStorePriceSet: () => void;
  onRemoveStorePriceSet: (id: string) => void;
  onUpdateStorePriceSet: (id: string, field: "brand" | "storeId" | "price" | "periodStartDate" | "periodEndDate", value: string) => void;
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
  productBrand,
  productGtin,
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
  onBrandChange,
  onGtinChange,
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
  const [openStoreSetId, setOpenStoreSetId] = React.useState<string | null>(null);

  const storeBrandLabel = React.useCallback((store: AdminStore) => store.brand?.trim() || "Other", []);

  const storeDisplayName = React.useCallback((store: AdminStore) => {
    const branchName = store.name.trim();
    const brand = store.brand?.trim();
    return brand ? `${brand} - ${branchName}` : branchName;
  }, []);

  const webDateInputStyle = React.useMemo<React.CSSProperties>(
    () => ({
      ...WEB_FILTER_SELECT_STYLE,
      flex: 1,
      minWidth: 180,
      height: 44,
      fontSize: 13,
    }),
    [],
  );

  const storeNameById = React.useMemo(() => {
    const map = new Map<string, AdminStore>();
    storeOptions.forEach((store) => {
      map.set(store.id, store);
    });
    return map;
  }, [storeOptions]);

  const storeBrandOptions = React.useMemo(() => {
    const brands = new Set<string>();
    storeOptions.forEach((store) => {
      brands.add(storeBrandLabel(store));
    });
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  }, [storeOptions, storeBrandLabel]);

  React.useEffect(() => {
    if (!visible) {
      setOpenStoreSetId(null);
    }
  }, [visible]);

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
        <View style={st.modalCard}>
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
                  Upload a file, paste an image URL, or copy an image and press Cmd/Ctrl+V while this modal is open.
                </Text>
              </View>
              <View style={st.productEditorTopLayout}>
                <View style={st.productImageControls}>
                  <Pressable accessibilityRole="button" onPress={onUploadImage} style={[st.imageUploadArea, (imageUploading || submitting) && st.btnDisabled]} disabled={imageUploading || submitting}>
                    {productThumb ? (
                      <Image source={{ uri: productThumb }} style={st.modalImagePreview} resizeMode="cover" />
                    ) : (
                      <View style={[st.modalImagePreview, st.modalImagePlaceholder]}>
                        <Text style={st.dataMuted}>Tap to upload</Text>
                      </View>
                    )}
                    <View style={st.imageUploadOverlay}>
                      {imageUploading ? <ActivityIndicator color="#ffffff" size="small" /> : null}
                      <Text style={st.imageUploadOverlayText}>{imageUploading ? "Uploading..." : productThumb ? "Replace image" : "Upload image"}</Text>
                    </View>
                  </Pressable>
                  <View style={st.productImageActionRow}>
                    <Pressable accessibilityRole="button" onPress={onUploadImage} style={[st.btn, st.btnGhost, st.productImageActionBtn]} disabled={imageUploading || submitting}>
                      <Text style={st.btnGhostText}>Upload image</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={onPasteImage} style={[st.btn, st.btnGhost, st.productImageActionBtn]} disabled={imageUploading || submitting}>
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
                    <View style={[st.modalTopCell, st.modalTopCellHalf]}>
                      <Text style={st.fieldLabel}>Product Brand</Text>
                      <TextInput
                        value={productBrand}
                        onChangeText={onBrandChange}
                        placeholder="Manufacturer or brand (optional)"
                        placeholderTextColor={C.textMuted}
                        autoCorrect={false}
                        style={st.input}
                      />
                    </View>
                    <View style={[st.modalTopCell, st.modalTopCellHalf]}>
                      <Text style={st.fieldLabel}>GTIN / UPC / EAN</Text>
                      <TextInput
                        value={productGtin}
                        onChangeText={onGtinChange}
                        placeholder="8, 12, 13, or 14 digits"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="number-pad"
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
                  <Pressable key={category} accessibilityRole="button" onPress={() => { onCategoryChange(category); onCategoryCustomChange(""); }} style={[st.choiceChip, active && st.choiceChipActive]}>
                    <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={st.storePriceHeaderRow}>
              <View>
                <Text style={st.fieldLabel}>Sale Price Rows</Text>
                <Text style={st.dataMuted}>
                  Each row below saves one store price with its own sale period.
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={onAddStorePriceSet} style={[st.btn, st.btnGhost]} disabled={submitting}>
                <Text style={st.btnGhostText}>Add Set</Text>
              </Pressable>
            </View>

            <View style={st.storePriceGrid}>
              {storePriceSets.map((set, index) => {
                const selectedStore = storeNameById.get(set.storeId);
                const selectedBrand = selectedStore
                  ? storeBrandLabel(selectedStore)
                  : set.brand.trim();
                const visibleStoreOptions = selectedBrand
                  ? storeOptions.filter((store) => storeBrandLabel(store) === selectedBrand)
                  : [];
                const isOpen = openStoreSetId === set.id;

                return (
                  <View key={set.id} style={[st.storePriceCard, st.storePriceCardTwoCol]}>
                    <View style={st.storePriceCardHeader}>
                      <Text style={st.storePriceCardTitle}>Price Set {index + 1}</Text>
                      <Pressable accessibilityRole="button" onPress={() => onRemoveStorePriceSet(set.id)} style={[st.btn, st.btnDangerSoft]} disabled={submitting}>
                        <Text style={st.btnDangerSoftText}>{storePriceSets.length === 1 ? "Clear" : "Remove"}</Text>
                      </Pressable>
                    </View>

                    <View style={st.storePriceFieldGroup}>
                      <Text style={st.fieldLabel}>Brand</Text>
                      <View style={st.choiceRow}>
                        {storeBrandOptions.length === 0 ? (
                          <Text style={st.dataMuted}>No store brands loaded</Text>
                        ) : (
                          storeBrandOptions.map((brand) => {
                            const active = selectedBrand === brand;
                            return (
                              <Pressable
                                key={`${set.id}-brand-${brand}`}
                                accessibilityRole="button"
                                onPress={() => {
                                  onUpdateStorePriceSet(set.id, "brand", brand);
                                  if (set.storeId) {
                                    onUpdateStorePriceSet(set.id, "storeId", "");
                                  }
                                  setOpenStoreSetId(set.id);
                                }}
                                style={[st.choiceChip, active && st.choiceChipActive]}
                                disabled={submitting}
                              >
                                <Text style={[st.choiceChipText, active && st.choiceChipTextActive]}>{brand}</Text>
                              </Pressable>
                            );
                          })
                        )}
                      </View>

                      <Text style={st.fieldLabel}>Branch</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setOpenStoreSetId(isOpen ? null : set.id)}
                        style={st.storeDropdownButton}
                        disabled={submitting || storeOptions.length === 0 || !selectedBrand}
                      >
                        <View style={st.storeDropdownTextWrap}>
                          <Text style={selectedStore ? st.storeDropdownSelectedText : st.storeDropdownPlaceholderText} numberOfLines={1}>
                            {selectedStore ? storeDisplayName(selectedStore) : storeOptions.length === 0 ? "No stores loaded" : selectedBrand ? "All branches included" : "Select brand first"}
                          </Text>
                          {selectedStore && (selectedStore.address || selectedStore.area) ? (
                            <Text style={st.storeDropdownMetaText} numberOfLines={1}>{selectedStore.address || selectedStore.area}</Text>
                          ) : selectedBrand ? (
                            <Text style={st.storeDropdownMetaText} numberOfLines={1}>{visibleStoreOptions.length} branches will be included</Text>
                          ) : null}
                        </View>
                        <Text style={st.storeDropdownChevron}>{isOpen ? "Hide" : "Show"}</Text>
                      </Pressable>

                      {isOpen ? (
                        <View style={st.storeDropdownMenu}>
                          <ScrollView style={st.storeDropdownScroll} nestedScrollEnabled>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                onUpdateStorePriceSet(set.id, "storeId", "");
                                setOpenStoreSetId(null);
                              }}
                              style={[st.storeDropdownOption, !set.storeId && st.storeDropdownOptionActive]}
                            >
                              <Text style={[st.storeDropdownOptionText, !set.storeId && st.storeDropdownOptionTextActive]} numberOfLines={1}>
                                All branches
                              </Text>
                              <Text style={st.storeDropdownOptionMeta} numberOfLines={1}>
                                Apply this price to every {selectedBrand} branch
                              </Text>
                            </Pressable>
                            {visibleStoreOptions.map((store) => {
                              const active = set.storeId === store.id;
                              return (
                                <Pressable
                                  key={`${set.id}-${store.id}`}
                                  accessibilityRole="button"
                                  onPress={() => {
                                    onUpdateStorePriceSet(set.id, "storeId", store.id);
                                    setOpenStoreSetId(null);
                                  }}
                                  style={[st.storeDropdownOption, active && st.storeDropdownOptionActive]}
                                >
                                  <Text style={[st.storeDropdownOptionText, active && st.storeDropdownOptionTextActive]} numberOfLines={1}>
                                    {store.name}
                                  </Text>
                                  <Text style={st.storeDropdownOptionMeta} numberOfLines={1}>{store.address || store.area}</Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                        </View>
                      ) : null}
                    </View>

                    <View style={st.storePriceFieldGroup}>
                      <Text style={st.fieldLabel}>Sale Period</Text>
                      <View style={st.formRow}>
                        {Platform.OS === "web" ? (
                          <>
                            <input
                              aria-label={`Sale period start date for price set ${index + 1}`}
                              type="date"
                              value={set.periodStartDate}
                              onChange={(event) => onUpdateStorePriceSet(set.id, "periodStartDate", (event.target as HTMLInputElement).value)}
                              style={webDateInputStyle}
                            />
                            <input
                              aria-label={`Sale period end date for price set ${index + 1}`}
                              type="date"
                              value={set.periodEndDate}
                              onChange={(event) => onUpdateStorePriceSet(set.id, "periodEndDate", (event.target as HTMLInputElement).value)}
                              style={webDateInputStyle}
                            />
                          </>
                        ) : (
                          <>
                            <TextInput value={set.periodStartDate} onChangeText={(value) => onUpdateStorePriceSet(set.id, "periodStartDate", value)} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
                            <TextInput value={set.periodEndDate} onChangeText={(value) => onUpdateStorePriceSet(set.id, "periodEndDate", value)} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={C.textMuted} autoCapitalize="none" autoCorrect={false} style={[st.input, st.inputNarrow]} />
                          </>
                        )}
                      </View>
                    </View>

                    <View style={st.storePriceFieldGroup}>
                      <Text style={st.fieldLabel}>Current Sale Price</Text>
                      <TextInput
                        value={set.price}
                        onChangeText={(value) => onUpdateStorePriceSet(set.id, "price", value)}
                        placeholder="0.00"
                        placeholderTextColor={C.textMuted}
                        keyboardType="decimal-pad"
                        style={st.input}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <Text style={st.dataMuted}>Leave a row blank to save only the product catalog item. Add another set for next week's different price.</Text>
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
