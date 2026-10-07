import { webViewStyle } from "../shared/design/webViewStyle";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import P from "../constants/palette";

function useLayout() {
  const { width: w } = useWindowDimensions();
  const isMd = w >= 768;
  const isLg = w >= 1024;
  return { isMd, isLg, pad: isLg ? 56 : isMd ? 36 : 20 };
}

/* ═══════════════════════════════════════════════════════════════ */

import { TERMS_UPDATED as LAST_UPDATED, TERMS_SECTIONS as SECTIONS } from "../data/legalContent";

export default function TermsScreen({
  onBack,
  backLabel = "Back to Home",
  legalLabel = "LEGAL",
  titleLabel = "Terms of Service",
  lastUpdatedLabel = "Last updated",
  englishOnlyNote,
}: {
  onBack: () => void;
  backLabel?: string;
  legalLabel?: string;
  titleLabel?: string;
  lastUpdatedLabel?: string;
  englishOnlyNote?: string;
}) {
  const { isLg, pad } = useLayout();

  return (
    <View style={st.root}>
      <ScrollView
        role="main"
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky-ish top bar */}
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
            <Text style={st.backText}>{backLabel}</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View
          style={[
            st.container,
            {
              paddingHorizontal: pad,
              maxWidth: isLg ? 820 : 680,
            },
          ]}
        >
          <Text style={st.eyebrow}>{legalLabel}</Text>
          <Text
            accessibilityRole="header" aria-level={1}
            style={[st.pageTitle, isLg && { fontSize: 44, lineHeight: 52 }]}
          >
            {titleLabel}
          </Text>
          <Text style={st.updated}>
            {lastUpdatedLabel}: {LAST_UPDATED}
          </Text>
          {englishOnlyNote ? (
            <Text style={st.englishOnly}>{englishOnlyNote}</Text>
          ) : null}

          {SECTIONS.map((sec) => (
            <View key={sec.title} style={st.section}>
              <Text accessibilityRole="header" aria-level={2} style={st.sectionTitle}>{sec.title}</Text>
              <Text style={st.sectionBody}>{sec.body}</Text>
            </View>
          ))}

          {/* Bottom back */}
          <View style={st.bottomBack}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                st.bottomBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={st.bottomBtnText}>← {backLabel}</Text>
            </Pressable>
          </View>
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
    ...(Platform.OS === "web" ? (webViewStyle({ backdropFilter: "blur(16px)" })) : {}),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    maxWidth: 1200,
    width: "100%",
  },
  backArrow: {
    fontSize: 18,
    color: P.primaryDeep,
    fontWeight: "700",
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: P.primaryDeep,
  },
  container: {
    alignSelf: "center",
    width: "100%",
    paddingTop: 48,
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  pageTitle: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "800",
    color: P.text,
    marginTop: 4,
  },
  updated: {
    fontSize: 14,
    color: P.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  englishOnly: {
    fontSize: 13,
    lineHeight: 20,
    color: P.textSoft,
    marginTop: -8,
    marginBottom: 20,
  },
  section: {
    marginTop: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: P.text,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 25,
    color: P.textSoft,
  },
  bottomBack: {
    marginTop: 48,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: P.line,
  },
  bottomBtn: {
    backgroundColor: P.primaryGhost,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignSelf: "flex-start",
  },
  bottomBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: P.primaryDeep,
  },
});
