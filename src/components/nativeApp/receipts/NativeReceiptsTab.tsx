import React from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import useReceipts from "../../../hooks/useReceipts";
import {
  receiptDate,
  receiptMoney,
  receiptPeriodLabel,
  receiptTotals,
  receiptsForPeriod,
  shiftReceiptPeriod,
  type Receipt,
  type ReceiptPeriod,
} from "../../../utils/receipts";
import { AppIcon } from "../../icons/AppIcon";
import { ReceiptButton } from "./ReceiptControls";
import { ReceiptEditor } from "./ReceiptEditor";
import { ReceiptDetail } from "./ReceiptDetail";
import { rs } from "./receiptStyles";

export function NativeReceiptsTab({
  userId,
  onSignIn,
}: {
  userId: string | null;
  onSignIn: () => void;
}) {
  if (userId) return <ReceiptsAccount key={userId} userId={userId} />;
  return (
    <View style={rs.card}>
      <AppIcon name="receipt" color="#075E31" size={38} />
      <Text style={rs.title}>Your purchases, in one place</Text>
      <Text style={rs.muted}>
        Save receipt photos, keep track of what you bought and see your daily, weekly and monthly
        spending. Sign in to sync your receipts across devices.
      </Text>
      <ReceiptButton label="Sign in" onPress={onSignIn} />
    </View>
  );
}
function ReceiptsAccount({ userId }: { userId: string }) {
  const { receipts, loading, error, syncedAt, refresh } = useReceipts(userId);
  const [period, setPeriod] = React.useState<ReceiptPeriod>("month");
  const [anchor, setAnchor] = React.useState(receiptDate);
  const [query, setQuery] = React.useState("");
  const [detail, setDetail] = React.useState<Receipt | null>(null);
  const [editor, setEditor] = React.useState<{ existing?: Receipt; camera: boolean } | null>(null);
  const filtered = receiptsForPeriod(receipts, period, anchor);
  const totals = receiptTotals(filtered);
  const search = query.trim().toLowerCase();
  const rows = filtered.filter(
    (r) =>
      !search ||
      `${r.store_name} ${r.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(search),
  );
  const [visibleCount, setVisibleCount] = React.useState(30);
  React.useEffect(() => {
    setVisibleCount(30);
  }, [period, anchor, query]);
  const changed = () => {
    setEditor(null);
    setDetail(null);
    void refresh();
  };
  return (
    <View style={rs.stack}>
      <View style={rs.between}>
        <Text style={rs.muted}>Every purchase, accounted for.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh receipts"
          disabled={loading}
          onPress={() => {
            void refresh();
          }}
          style={rs.icon}
        >
          {loading ? (
            <ActivityIndicator color="#075E31" />
          ) : (
            <AppIcon name="retake" color="#075E31" size={19} />
          )}
        </Pressable>
      </View>
      <View style={rs.period}>
        {(["day", "week", "month"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === period }}
            onPress={() => setPeriod(value)}
            style={[rs.segment, period === value && rs.selected]}
          >
            <Text style={period === value ? rs.selectedText : rs.muted}>
              {value === "day" ? "Day" : value === "week" ? "Week" : "Month"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={rs.card}>
        <View style={rs.between}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Previous ${period}`}
            style={rs.icon}
            onPress={() => setAnchor((a) => shiftReceiptPeriod(period, a, -1))}
          >
            <Text style={rs.title}>‹</Text>
          </Pressable>
          <Text style={[rs.text, { flex: 1, textAlign: "center" }]}>
            {receiptPeriodLabel(period, anchor)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Next ${period}`}
            style={rs.icon}
            onPress={() => setAnchor((a) => shiftReceiptPeriod(period, a, 1))}
          >
            <Text style={rs.title}>›</Text>
          </Pressable>
        </View>
        {syncedAt ? (
          <>
            {totals.length ? (
              totals.map((total) => (
                <View key={total.currency}>
                  <Text style={rs.amount}>{receiptMoney(total.cents, total.currency)}</Text>
                  <Text style={rs.muted}>{total.currency} spent</Text>
                </View>
              ))
            ) : (
              <Text style={rs.amount}>{receiptMoney(0, "CAD")}</Text>
            )}
            <Text style={rs.muted}>
              {filtered.length} receipt{filtered.length === 1 ? "" : "s"} ·{" "}
              {period === "week" ? "Monday–Sunday · " : ""}Total paid, including tax
            </Text>
          </>
        ) : (
          <Text style={rs.muted}>
            {loading ? "Loading your spending…" : "Spending is unavailable until receipts sync."}
          </Text>
        )}
        <Pressable accessibilityRole="button" onPress={() => setAnchor(receiptDate())}>
          <Text style={rs.selectedText}>
            Back to {period === "day" ? "today" : `this ${period}`}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <View style={rs.warning}>
          <Text accessibilityRole="alert" style={rs.error}>
            {error}
          </Text>
          {syncedAt ? (
            <Text style={rs.muted}>
              Showing the last synced receipts. Refresh to see changes from other devices.
            </Text>
          ) : null}
          <ReceiptButton
            label="Retry sync"
            secondary
            disabled={loading}
            onPress={() => {
              void refresh();
            }}
          />
        </View>
      ) : null}
      <ReceiptButton label="Photograph receipt" onPress={() => setEditor({ camera: true })} />
      <ReceiptButton
        label="Enter receipt manually"
        secondary
        onPress={() => setEditor({ camera: false })}
      />
      <View style={rs.between}>
        <Text style={rs.title}>Receipt history</Text>
        <Text style={rs.muted}>{rows.length}</Text>
      </View>
      <TextInput
        accessibilityLabel="Search receipt store or purchased items"
        placeholder="Search store or item"
        placeholderTextColor="#78887C"
        value={query}
        onChangeText={setQuery}
        style={rs.search}
      />
      {rows.length ? (
        <View style={rs.card}>
          {rows.slice(0, visibleCount).map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              accessibilityLabel={`${r.store_name}, ${r.purchased_on}, ${r.currency} ${receiptMoney(r.total_cents, r.currency)}`}
              onPress={() => setDetail(r)}
              style={rs.receiptRow}
            >
              <View style={rs.badge}>
                <AppIcon name="receipt" color="#075E31" size={22} />
              </View>
              <View style={rs.flex}>
                <Text style={rs.text}>{r.store_name}</Text>
                <Text style={rs.muted}>
                  {r.purchased_on} · {r.items.length} items
                </Text>
                <Text style={rs.muted} numberOfLines={1}>
                  {r.items
                    .slice(0, 3)
                    .map((i) => i.name)
                    .join(", ")}
                </Text>
              </View>
              <View>
                <Text style={rs.text}>{receiptMoney(r.total_cents, r.currency)}</Text>
                <Text style={[rs.muted, { textAlign: "right" }]}>{r.currency}</Text>
              </View>
            </Pressable>
          ))}
          {rows.length > visibleCount ? (
            <ReceiptButton
              label="Show more receipts"
              secondary
              onPress={() => setVisibleCount((n) => n + 30)}
            />
          ) : null}
        </View>
      ) : !loading && syncedAt ? (
        <View style={rs.card}>
          <Text style={rs.text}>
            {search ? "No matching receipts in this period" : "No receipts in this period"}
          </Text>
          <Text style={rs.muted}>
            {search
              ? "Try a different store, item or date range."
              : "Photograph your next receipt or add a past purchase to start tracking."}
          </Text>
        </View>
      ) : null}
      <Text style={rs.muted}>
        Private to your account. Refreshed when you open Receipts or return to the app.
        {syncedAt
          ? ` Last synced ${syncedAt.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}.`
          : ""}
      </Text>
      {editor ? (
        <ReceiptEditor
          userId={userId}
          receipts={receipts}
          existing={editor.existing}
          startCamera={editor.camera}
          onClose={() => setEditor(null)}
          onSaved={changed}
        />
      ) : null}
      {detail ? (
        <ReceiptDetail
          userId={userId}
          receipt={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditor({ existing: detail, camera: false });
            setDetail(null);
          }}
          onDeleted={changed}
        />
      ) : null}
    </View>
  );
}
