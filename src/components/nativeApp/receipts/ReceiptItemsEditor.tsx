import { Pressable, Text, View } from "react-native";
import { randomUUID } from "expo-crypto";
import type { ReceiptItemDraft } from "../../../utils/receiptDraft";
import { emptyReceiptItem } from "../../../utils/receiptDraft";
import { AppIcon } from "../../icons/AppIcon";
import { ReceiptButton, ReceiptField } from "./ReceiptControls";
import { rs } from "./receiptStyles";
export function ReceiptItemsEditor({
  items,
  onChange,
  disabled,
}: {
  items: ReceiptItemDraft[];
  onChange: (items: ReceiptItemDraft[]) => void;
  disabled: boolean;
}) {
  const update = (key: string, patch: Partial<ReceiptItemDraft>) =>
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  return (
    <View style={rs.stack}>
      <Text style={rs.title}>Purchased items</Text>
      <Text style={rs.muted}>
        Use the line total printed on your receipt after item discounts. Quantity can include
        weights such as 0.750 kg.
      </Text>
      {items.map((item, index) => (
        <View key={item.key} style={rs.card}>
          <View style={rs.between}>
            <Text style={rs.label}>ITEM {index + 1}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove item ${index + 1}`}
              disabled={disabled}
              onPress={() => onChange(items.filter((i) => i.key !== item.key))}
              style={rs.icon}
            >
              <AppIcon name="delete" size={19} color="#9A3029" />
            </Pressable>
          </View>
          <ReceiptField
            label={`Item ${index + 1} name`}
            value={item.name}
            onChange={(name) => update(item.key, { name })}
            disabled={disabled}
            placeholder="e.g. Organic milk, 2 L"
          />
          <View style={rs.row}>
            <ReceiptField
              label="Quantity / weight"
              numeric
              value={item.quantity}
              onChange={(quantity) => update(item.key, { quantity })}
              disabled={disabled}
            />
            <ReceiptField
              label="Unit price (optional)"
              numeric
              value={item.unitPrice}
              onChange={(unitPrice) => update(item.key, { unitPrice })}
              disabled={disabled}
              placeholder="0.00"
            />
          </View>
          <ReceiptField
            label={`Item ${index + 1} line total`}
            numeric
            value={item.lineTotal}
            onChange={(lineTotal) => update(item.key, { lineTotal })}
            disabled={disabled}
            placeholder="0.00"
          />
        </View>
      ))}
      <ReceiptButton
        label="Add item"
        secondary
        disabled={disabled || items.length >= 200}
        onPress={() => onChange([...items, emptyReceiptItem(randomUUID())])}
      />
    </View>
  );
}
