import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  STORE_TYPE_OPTIONS,
  storeAddressSearchUrl,
  WEB_FILTER_SELECT_STYLE,
} from "../../utils/adminScreenHelpers";

type Props = {
  visible: boolean;
  isLg: boolean;
  editingStoreId: string | null;
  submitting: boolean;
  brand: string;
  name: string;
  latitude: string;
  longitude: string;
  priceNote: string;
  address: string;
  placeId: string;
  phone: string;
  website: string;
  hours: string;
  storeType: string;
  isActive: boolean;
  styles: any;
  onBrandChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onPriceNoteChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onPlaceIdChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onHoursChange: (value: string) => void;
  onStoreTypeChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onClose: () => void;
  onOpenMapUrl: (url: string) => void;
  onSave: () => void;
};

export default function AdminStoreFormModal({
  visible,
  isLg,
  editingStoreId,
  submitting,
  brand,
  name,
  latitude,
  longitude,
  priceNote,
  address,
  placeId,
  phone,
  website,
  hours,
  storeType,
  isActive,
  styles: st,
  onBrandChange,
  onNameChange,
  onLatitudeChange,
  onLongitudeChange,
  onPriceNoteChange,
  onAddressChange,
  onPlaceIdChange,
  onPhoneChange,
  onWebsiteChange,
  onHoursChange,
  onStoreTypeChange,
  onActiveChange,
  onClose,
  onOpenMapUrl,
  onSave,
}: Props) {
  const mapDisabled = !name.trim() && !address.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={st.modalBackdrop}>
        <View style={st.modalCard}>
          <View style={st.modalHeader}>
            <View>
              <Text style={st.modalTitle}>{editingStoreId ? "Edit Store" : "Add Store"}</Text>
              <Text style={st.modalSub}>
                Enter retailer, branch details, address, and coordinates. Coordinates are checked
                before saving.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[st.btn, st.btnGhost]}
              disabled={submitting}
            >
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={st.modalBody} contentContainerStyle={st.modalBodyContent}>
            <View style={st.modalTopGrid}>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Retailer</Text>
                <TextInput
                  value={brand}
                  onChangeText={onBrandChange}
                  placeholder="Safeway, No Frills, T&T"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Branch</Text>
                <TextInput
                  value={name}
                  onChangeText={onNameChange}
                  placeholder="Robson, Davie Street"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
            </View>

            <View style={st.modalTopGrid}>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Latitude</Text>
                <TextInput
                  value={latitude}
                  onChangeText={onLatitudeChange}
                  placeholder="Latitude"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Longitude</Text>
                <TextInput
                  value={longitude}
                  onChangeText={onLongitudeChange}
                  placeholder="Longitude"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={st.input}
                />
              </View>
            </View>

            <View style={st.modalTopGrid}>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Type</Text>
                {Platform.OS === "web" ? (
                  <select
                    value={storeType}
                    onChange={(event) =>
                      onStoreTypeChange((event.target as HTMLSelectElement).value)
                    }
                    style={WEB_FILTER_SELECT_STYLE}
                  >
                    {STORE_TYPE_OPTIONS.map((option) => (
                      <option key={`store-modal-type-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <View style={st.choiceRow}>
                    {STORE_TYPE_OPTIONS.map((option) => (
                      <Pressable
                        key={`store-modal-type-${option.value}`}
                        accessibilityRole="button"
                        onPress={() => onStoreTypeChange(option.value)}
                        style={[st.choiceChip, storeType === option.value && st.choiceChipActive]}
                      >
                        <Text
                          style={[
                            st.choiceChipText,
                            storeType === option.value && st.choiceChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <Text style={st.fieldLabel}>Status</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onActiveChange(!isActive)}
                  style={[st.btn, isActive ? st.btnPrimary : st.btnGhost, st.storeStatusToggle]}
                >
                  <Text style={isActive ? st.btnPrimaryText : st.btnGhostText}>
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={st.fieldLabel}>Details</Text>
            <View style={st.modalTopGrid}>
              <View style={st.modalTopCell}>
                <TextInput
                  value={address}
                  onChangeText={onAddressChange}
                  placeholder="Address"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <TextInput
                  value={placeId}
                  onChangeText={onPlaceIdChange}
                  placeholder="Google Place ID"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <TextInput
                  value={phone}
                  onChangeText={onPhoneChange}
                  placeholder="Phone"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <TextInput
                  value={website}
                  onChangeText={onWebsiteChange}
                  placeholder="Website"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <TextInput
                  value={hours}
                  onChangeText={onHoursChange}
                  placeholder="Hours"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
              <View style={[st.modalTopCell, isLg && st.modalTopCellHalf]}>
                <TextInput
                  value={priceNote}
                  onChangeText={onPriceNoteChange}
                  placeholder="Price note"
                  placeholderTextColor={C.textMuted}
                  style={st.input}
                />
              </View>
            </View>

            <View style={st.modalActionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenMapUrl(storeAddressSearchUrl(name, address, placeId))}
                style={[st.btn, st.btnGhost, mapDisabled && st.btnDisabled]}
                disabled={mapDisabled}
              >
                <Text style={st.btnGhostText}>Find on Map</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={[st.btn, st.btnGhost]}
                disabled={submitting}
              >
                <Text style={st.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onSave}
                style={[st.btn, st.btnPrimary]}
                disabled={submitting}
              >
                <Text style={st.btnPrimaryText}>
                  {submitting ? "Saving..." : editingStoreId ? "Update Store" : "Add Store"}
                </Text>
              </Pressable>
            </View>
            <Text style={st.dataMuted}>
              CSV headers: brand, name, latitude, longitude, price_note, address, place_id, phone,
              website, hours, store_type, is_active.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
