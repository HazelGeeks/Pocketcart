import { webViewStyle } from "../shared/design/webViewStyle";
import {
  Platform,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import useLayout from "../hooks/useLayout";
import { appPalette as P } from "../shared/design/palette";

const PRIVACY_URL = "https://pocketcart.app/privacy";
const TERMS_URL = "https://pocketcart.app/terms";
const DELETION_URL = "https://pocketcart.app/delete-account";

const SUPPORT_SECTIONS = [
  {
    title: "App Help",
    body:
      "Find account access, privacy, and account deletion guidance below. Camera and location permissions are optional; receipts support manual entry and the map supports city or postal-code search.",
  },
  {
    title: "Account Access",
    body:
      "Sign in with the same email address or sign-in method you used to create your account. If you signed up by email, check your inbox and spam folder for the verification email before trying again.",
  },
  {
    title: "Account Deletion",
    body:
      "You can delete your account in the app from Account > Account actions > Delete Account. If you cannot access the app, use the deletion page below for account deletion instructions.",
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
              (webViewStyle({ position: "sticky", top: 0, zIndex: 50 })),
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
          <Text style={st.eyebrow}>MADE FOR EVERYDAY SHOPPING</Text>
          <Text accessibilityRole="header" style={st.title}>Pocket Cart Help & Support</Text>
          <Text style={st.intro}>
            Find help with your account, privacy choices, and Pocket Cart.
          </Text>

          {SUPPORT_SECTIONS.map((section) => (
            <View key={section.title} style={st.card}>
              <Text accessibilityRole="header" style={st.cardTitle}>{section.title}</Text>
              <Text style={st.cardBody}>{section.body}</Text>
              {section.url ? <Text accessibilityRole="link" {...(Platform.OS === "web" ? { href: section.url } : {})} style={st.urlValue} onPress={Platform.OS !== "web" ? () => { void Linking.openURL(section.url); } : undefined}>{section.title === "Account Deletion" ? "Account deletion guidance →" : "Privacy policy →"}</Text> : null}
              {section.secondaryUrl ? (
                <Text accessibilityRole="link" {...(Platform.OS === "web" ? { href: section.secondaryUrl } : {})} style={st.urlValue} onPress={Platform.OS !== "web" ? () => { void Linking.openURL(section.secondaryUrl); } : undefined}>Terms of service →</Text>
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
      ? (webViewStyle({ minHeight: "100vh", width: "100%" }))
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  topBar: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 14,
    ...(Platform.OS === "web" ? (webViewStyle({ backdropFilter: "blur(14px)" })) : {}),
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
