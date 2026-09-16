import { Pressable, Text, View } from "react-native";
import type { ReceiptDraft } from "../../../utils/receiptDraft";
import { RECEIPT_CURRENCIES } from "../../../utils/receipts";
import { ReceiptField } from "./ReceiptControls";
import { ReceiptItemsEditor } from "./ReceiptItemsEditor";
import { rs } from "./receiptStyles";
export function ReceiptFields({
  draft,
  update,
  disabled,
}: {
  draft: ReceiptDraft;
  update: (patch: Partial<ReceiptDraft>) => void;
  disabled: boolean;
}) {
  return (
    <>
      <View style={rs.card}>
        <ReceiptField
          label="Store"
          value={draft.store}
          onChange={(store) => update({ store })}
          disabled={disabled}
          placeholder="Store name"
        />
        <ReceiptField
          label="Purchase date (YYYY-MM-DD)"
          value={draft.date}
          onChange={(date) => update({ date })}
          disabled={disabled}
        />
        <Text style={rs.label}>Currency</Text>
        <View style={[rs.row, { flexWrap: "wrap" }]}>
          {RECEIPT_CURRENCIES.map((currency) => (
            <Pressable
              key={currency}
              accessibilityRole="button"
              accessibilityState={{ selected: draft.currency === currency }}
              disabled={disabled}
              onPress={() => update({ currency })}
              style={[
                rs.icon,
                { paddingHorizontal: 10 },
                draft.currency === currency && rs.selected,
              ]}
            >
              <Text style={draft.currency === currency ? rs.selectedText : rs.muted}>
                {currency}
              </Text>
            </Pressable>
          ))}
        </View>
        {!RECEIPT_CURRENCIES.some((c) => c === draft.currency) ? (
          <Text style={rs.error}>Choose the currency printed on your receipt.</Text>
        ) : null}
      </View>
      <ReceiptItemsEditor
        items={draft.items}
        onChange={(items) => update({ items })}
        disabled={disabled}
      />
      <View style={rs.card}>
        <Text style={rs.title}>Payment</Text>
        <View style={rs.row}>
          <ReceiptField
            label="Tax"
            numeric
            value={draft.tax}
            onChange={(tax) => update({ tax })}
            disabled={disabled}
          />
          <ReceiptField
            label="Extra discount"
            numeric
            value={draft.discount}
            onChange={(discount) => update({ discount })}
            disabled={disabled}
          />
        </View>
        <Text style={rs.muted}>
          Extra discount is only for discounts not already included in the item totals. Use 0 if
          none.
        </Text>
        <ReceiptField
          label="Total paid"
          numeric
          value={draft.total}
          onChange={(total) => update({ total })}
          disabled={disabled}
          placeholder="0.00"
        />
        <Text style={rs.muted}>
          Daily, weekly and monthly spending use this final amount, including tax, deposits, fees
          and discounts.
        </Text>
      </View>
    </>
  );
}
