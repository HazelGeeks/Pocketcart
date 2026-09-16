import React from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { randomUUID } from "expo-crypto";
import { readReceiptPhoto, receiptError, saveReceipt } from "../../../services/receipts";
import {
  extractedReceiptDraft,
  receiptDraft,
  receiptDraftValues,
  type ReceiptDraft,
  type ReceiptPhoto,
} from "../../../utils/receiptDraft";
import {
  isPossibleDuplicate,
  receiptMoney,
  receiptReconciliation,
  validateReceipt,
  type Receipt,
} from "../../../utils/receipts";
import { AppIcon } from "../../icons/AppIcon";
import { ReceiptButton } from "./ReceiptControls";
import { ReceiptCamera } from "./ReceiptCamera";
import { ReceiptFields } from "./ReceiptFields";
import { rs } from "./receiptStyles";

type Props = {
  userId: string;
  existing?: Receipt;
  receipts: Receipt[];
  startCamera: boolean;
  onClose: () => void;
  onSaved: () => void;
};
export function ReceiptEditor({
  userId,
  existing,
  receipts,
  startCamera,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [id, setId] = React.useState(() => existing?.id ?? randomUUID());
  const [draft, setDraft] = React.useState(() => receiptDraft(existing));
  const [photo, setPhoto] = React.useState<ReceiptPhoto | null>(null);
  const [camera, setCamera] = React.useState(startCamera);
  const [busy, setBusy] = React.useState<"read" | "save" | null>(null);
  const busyRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewed, setReviewed] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const update = (patch: Partial<ReceiptDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setReviewed(false);
    setDirty(true);
  };
  const values = receiptDraftValues(draft);
  const validation = validateReceipt(values);
  const difference = validation ? 0 : receiptReconciliation(values);
  const duplicate =
    !existing && !validation && receipts.some((r) => isPossibleDuplicate(values, r));
  const close = () => {
    if (busyRef.current) return;
    if (camera) {
      setCamera(false);
      return;
    }
    if (!dirty) {
      onClose();
      return;
    }
    Alert.alert("Discard this draft?", "Your unsaved changes and photo will be discarded.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onClose },
    ]);
  };
  const read = async () => {
    if (!photo || busyRef.current) return;
    busyRef.current = true;
    setBusy("read");
    setError(null);
    try {
      setDraft(extractedReceiptDraft(await readReceiptPhoto(userId, photo)));
      setReviewed(false);
      setDirty(true);
    } catch (e) {
      setError(receiptError(e));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };
  const confirmRead = () =>
    Alert.alert(
      "Read receipt details?",
      "This sends the photo to OpenAI to read the receipt and replaces the fields below. Check all details before saving.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Read receipt",
          onPress: () => {
            void read();
          },
        },
      ],
    );
  const save = async () => {
    if (busyRef.current) return;
    if (validation) {
      setError(validation);
      return;
    }
    if (!reviewed) {
      setError("Check the receipt details and confirm below before saving.");
      return;
    }
    busyRef.current = true;
    setBusy("save");
    setError(null);
    try {
      await saveReceipt({ id, userId, values, photo, existing });
      onSaved();
    } catch (e) {
      setError(receiptError(e));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };
  return (
    <Modal visible animationType="slide" onRequestClose={close} presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={[rs.modal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[rs.between, { paddingHorizontal: 20, paddingVertical: 8 }]}>
          <Text accessibilityRole="header" style={rs.title}>
            {existing ? "Edit receipt" : "New receipt"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close receipt editor"
            disabled={Boolean(busy)}
            onPress={close}
            style={rs.icon}
          >
            <AppIcon name="close" color="#075E31" />
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={rs.modalContent}>
          {camera ? (
            <ReceiptCamera
              onCancel={() => setCamera(false)}
              onCapture={(next) => {
                setPhoto(next);
                setCamera(false);
                setId(randomUUID());
                setDirty(true);
                setReviewed(false);
              }}
            />
          ) : (
            <>
              {photo ? (
                <Image
                  source={{ uri: photo.uri }}
                  style={rs.photo}
                  resizeMode="contain"
                  accessibilityLabel="Captured receipt"
                />
              ) : null}
              {!existing ? (
                <ReceiptButton
                  label={photo ? "Retake photo" : "Photograph receipt"}
                  onPress={() => setCamera(true)}
                  disabled={Boolean(busy)}
                  secondary
                />
              ) : null}
              {photo ? (
                <>
                  <ReceiptButton
                    label={busy === "read" ? "Reading receipt…" : "Read receipt details"}
                    onPress={confirmRead}
                    disabled={Boolean(busy)}
                  />
                  <Text style={rs.muted}>
                    Optional: OpenAI reads the photo to fill in your purchase details. You can also
                    enter them yourself. Saving keeps this photo privately in your PocketCart
                    account.
                  </Text>
                </>
              ) : (
                <Text style={rs.muted}>
                  Record a purchase with or without a photo. Your receipts are private to your
                  account.
                </Text>
              )}
              <ReceiptFields draft={draft} update={update} disabled={Boolean(busy)} />
              {difference !== 0 ? (
                <View style={rs.warning}>
                  <Text style={rs.text}>Check the total</Text>
                  <Text style={rs.muted}>
                    Items + tax − extra discount differ from the total paid by{" "}
                    {receiptMoney(Math.abs(difference), draft.currency)}. Check for missing items,
                    fees, deposits or rounding. Spending will use the total paid.
                  </Text>
                </View>
              ) : null}
              {duplicate ? (
                <View style={rs.warning}>
                  <Text style={rs.text}>Possible duplicate</Text>
                  <Text style={rs.muted}>
                    A receipt for this store, date and amount is already saved. Only save if this is
                    a separate purchase.
                  </Text>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: reviewed, disabled: Boolean(busy) }}
                disabled={Boolean(busy)}
                onPress={() => setReviewed((r) => !r)}
                style={rs.check}
              >
                <View style={rs.checkBox}>
                  {reviewed ? <AppIcon name="check" color="#075E31" size={18} /> : null}
                </View>
                <Text style={[rs.muted, rs.flex]}>
                  I checked the items, date, currency and total paid
                  {difference || duplicate ? ", including the notices above" : ""}.
                </Text>
              </Pressable>
              {error ? (
                <Text accessibilityRole="alert" style={rs.error}>
                  {error}
                </Text>
              ) : null}
              <ReceiptButton
                label={busy === "save" ? "Saving…" : "Save receipt"}
                disabled={Boolean(busy)}
                onPress={() => {
                  void save();
                }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
