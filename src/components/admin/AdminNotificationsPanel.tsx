import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import type { AdminStore } from "../../services/adminBackoffice";
import {
  createFlyerNotification,
  loadNotificationDashboard,
  processFlyerNotification,
  type FlyerNotification,
} from "../../services/adminNotifications";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";
import { notificationFormIssue } from "../../utils/notificationForm";
import { notificationRetailers } from "../../utils/notificationRetailers";
import { st } from "../../screens/adminScreenStyles";

export default function AdminNotificationsPanel({ stores }: { stores: AdminStore[] }) {
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [date, setDate] = useState("");
  const [audience, setAudience] = useState<{ users: number; pushUsers: number } | null>(null);
  const [history, setHistory] = useState<FlyerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const retailers = notificationRetailers(stores);
  const retailer = selectedRetailer || "Your retailer";
  const title = `${retailer} flyer updated!`;
  const body = `New deals are now available at ${retailer}. Check out the latest offers!`;
  const formIssue = notificationFormIssue(retailers.includes(selectedRetailer), date);
  const testReady = !formIssue && !busy;
  const ready = testReady && !!audience && !audienceError && !loading;
  async function refresh() {
    if (mounted.current) {
      setLoading(true);
      setConfirm(false);
    }
    try {
      const result = await loadNotificationDashboard();
      if (mounted.current) {
        setAudience(result.audience);
        setHistory(result.history);
        setAudienceError(result.audienceError);
        setHistoryError(result.historyError);
      }
    } catch (error) {
      if (mounted.current) {
        const message =
          error instanceof Error ? error.message : "Unable to load notification data.";
        setAudience(null);
        setAudienceError(message);
        setHistoryError(message);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh().catch((error) => {
      if (mounted.current) setNotice(error.message);
    });
    return () => {
      mounted.current = false;
    };
  }, []);
  async function send(test: boolean, campaignId?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setConfirm(false);
    setNotice("Preparing notifications…");
    try {
      const id = campaignId ?? (await createFlyerNotification(selectedRetailer, date, test));
      let processed = 0;
      do {
        const count = await processFlyerNotification(id);
        processed += count;
        if (mounted.current) setNotice(`Processing notifications… ${processed} users checked.`);
        if (count === 0 || !mounted.current) break;
      } while (mounted.current);
      if (mounted.current)
        setNotice(
          "Processing finished. Check the send history for accepted pushes and any failures. Acceptance does not confirm device delivery.",
        );
    } catch (error) {
      if (mounted.current)
        setNotice(
          `${error instanceof Error ? error.message : "Unable to send notifications."} Check the history before trying again.`,
        );
    } finally {
      try {
        await refresh();
      } catch (error) {
        if (mounted.current)
          setNotice(error instanceof Error ? error.message : "Unable to refresh history.");
      }
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const button = (label: string, action: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={action}
      style={[st.btn, st.btnGhost, disabled && st.btnDisabled]}
    >
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 20 }}>
      <View style={[st.infoCard, { gap: 12 }]}>
        <Text style={st.infoTitle}>Announce a Flyer update</Text>
        <Text style={st.infoBody}>
          Publish the deals first, then notify your users. Each retailer and Flyer start date can be
          announced once.
        </Text>
        <Text style={st.infoBody}>Retailer</Text>
        {Platform.OS === "web" ? (
          <select
            aria-label="Retailer"
            disabled={busy}
            value={selectedRetailer}
            onChange={(event) => {
              setSelectedRetailer(event.target.value);
              setConfirm(false);
            }}
            style={{ ...WEB_FILTER_SELECT_STYLE, maxWidth: "100%" }}
          >
            <option value="">Choose a retailer</option>
            {retailers.map((name) => (
              <option key={name.toLowerCase()} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <Text style={st.infoBody}>
            Use the web admin to select a retailer and send notifications.
          </Text>
        )}
        <Text style={st.infoBody}>Flyer start date</Text>
        {Platform.OS === "web" ? (
          <input
            type="date"
            aria-label="Flyer start date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            disabled={busy}
            onChange={(event) => {
              setDate(event.target.value);
              setConfirm(false);
            }}
            style={{ ...WEB_FILTER_SELECT_STYLE, maxWidth: "100%" }}
          />
        ) : (
          <TextInput
            accessibilityLabel="Flyer start date, YYYY-MM-DD"
            placeholder="YYYY-MM-DD"
            value={date}
            editable={!busy}
            onChangeText={(value) => {
              setDate(value);
              setConfirm(false);
            }}
            style={st.input}
          />
        )}
        <Text style={st.infoBody}>
          Required for both test and full sends. Use the start date printed on the Flyer.
        </Text>
        <View style={[st.infoCard, { gap: 6 }]}>
          <Text style={st.infoTitle}>{title}</Text>
          <Text style={st.infoBody}>{body}</Text>
        </View>
        <Text accessibilityRole={audienceError ? "alert" : undefined} style={st.infoBody}>
          {loading
            ? "Loading notification audience…"
            : (audienceError ??
              (audience
                ? `${audience.users} users will receive an inbox notification. ${audience.pushUsers} users currently have an enabled push device.`
                : "Notification audience is unavailable. Refresh to try again."))}{" "}
          Push availability may change before sending.
        </Text>
        <Text style={st.infoBody}>
          Test sends only to this admin account's enabled devices and inbox. Sign into the app with
          the same account first.
        </Text>
        {formIssue ? <Text style={st.infoBody}>{formIssue}</Text> : null}
        {!loading && audienceError ? (
          <Text style={st.infoBody}>
            Full sending is unavailable until the audience can be loaded.
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {button("Send test to my account", () => void send(true), !testReady)}
          {button("Review full send", () => setConfirm(true), !ready)}
        </View>
        {confirm ? (
          <View style={[st.infoCard, { gap: 10 }]}>
            <Text style={st.infoTitle}>Send to all {audience?.users} users?</Text>
            <Text style={st.infoBody}>
              {title}
              {"\n"}
              {body}
              {"\n"}Flyer start date: {date}
              {"\n"}This publishes the notification immediately. Keep this page open while pushes
              are processed.
            </Text>
            {button("Confirm and send to all users", () => void send(false), !ready)}
            {button("Cancel", () => setConfirm(false), busy)}
          </View>
        ) : null}
        {notice ? (
          <Text accessibilityRole="alert" style={st.infoBody}>
            {notice}
          </Text>
        ) : null}
      </View>
      <View style={[st.infoCard, { gap: 12 }]}>
        <Text style={st.infoTitle}>Send history</Text>
        {button(
          "Refresh history and audience",
          () => void refresh().catch((error) => setNotice(error.message)),
          busy || loading,
        )}
        {historyError ? (
          <Text accessibilityRole="alert" style={st.infoBody}>
            {historyError}
          </Text>
        ) : null}
        {!loading && !historyError && history.length === 0 ? (
          <Text style={st.infoBody}>No notifications found.</Text>
        ) : null}
        {history.map((item) => (
          <View key={item.id} style={[st.infoCard, { gap: 6 }]}>
            <Text style={st.infoTitle}>
              {item.test ? "[Test] " : ""}
              {item.title}
            </Text>
            <Text style={st.infoBody}>{item.body}</Text>
            <Text style={st.infoBody}>
              Flyer: {item.flyer_date} · {new Date(item.created_at).toLocaleString("en-CA")} ·{" "}
              {item.actor_email ?? "Former admin"}
            </Text>
            <Text style={st.infoBody}>
              {item.users} inbox notifications · {item.accepted} pushes accepted · {item.failed}{" "}
              pushes failed · {item.skipped} users without enabled devices · {item.pending} users
              pending
            </Text>
            {item.errors || item.processing ? (
              <Text style={st.infoBody}>
                {item.errors} users with processing errors · {item.processing} users processing or
                with an interrupted send. Delivery may be uncertain; these users are not
                automatically retried.
              </Text>
            ) : null}
            {item.pending > 0
              ? button("Continue pending sends", () => void send(item.test, item.id), busy)
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}
