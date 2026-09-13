import { CartProductThumbnail } from "./CartProductThumbnail";
import { FreezerStorageBadge } from "./FreezerStorageBadge";
import { Pressable, Text, View } from "react-native";
import type { MyFreezerItem } from "../../services/myFreezer";
import { getFreezerExpiryState, type FreezerStorageArea } from "../../utils/freezerItem";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { DEFAULT_STORAGE_COLOR } from "../../utils/freezerStorageAppearance";
import { storageTypeLabel } from "../../utils/freezerStorage";
import { AppIcon } from "../icons/AppIcon";

export function FreezerSection({
  title,
  area,
  items,
  deletingId,
  onEdit,
  onDelete,
  onRename,
  emoji,
  color,
}: {
  onRename?: () => void;
  emoji?: string | null;
  color?: string;
  title: string;
  area: FreezerStorageArea;
  items: MyFreezerItem[];
  deletingId: string | null;
  onEdit: (item: MyFreezerItem) => void;
  onDelete: (item: MyFreezerItem) => void;
}) {
  return (
    <View style={st.freezerSection}>
      <View style={[st.freezerSectionHeader, onRename && { borderLeftWidth: 3, borderLeftColor: color ?? DEFAULT_STORAGE_COLOR, paddingLeft: 10 }]}>
        <FreezerStorageBadge area={area} emoji={emoji} color={color} />
        <View style={st.freezerItemCopy}>
          <Text style={st.freezerSectionTitle}>{title}</Text>
          {onRename ? <Text style={st.freezerHelp}>{storageTypeLabel(area)}</Text> : null}
        </View>
        <Text style={st.freezerSectionCount}>{items.length}</Text>
        {onRename ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title} storage`} onPress={onRename} style={st.freezerIconButton}><AppIcon name="edit" color={C.textSoft} size={18} /></Pressable> : null}
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
      <CartProductThumbnail uri={item.thumbnail_url} category={item.category} name={item.name} />
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
