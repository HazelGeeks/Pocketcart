import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import useLayout from "../hooks/useLayout";
import { appPalette as P } from "../shared/design/palette";

const SUPPORT_URL = "https://pocketcart.pages.dev/support";
const PRIVACY_URL = "https://pocketcart.pages.dev/privacy";
const TERMS_URL = "https://pocketcart.pages.dev/terms";
const DELETION_URL = "https://pocketcart.pages.dev/delete-account";

const SUPPORT_SECTIONS = [
  {
    title: "Store Review & User Support",
    body:
      "This public support page gives store reviewers and users the current account, privacy, terms, and deletion resources for PocketCart. When a store console asks for a support URL, use this page.",
  },
  {
    title: "Account Access",
    body:
      "If you cannot sign in, create a fresh account from More in the app or retry with the email address used for sign up. Password handling is managed through Supabase Auth; PocketCart does not store plaintext passwords.",
  },
  {
    title: "Account Deletion",
    body:
      "You can delete your account in the app from More > Account deletion. If you cannot access the app, use the external deletion page below for account deletion instructions.",
    url: DELETION_URL,
  },
  {
    title: "Privacy & Terms",
    body:
      "Review PocketCart's privacy and terms pages before using the app or submitting a store review question.",
    url: PRIVACY_URL,
    secondaryUrl: TERMS_URL,
  },
];

export default function SupportScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { pad, isLg } = useLayout();

  return (
    <View style={st.root}>
      <ScrollView
        role="main"
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            st.topBar,
            { paddingHorizontal: pad },
            Platform.OS === "web" &&
              ({ position: "sticky", top: 0, zIndex: 50 } as any),
          ]}
        >
          <Pressable onPress={onBack} style={st.backBtn}>
            <Text style={st.backArrow}>←</Text>
            <Text style={st.backText}>Back to Home</Text>
          </Pressable>
        </View>

        <View
          style={[
            st.container,
            { paddingHorizontal: pad, maxWidth: isLg ? 880 : 720 },
          ]}
        >
          <Text style={st.eyebrow}>SUPPORT</Text>
          <Text style={st.title}>PocketCart Support</Text>
          <Text style={st.intro}>
            Use this page for app support, store review access, privacy
            questions, and account deletion guidance.
          </Text>

          <View style={st.card}>
            <Text style={st.cardTitle}>Support URL</Text>
            <Text style={st.cardBody}>
              This is the public support resource used for App Store and Google
              Play submission until the custom PocketCart domain is live.
            </Text>
            <Text style={st.urlValue}>{SUPPORT_URL}</Text>
          </View>

          {SUPPORT_SECTIONS.map((section) => (
            <View key={section.title} style={st.card}>
              <Text style={st.cardTitle}>{section.title}</Text>
              <Text style={st.cardBody}>{section.body}</Text>
              {section.url ? <Text style={st.urlValue}>{section.url}</Text> : null}
              {section.secondaryUrl ? (
                <Text style={st.urlValue}>{section.secondaryUrl}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  topBar: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 14,
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(14px)" } as any) : {}),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  backArrow: {
    fontSize: 18,
    color: P.brickDark,
    fontWeight: "700",
  },
  backText: {
    fontSize: 15,
    color: P.brickDark,
    fontWeight: "700",
  },
  container: {
    alignSelf: "center",
    width: "100%",
    paddingTop: 44,
    gap: 14,
  },
  eyebrow: {
    color: P.brick,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: {
    color: P.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
  },
  intro: {
    color: P.textSoft,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.white,
    padding: 18,
    gap: 7,
  },
  cardTitle: {
    color: P.ink,
    fontSize: 20,
    fontWeight: "800",
  },
  cardBody: {
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  urlValue: {
    color: P.brickDark,
    fontSize: 13,
    fontWeight: "700",
  },
});
