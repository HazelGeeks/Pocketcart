import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSiteI18n } from "../i18n/siteI18n";
import useLayout from "../hooks/useLayout";

const P = {
  brick: "#B3472F",
  brickDark: "#8B3524",
  bg: "#FFF8F5",
  white: "#FFFFFF",
  text: "#2A1812",
  textSoft: "#6F4A40",
  line: "#E5C9C0",
  glass: "rgba(255,248,245,0.92)",
};

const DELETION_URL = "https://pocketcart.app/delete-account";

export default function DeleteAccountScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { copy } = useSiteI18n();
  const { pad, isLg } = useLayout();
  const page = copy.mvp.deletePage;

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
            <Text style={st.backText}>{copy.mvp.backToHome}</Text>
          </Pressable>
        </View>

        <View
          style={[
            st.container,
            { paddingHorizontal: pad, maxWidth: isLg ? 880 : 720 },
          ]}
        >
          <Text style={st.eyebrow}>LEGAL</Text>
          <Text style={st.title}>{page.title}</Text>
          <Text style={st.intro}>{page.intro}</Text>

          <View style={st.card}>
            <Text style={st.cardTitle}>{page.inAppTitle}</Text>
            <Text style={st.cardBody}>{page.inAppBody}</Text>
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>{page.webTitle}</Text>
            <Text style={st.cardBody}>{page.webBody}</Text>
            <Text style={st.urlLabel}>{page.urlLabel}</Text>
            <Text style={st.urlValue}>{DELETION_URL}</Text>
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>{page.retainedTitle}</Text>
            <Text style={st.cardBody}>{page.retainedBody}</Text>
          </View>

          <View style={st.card}>
            <Text style={st.cardTitle}>{page.supportTitle}</Text>
            <Text style={st.cardBody}>{page.supportBody}</Text>
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
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(14px)" } as any)
      : {}),
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
    color: P.text,
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
    color: P.text,
    fontSize: 20,
    fontWeight: "800",
  },
  cardBody: {
    color: P.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  urlLabel: {
    marginTop: 2,
    color: P.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  urlValue: {
    color: P.brickDark,
    fontSize: 13,
    fontWeight: "700",
  },
});
