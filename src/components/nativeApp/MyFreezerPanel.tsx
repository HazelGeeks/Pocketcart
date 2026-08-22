import React from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import useMyFreezer from "../../hooks/useMyFreezer";
import type { MyFreezerItem } from "../../services/myFreezer";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  emptyFreezerItemDraft,
  type FreezerItemDraft,
  type FreezerStorageArea,
  getFreezerExpiryState,
  validateFreezerItemDraft,
} from "../../utils/freezerItem";
import { AppIcon } from "../icons/AppIcon";
import { MyFreezerItemForm } from "./MyFreezerItemForm";

export function MyFreezerPanel({ userId }: { userId: string }) {
  const freezer = useMyFreezer(userId);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MyFreezerItem | null>(null);
  const [draft, setDraft] = React.useState<FreezerItemDraft>(emptyFreezerItemDraft);

  const openAdd = () => {
    setEditingItem(null);
    setDraft(emptyFreezerItemDraft());
    freezer.setMessage(null);
    setFormOpen(true);
  };
  const openEdit = (item: MyFreezerItem) => {
    setEditingItem(item);
    setDraft({
      name: item.name,
      storageArea: item.storage_area,
      quantity: String(item.quantity),
      unit: item.unit ?? "",
      expiresOn: item.expires_on ?? "",
      note: item.note ?? "",
    });
    freezer.setMessage(null);
    setFormOpen(true);
  };
  const closeForm = () => {
    setEditingItem(null);
    setFormOpen(false);
  };
  const submit = async () => {
    const validated = validateFreezerItemDraft(draft);
    if (!validated.ok) {
      freezer.setMessage(validated.error);
      return;
    }
    const saved = await freezer.save(draft, editingItem?.id);
    if (saved) closeForm();
  };

  const fridgeItems = freezer.items.filter((item) => item.storage_area === "fridge");
  const frozenItems = freezer.items.filter((item) => item.storage_area === "freezer");
  const attentionCount = freezer.items.filter((item) => {
    const state = getFreezerExpiryState(item.expires_on);
    return state === "expired" || state === "soon";
  }).length;

  return (
    <View style={st.freezerPage}>
      <View style={st.freezerIntroRow}>
        <View style={st.freezerIntroCopy}>
          <Text style={st.freezerIntroTitle}>Know what you already have</Text>
          <Text style={st.freezerHelp}>
            Track refrigerated and frozen food privately in your account.
          </Text>
        </View>
        {!formOpen ? (
          <Pressable accessibilityRole="button" onPress={openAdd} style={st.freezerAddButton}>
            <AppIcon name="add" color={C.white} size={18} strokeWidth={2.4} />
            <Text style={st.freezerAddButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={st.freezerSummaryRow}>
        <Summary label="Refrigerator" value={fridgeItems.length} icon="fridge" />
        <Summary label="Freezer" value={frozenItems.length} icon="freezer" />
        <Summary label="Use soon" value={attentionCount} icon="calendar" />
      </View>

      {freezer.message ? (
        <View style={st.freezerMessage} accessibilityRole="alert">
          <Text style={st.freezerMessageText}>{freezer.message}</Text>
        </View>
      ) : null}

      {formOpen ? (
        <MyFreezerItemForm
          draft={draft}
          editing={Boolean(editingItem)}
          saving={freezer.saving}
          onCancel={closeForm}
          onChange={setDraft}
          onSubmit={() => void submit()}
        />
      ) : null}

      {freezer.loading ? (
        <View style={st.freezerLoading}>
          <ActivityIndicator color={C.primaryDeep} />
          <Text style={st.freezerHelp}>Loading My Freezer…</Text>
        </View>
      ) : freezer.items.length === 0 && !formOpen ? (
        <View style={st.freezerEmpty}>
          <AppIcon name="freezer" color={C.primaryDeep} size={30} strokeWidth={1.8} />
          <Text style={st.freezerEmptyTitle}>Your shelves are ready</Text>
          <Text style={st.freezerHelp}>
            Add the food you have at home so it is easier to plan the next grocery trip.
          </Text>
          <Pressable accessibilityRole="button" onPress={openAdd} style={st.freezerEmptyButton}>
            <Text style={st.freezerEmptyButtonText}>Add your first item</Text>
          </Pressable>
        </View>
      ) : (
        <View style={st.freezerLists}>
          <FreezerSection
            title="Refrigerator"
            area="fridge"
            items={fridgeItems}
            deletingId={freezer.deletingId}
            onEdit={openEdit}
            onDelete={(item) => confirmDelete(item, freezer.remove)}
          />
          <FreezerSection
            title="Freezer"
            area="freezer"
            items={frozenItems}
            deletingId={freezer.deletingId}
            onEdit={openEdit}
            onDelete={(item) => confirmDelete(item, freezer.remove)}
          />
        </View>
      )}
    </View>
  );
}

function Summary({ label, value, icon }: { label: string; value: number; icon: "fridge" | "freezer" | "calendar" }) {
  return (
    <View style={st.freezerSummaryCard}>
      <AppIcon name={icon} color={C.primaryDeep} size={18} strokeWidth={2} />
      <Text style={st.freezerSummaryValue}>{value}</Text>
      <Text style={st.freezerSummaryLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function FreezerSection({
  title,
  area,
  items,
  deletingId,
  onEdit,
  onDelete,
}: {
  title: string;
  area: FreezerStorageArea;
  items: MyFreezerItem[];
  deletingId: string | null;
  onEdit: (item: MyFreezerItem) => void;
  onDelete: (item: MyFreezerItem) => void;
}) {
  return (
    <View style={st.freezerSection}>
      <View style={st.freezerSectionHeader}>
        <AppIcon name={area === "fridge" ? "fridge" : "freezer"} color={C.text} size={20} />
        <Text style={st.freezerSectionTitle}>{title}</Text>
        <Text style={st.freezerSectionCount}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={st.freezerSectionEmpty}>No items recorded here.</Text>
      ) : (
        <View style={st.freezerItemList}>
          {items.map((item) => (
            <FreezerItemRow
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function FreezerItemRow({ item, deleting, onEdit, onDelete }: {
  item: MyFreezerItem;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const expiry = getFreezerExpiryState(item.expires_on);
  const expiryLabel = item.expires_on
    ? expiry === "expired" ? `Expired ${item.expires_on}` : expiry === "soon" ? `Use soon · ${item.expires_on}` : `Best before ${item.expires_on}`
    : null;
  return (
    <View style={st.freezerItemRow}>
      <View style={st.freezerItemCopy}>
        <Text style={st.freezerItemName}>{item.name}</Text>
        <Text style={st.freezerItemMeta}>
          {item.quantity}{item.unit ? ` ${item.unit}` : ""}
        </Text>
        {expiryLabel ? <Text style={[st.freezerExpiry, expiry !== "later" && st.freezerExpiryAttention]}>{expiryLabel}</Text> : null}
        {item.note ? <Text style={st.freezerItemNote}>{item.note}</Text> : null}
      </View>
      <View style={st.freezerItemActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={onEdit} style={st.freezerIconButton}>
          <AppIcon name="edit" color={C.textSoft} size={17} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} accessibilityState={{ disabled: deleting }} disabled={deleting} onPress={onDelete} style={st.freezerIconButton}>
          <AppIcon name="delete" color="#A83939" size={17} />
        </Pressable>
      </View>
    </View>
  );
}

function confirmDelete(item: MyFreezerItem, remove: (itemId: string) => Promise<boolean>) {
  Alert.alert("Remove food?", `${item.name} will be removed from My Freezer.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => { void remove(item.id); } },
  ]);
}
