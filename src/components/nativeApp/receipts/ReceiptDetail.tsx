import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { deleteReceipt, receiptError, receiptPhotoUrl } from "../../../services/receipts";
import { receiptMoney, type Receipt } from "../../../utils/receipts";
import { AppIcon } from "../../icons/AppIcon";
import { ReceiptButton } from "./ReceiptControls";
import { rs } from "./receiptStyles";
export function ReceiptDetail({
  userId,
  receipt,
  onClose,
  onEdit,
  onDeleted,
}: {
  userId: string;
  receipt: Receipt;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const deleting = React.useRef(false);
  React.useEffect(() => {
    let current = true;
    setUrl(null);
    setPhotoError(false);
    if (receipt.photo_path)
      void receiptPhotoUrl(userId, receipt.photo_path)
        .then((next) => {
          if (current) setUrl(next);
        })
        .catch(() => {
          if (current) setPhotoError(true);
        });
    return () => {
      current = false;
    };
  }, [userId, receipt.photo_path, retry]);
  const remove = async () => {
    if (deleting.current) return;
    deleting.current = true;
    setBusy(true);
    setError(null);
    try {
      await deleteReceipt(userId, receipt);
      onDeleted();
    } catch (e) {
      setError(receiptError(e));
    } finally {
      deleting.current = false;
      setBusy(false);
    }
  };
  const money = (n: number) => receiptMoney(n, receipt.currency);
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <View style={[rs.modal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[rs.between, { padding: 20 }]}>
          <Text accessibilityRole="header" style={rs.title}>
            Receipt details
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close receipt details"
            disabled={busy}
            onPress={onClose}
            style={rs.icon}
          >
            <AppIcon name="close" color="#075E31" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={rs.modalContent}>
          <View style={rs.card}>
            <Text style={rs.title}>{receipt.store_name}</Text>
            <Text style={rs.muted}>
              {receipt.purchased_on} · {receipt.currency}
            </Text>
            <Text style={rs.amount}>{money(receipt.total_cents)}</Text>
            <Text style={rs.muted}>Total paid</Text>
          </View>
          {receipt.photo_path ? (
            photoError ? (
              <ReceiptButton
                secondary
                label="Retry receipt photo"
                onPress={() => setRetry((r) => r + 1)}
              />
            ) : url ? (
              <Image
                source={{ uri: url }}
                style={[rs.photo, { height: 520 }]}
                resizeMode="contain"
                accessibilityLabel="Saved receipt photo"
                onError={() => setPhotoError(true)}
              />
            ) : (
              <ActivityIndicator />
            )
          ) : null}
          <View style={rs.card}>
            <Text style={rs.title}>Purchased items</Text>
            {receipt.items.map((item, i) => (
              <View key={`${i}-${item.name}`} style={rs.stack}>
                <View style={rs.between}>
                  <View style={rs.flex}>
                    <Text style={rs.text}>{item.name}</Text>
                    <Text style={rs.muted}>
                      {item.quantity}
                      {item.unitPriceCents === null ? "" : ` × ${money(item.unitPriceCents)}`}
                    </Text>
                  </View>
                  <Text style={rs.text}>{money(item.lineTotalCents)}</Text>
                </View>
                <View style={rs.divider} />
              </View>
            ))}
            <View style={rs.between}>
              <Text style={rs.muted}>Tax</Text>
              <Text style={rs.text}>{money(receipt.tax_cents)}</Text>
            </View>
            <View style={rs.between}>
              <Text style={rs.muted}>Extra discount</Text>
              <Text style={rs.text}>−{money(receipt.discount_cents)}</Text>
            </View>
            <View style={rs.between}>
              <Text style={rs.text}>Total paid</Text>
              <Text style={rs.text}>{money(receipt.total_cents)}</Text>
            </View>
          </View>
          {error ? (
            <Text accessibilityRole="alert" style={rs.error}>
              {error}
            </Text>
          ) : null}
          <ReceiptButton label="Edit details" disabled={busy} onPress={onEdit} />
          <ReceiptButton
            label={busy ? "Deleting…" : "Delete receipt"}
            disabled={busy}
            secondary
            onPress={() =>
              Alert.alert(
                "Delete this receipt?",
                "The receipt and its photo will be removed from your account and spending totals.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      void remove();
                    },
                  },
                ],
              )
            }
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
