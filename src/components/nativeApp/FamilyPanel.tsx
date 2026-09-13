import React from "react";
import { Alert, Pressable, Share, Text, TextInput, View } from "react-native";
import { useFamily } from "../../contexts/FamilyContext";
import { familyAction, listFamilyMembers, type FamilyMember } from "../../services/family";
import { familyInviteUrl, parseFamilyInvite } from "../../utils/familyInvite";
import { st } from "../../screens/nativeAppStyles";
import { SettingsSection } from "./SettingsMenu";
export function FamilyPanel({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  const family = useFamily();
  const [expanded, setExpanded] = React.useState(false);
  const [name, setName] = React.useState("My family");
  const [link, setLink] = React.useState("");
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<FamilyMember[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const running = React.useRef(false);
  const scope = `${family.userId}:${family.family?.id ?? ""}`;
  const activeScope = React.useRef(scope); activeScope.current = scope;
  React.useEffect(() => { setInviteUrl(null); setMembers([]); setMessage(null); }, [scope]);
  React.useEffect(() => {
    let active = true;
    if (family.family && expanded) void listFamilyMembers().then(data => { if (active) setMembers(data); }).catch(() => { if (active) setMessage("Could not load family members. Try reopening Family."); });
    return () => { active = false; };
  }, [family.family, expanded]);
  const run = async (work: () => Promise<void>) => {
    if (running.current) return;
    running.current = true; setBusy(true); setMessage(null);
    try { await work(); } catch (error) { if (activeScope.current === scope) setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { running.current = false; setBusy(false); }
  };
  const button = (label: string, action: () => void) => <Pressable accessibilityRole="button" disabled={busy} onPress={action} style={[st.settingsButton, { backgroundColor: "#E4F5EB", borderWidth: 1, borderColor: "#BED9C8" }]}><Text style={st.settingsButtonSecondaryText}>{label}</Text></Pressable>;
  const confirm = (title: string, detail: string, action: () => Promise<void>) => Alert.alert(title, detail, [{ text: "Cancel", style: "cancel" }, { text: "Continue", onPress: () => void run(action) }]);
  const createInvite = () => void run(async () => {
    const result = await familyAction("invite");
    if (activeScope.current === scope && result.token) { setInviteUrl(familyInviteUrl(result.token)); setExpanded(true); }
  });
  const accept = () => void run(async () => {
    const token = family.pendingInvite ?? parseFamilyInvite(link);
    if (!token) throw new Error("Paste a valid PocketCart invitation link.");
    try { await familyAction("join", token); } finally { await family.refresh(); }
    await family.setInvite(null); setLink(""); setExpanded(true);
  });
  return <SettingsSection label="Family">
    <View style={{ padding: 16, gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded || Boolean(family.pendingInvite) }} onPress={() => setExpanded(!expanded)}>
        <Text style={st.settingsRowTitle}>{family.family?.name ?? "Share Cart & My Freezer"}</Text>
        <Text style={st.settingsHelp}>{family.family ? "Shared with your family · Manage" : "Invite your family and plan groceries together"}</Text>
      </Pressable>
      {family.userId && family.ready && !expanded && !family.pendingInvite ? (
        !family.family ? button("Set up family & invite", () => setExpanded(true))
          : family.family.owner_id === family.userId ? button("Create invite link", createInvite)
          : button("View family", () => setExpanded(true))
      ) : null}
      {expanded || family.pendingInvite ? <>
        <Text style={st.settingsHelp}>Everyone can add, edit and remove shared items. Product alerts and subscriptions stay personal.</Text>
        {!family.userId ? <>
          <Text style={st.settingsHelp}>{family.pendingInvite ? "Your invitation is saved. Sign up or sign in, then return here to join." : "Sign in to create or join a family."}</Text>
          {button("Create account", onSignUp)}{button("Sign in", onSignIn)}
        </> : !family.ready ? button("Refresh family", () => void family.refresh()) : family.family ? <>
          {members.map((member, index) => <View key={member.user_id} style={{ gap: 4 }}>
            <Text style={st.settingsRowTitle}>{member.display_name}{member.user_id === family.userId ? " (You)" : ""}{member.user_id === family.family?.owner_id ? " · Owner" : ""}</Text>
            {family.family?.owner_id === family.userId && member.user_id !== family.userId ? button(`Remove ${member.display_name || `member ${index + 1}`}`, () => confirm("Remove family member?", "They will lose access to the shared Cart and Freezer.", async () => { await familyAction("remove", member.user_id); await family.refresh(); })) : null}
          </View>)}
          {family.family.owner_id === family.userId ? <>
            {button("Create invite link", createInvite)}
            <Text style={st.settingsHelp}>Each link works once for 7 days. Creating a new link cancels the previous link.</Text>
            {inviteUrl ? <>{button("Share invite link", () => void run(async () => { await Share.share({ message: `Join our family on PocketCart: ${inviteUrl}` }); }))}<Text selectable style={st.settingsHelp}>{inviteUrl}</Text></> : null}
            {button("Cancel pending invite", () => void run(async () => { await familyAction("revoke"); setInviteUrl(null); setMessage("Invitation cancelled."); }))}
          </> : null}
          {button("Move my personal food to family", () => confirm("Share your existing food?", "Your personal My Freezer items will move into this family's shared inventory. Your personal Cart can be copied from the Cart screen.", async () => { await familyAction("import_freezer"); setMessage("Your food is now shared with your family."); await family.refresh(); }))}
          {button("Leave family", () => confirm("Leave this family?", "You will return to your personal Cart and Freezer. Shared items stay with the family. If you are the last member, the shared Cart and Freezer will be deleted.", async () => { await familyAction("leave"); await family.refresh(); }))}
          {family.pendingInvite ? <Text style={st.settingsHelp}>You already belong to a family. Dismiss this invitation to keep sharing here.</Text> : null}
        </> : <>
          <TextInput accessibilityLabel="Family name" style={st.settingsInput} value={name} maxLength={60} onChangeText={setName} placeholder="Family name" />
          {button("Create family", () => void run(async () => { if (!name.trim()) throw new Error("Enter a family name."); await familyAction("create", name.trim()); await family.refresh(); }))}
          <Text style={st.settingsHelp}>Your personal items stay private until you choose to copy or move them.</Text>
          {!family.pendingInvite ? <TextInput accessibilityLabel="Family invitation link" style={st.settingsInput} value={link} onChangeText={setLink} autoCapitalize="none" autoCorrect={false} placeholder="Paste invitation link" /> : null}
          {button("Join invited family", accept)}
        </>}
        {family.pendingInvite ? button("Dismiss invitation", () => void run(() => family.setInvite(null))) : null}
      </> : null}
      {message || family.error ? <Text accessibilityRole="alert" style={st.settingsHelp}>{message ?? family.error}</Text> : null}
      {busy ? <Text style={st.settingsHelp}>Please wait…</Text> : null}
    </View>
  </SettingsSection>;
}
