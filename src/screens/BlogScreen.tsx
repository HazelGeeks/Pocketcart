import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSiteI18n } from "../i18n/siteI18n";

const P = {
  primary: "#ABC900",
  primaryDeep: "#5C7A00",
  bg: "#FAFCF2",
  white: "#FFFFFF",
  text: "#1E2E0C",
  textSoft: "#4A5C38",
  textMuted: "#7F9068",
  line: "rgba(171,201,0,0.18)",
  glass: "rgba(255,255,255,0.82)",
};

function useLayout() {
  const { width: w } = useWindowDimensions();
  const isMd = w >= 768;
  const isLg = w >= 1024;
  return { isMd, isLg, pad: isLg ? 56 : isMd ? 36 : 20 };
}

export default function BlogScreen({ onBack }: { onBack: () => void }) {
  const { isMd, isLg, pad } = useLayout();
  const { copy } = useSiteI18n();
  const posts = copy.blog.posts;

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
            <Text style={st.backText}>{copy.blog.back}</Text>
          </Pressable>
        </View>

        <View
          style={[
            st.container,
            { paddingHorizontal: pad, maxWidth: isLg ? 980 : 760 },
          ]}
        >
          <Text style={st.eyebrow}>{copy.blog.eyebrow}</Text>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[st.title, isLg && { fontSize: 46, lineHeight: 54 }]}
          >
            {copy.blog.title}
          </Text>
          <Text style={[st.sub, { maxWidth: 620 }]}>{copy.blog.sub}</Text>

          <View style={[st.grid, isMd && { flexDirection: "row" }]}>
            {posts.map((post) => (
              <View
                key={post.title}
                style={[st.card, isMd && { flex: 1 }]}
              >
                <Text style={st.cardDate}>{post.date}</Text>
                <Text style={st.cardTitle}>{post.title}</Text>
                <Text style={st.cardBody}>{post.body}</Text>
                <Pressable style={st.readBtn}>
                  <Text style={st.readBtnText}>{copy.blog.readArticle}</Text>
                </Pressable>
              </View>
            ))}
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
      ? ({ backdropFilter: "blur(16px)" } as any)
      : {}),
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
    paddingTop: 52,
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    color: P.text,
  },
  sub: {
    fontSize: 17,
    lineHeight: 26,
    color: P.textSoft,
    marginTop: 4,
  },
  grid: {
    gap: 18,
    marginTop: 24,
  },
  card: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 20,
    padding: 24,
    gap: 10,
  },
  cardDate: {
    fontSize: 13,
    color: P.textMuted,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 21,
    lineHeight: 28,
    color: P.text,
    fontWeight: "800",
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 23,
    color: P.textSoft,
  },
  readBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(171,201,0,0.35)",
    backgroundColor: "rgba(171,201,0,0.12)",
  },
  readBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: P.primaryDeep,
  },
});
