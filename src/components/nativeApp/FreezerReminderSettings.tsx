import React from "react";
import { AppState, Linking, Pressable, Switch, Text, View } from "react-native";
import { getFreezerReminderStatus, refreshFreezerReminders, setFreezerRemindersEnabled } from "../../services/freezerNotifications";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

export function FreezerReminderSettings({ userId }: { userId: string }) {
  const [enabled, setEnabled] = React.useState(false);
  const [granted, setGranted] = React.useState(true);
  const [busy, setBusy] = React.useState(true);
  const [message, setMessage] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const status = await getFreezerReminderStatus(userId);
        const warning = await refreshFreezerReminders(userId);
        if (alive) { setEnabled(status.enabled && status.granted); setGranted(status.granted); setMessage(status.message ?? warning); }
      } catch { if (alive) setMessage("Reminder settings could not be loaded."); }
      finally { if (alive) setBusy(false); }
    };
    void refresh();
    const listener = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
    return () => { alive = false; listener.remove(); };
  }, [userId]);
  const toggle = async (value: boolean) => {
    setBusy(true);
    try {
      const warning = await setFreezerRemindersEnabled(userId, value);
      const status = await getFreezerReminderStatus(userId);
      setEnabled(status.enabled && status.granted); setGranted(status.granted); setMessage(warning);
    } catch { setMessage("Reminders could not be updated. Please try again."); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={st.freezerIntroTitle}>Date reminders</Text>
        <Text style={st.freezerHelp}>D-3 · D-Day · D+3 at 9 AM</Text>
      </View>
      <Switch accessibilityLabel="Food date reminders on this device" disabled={busy} value={enabled}
        onValueChange={value => void toggle(value)} trackColor={{ true: C.primary }} />
    </View>
    <Text style={st.freezerHelp}>On this device · local time. Open the app to sync changes from other devices.</Text>
    {!granted ? <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={{ minHeight: 44, justifyContent: "center" }}>
      <Text style={st.shoppingRefreshText}>Open notification settings</Text>
    </Pressable> : null}
    {message ? <Text accessibilityRole="alert" style={st.freezerHelp}>{message}</Text> : null}
  </View>;
}
