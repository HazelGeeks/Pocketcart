import React from "react";
import { randomUUID } from "expo-crypto";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ShoppingListItem } from "../../hooks/useShoppingList";
import { saveMyFreezerItem } from "../../services/myFreezer";
import { refreshFreezerReminders } from "../../services/freezerNotifications";
import { shoppingItemFreezerDraft } from "../../utils/shoppingFreezer";
import { st } from "../../screens/nativeAppStyles";
import { MyFreezerItemForm } from "./MyFreezerItemForm";

type Props = { item: ShoppingListItem; userId: string; onClose: () => void;
  onSaved: (productId: string, freezerId: string, warning: string | null) => void };
export function ShoppingFreezerSheet({ item, userId, onClose, onSaved }: Props) {
  const [draft, setDraft] = React.useState(() => shoppingItemFreezerDraft(item));
  const [creationId] = React.useState(() => randomUUID());
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const submitting = React.useRef(false);
  const alive = React.useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);
  const save = async () => {
    if (submitting.current) return;
    submitting.current = true; setSaving(true); setMessage(null);
    try {
      const result = await saveMyFreezerItem({ userId, creationId, draft });
      if (!alive.current) return;
      if (result.error || !result.data) { setMessage(result.error ?? "Food could not be saved. Please try again."); return; }
      const warning = await refreshFreezerReminders(userId);
      if (alive.current) onSaved(item.productId, result.data.id, warning);
    } catch { if (alive.current) setMessage("Food could not be saved. Please try again."); }
    finally { submitting.current = false; if (alive.current) setSaving(false); }
  };
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!submitting.current) onClose(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 12 }}>
          <Text style={st.shoppingSectionTitle}>Add to My Freezer</Text>
          <Text style={st.shoppingFootnote}>Check storage and best-before date. Your purchased item stays in Shopping.</Text>
          {message ? <Text accessibilityRole="alert" style={st.shoppingWarningText}>{message}</Text> : null}
          <MyFreezerItemForm draft={draft} editing={false} saving={saving} onChange={setDraft}
            onCancel={() => { if (!submitting.current) onClose(); }} onSubmit={() => void save()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
