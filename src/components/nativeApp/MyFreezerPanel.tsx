import React from "react";
import useFreezerProductImages from "../../hooks/useFreezerProductImages";
import type { ShoppingListItem } from "../../utils/shoppingListState";
import useFreezerStorage from "../../hooks/useFreezerStorage";
import type { FreezerStorageUnit } from "../../services/freezerStorage";
import { storageTypeLabel } from "../../utils/freezerStorage";
import { FreezerCategoryFilter, type FreezerCategory } from "./FreezerCategoryFilter";
import { FreezerSection } from "./FreezerSection";
import { FreezerStorageForm } from "./FreezerStorageForm";
import { AppSheet } from "./AppSheet";
import { useFamily } from "../../contexts/FamilyContext";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import useMyFreezer from "../../hooks/useMyFreezer";
import type { MyFreezerItem } from "../../services/myFreezer";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import {
  emptyFreezerItemDraft,
  type FreezerItemDraft,
  getFreezerExpiryState,
  validateFreezerItemDraft,
} from "../../utils/freezerItem";
import { AppIcon } from "../icons/AppIcon";
import { MyFreezerItemForm } from "./MyFreezerItemForm";

export function MyFreezerPanel({ userId, cartItems = [] }: { userId: string; cartItems?: ShoppingListItem[] }) {
  const family = useFamily();
  const freezer = useMyFreezer(userId);
  const storage = useFreezerStorage(userId);
  const imageItems = useFreezerProductImages(freezer.items, cartItems);
  const [category, setCategory] = React.useState<FreezerCategory>("all");
  const [storageOpen, setStorageOpen] = React.useState(false);
  const [editingStorage, setEditingStorage] = React.useState<FreezerStorageUnit | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MyFreezerItem | null>(null);
  const [draft, setDraft] = React.useState<FreezerItemDraft>(emptyFreezerItemDraft);

  React.useEffect(() => { setFormOpen(false); setEditingItem(null); setStorageOpen(false); }, [family.family?.id]);

  const openAdd = () => {
    setEditingItem(null);
    setDraft({ ...emptyFreezerItemDraft(), storageArea: category === "freezer" ? "freezer" : "fridge" });
    freezer.setMessage(null);
    setFormOpen(true);
  };
  const openEdit = (item: MyFreezerItem) => {
    setEditingItem(item);
    setDraft({
      name: item.name,
      productId: item.product_id ?? undefined,
      storageArea: item.storage_area,
      storageUnitId: item.storage_unit_id ?? null,
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
    const saved = await freezer.save(draft, editingItem?.id, editingItem?.updated_at);
    if (saved) {
      if (category !== "all") setCategory(draft.storageArea);
      closeForm();
    }
  };

  const visibleItems = imageItems.filter(item => category === "all" || item.storage_area === category);
  const visibleUnits = storage.units.filter(unit => category === "all" || unit.storage_area === category);
  const unassignedItems = visibleItems.filter(item => item.storage_unit_id && !storage.units.some(unit => unit.id === item.storage_unit_id));
  const fridgeItems = visibleItems.filter((item) => item.storage_area === "fridge" && !item.storage_unit_id);
  const frozenItems = visibleItems.filter((item) => item.storage_area === "freezer" && !item.storage_unit_id);
  const attentionCount = visibleItems.filter((item) => {
    const state = getFreezerExpiryState(item.expires_on);
    return state === "expired" || state === "soon";
  }).length;

  return (
    <View style={st.freezerPage}>
      <View style={st.freezerIntroRow}>
        <View style={st.freezerIntroCopy}>
          <Text style={st.freezerIntroTitle}>{family.family ? `${family.family.name} · Shared` : "My food"}</Text>
          <Text style={st.freezerHelp}>
            {`${visibleItems.length} ${visibleItems.length === 1 ? "item" : "items"} · ${attentionCount} use soon`}
          </Text>
        </View>
        {!formOpen ? (
          <Pressable accessibilityRole="button" onPress={openAdd} accessibilityState={{ disabled: storage.loading }} disabled={storage.loading} style={[st.freezerAddButton, storage.loading && st.freezerButtonDisabled]}>
            <AppIcon name="add" color={C.white} size={18} strokeWidth={2.4} />
            <Text style={st.freezerAddButtonText}>Add food</Text>
          </Pressable>
        ) : null}
      </View>

      <FreezerCategoryFilter selected={category} onSelect={setCategory} />

      {storage.error ? <View style={st.freezerMessage}>
        <Text accessibilityRole="alert" style={st.freezerMessageText}>{storage.error}</Text>
        <Pressable accessibilityRole="button" onPress={() => void storage.reload()} style={st.freezerTextButton}><Text style={st.freezerTextButtonLabel}>Retry</Text></Pressable>
      </View> : null}
      <AppSheet title={editingStorage ? "Edit storage" : "Add storage"} visible={storageOpen} busy={storage.saving || storage.deleting} onClose={() => setStorageOpen(false)}>
        {storageOpen ? <FreezerStorageForm storage={storage} unit={editingStorage} initialArea={category === "freezer" ? "freezer" : "fridge"}
          onSaved={area => { if (category !== "all") setCategory(area); setStorageOpen(false); }}
          onDeleted={() => { setStorageOpen(false); setEditingStorage(null); void freezer.load(); }} /> : null}
      </AppSheet>
      {freezer.message ? (
        <View style={st.freezerMessage} accessibilityRole="alert">
          <Text style={st.freezerMessageText}>{freezer.message}</Text>
        </View>
      ) : null}

      <AppSheet title={editingItem ? "Edit food" : "Add food"} visible={formOpen} busy={freezer.saving} onClose={closeForm}>
        {freezer.message ? <Text accessibilityRole="alert" style={st.freezerMessageText}>{freezer.message}</Text> : null}
        <MyFreezerItemForm storageUnits={storage.units} hideHeader
          draft={draft}
          editing={Boolean(editingItem)}
          saving={freezer.saving}
          onCancel={closeForm}
          onChange={setDraft}
          onSubmit={() => void submit()}
        />
      </AppSheet>

      {freezer.loading || storage.loading ? (
        <View style={st.freezerLoading}>
          <ActivityIndicator color={C.primaryDeep} />
          <Text style={st.freezerHelp}>Loading My Freezer…</Text>
        </View>
      ) : visibleItems.length === 0 && visibleUnits.length === 0 && !formOpen ? (
        <View style={st.freezerEmpty}>
          <AppIcon name={category === "freezer" ? "freezer" : "fridge"} color={C.primaryDeep} size={30} strokeWidth={1.8} />
          <Text style={st.freezerEmptyTitle}>{category === "all" ? "Your shelves are ready" : `No ${category === "fridge" ? "refrigerator" : "freezer"} items yet`}</Text>
          <Text style={st.freezerHelp}>
            Add the food you have at home so it is easier to plan the next grocery trip.
          </Text>
          <Pressable accessibilityRole="button" onPress={openAdd} style={st.freezerEmptyButton}>
            <Text style={st.freezerEmptyButtonText}>Add your first item</Text>
          </Pressable>
        </View>
      ) : (
        <View style={st.freezerLists}>
          {visibleUnits.map(unit => (
            <FreezerSection key={unit.id} title={unit.name} area={unit.storage_area} emoji={unit.emoji} color={unit.color}
              items={imageItems.filter(item => item.storage_unit_id === unit.id)}
              deletingId={freezer.deletingId} onEdit={openEdit} onDelete={item => confirmDelete(item, freezer.remove)}
              onRename={() => { setEditingStorage(unit); setStorageOpen(true); }} />
          ))}
          {(["fridge", "freezer"] as const).map(area => {
            if (category !== "all" && category !== area) return null;
            const items = area === "fridge" ? fridgeItems : frozenItems;
            if (visibleUnits.length > 0 && items.length === 0) return null;
            return <FreezerSection key={area} title={storageTypeLabel(area)} area={area} items={items}
              deletingId={freezer.deletingId} onEdit={openEdit} onDelete={item => confirmDelete(item, freezer.remove)} />;
          })}
          {unassignedItems.length > 0 ? (
            <FreezerSection title="Other stored food" area={category === "freezer" ? "freezer" : "fridge"}
              items={unassignedItems}
              deletingId={freezer.deletingId} onEdit={openEdit} onDelete={item => confirmDelete(item, freezer.remove)} />
          ) : null}
        </View>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel="Add refrigerator or freezer" accessibilityState={{ disabled: storage.loading }} disabled={storage.loading}
        onPress={() => { setEditingStorage(null); setStorageOpen(true); }} style={({ pressed }) => [st.freezerStorageOption, { justifyContent: "center" }, pressed && st.freezerButtonPressed, storage.loading && st.freezerButtonDisabled]}>
        <AppIcon name="fridge" color={C.primaryDeep} size={24} />
        <Text style={st.freezerTextButtonLabel}>Add refrigerator or freezer</Text>
        <AppIcon name="add" color={C.primaryDeep} size={20} />
      </Pressable>
    </View>
  );
}

function confirmDelete(item: MyFreezerItem, remove: (itemId: string) => Promise<boolean>) {
  Alert.alert("Remove food?", `${item.name} will be removed from My Freezer.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => { void remove(item.id); } },
  ]);
}
