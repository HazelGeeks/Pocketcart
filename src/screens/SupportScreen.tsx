import { webViewStyle } from "../shared/design/webViewStyle";
import { Platform, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import useLayout from "../hooks/useLayout";
import { appPalette as P } from "../shared/design/palette";
import { useSiteI18n } from "../i18n/siteI18n";

import { SUPPORT_EMAIL, SUPPORT_CONTACT, DELETION_URL, supportSections } from "../data/supportContent";

export default function SupportScreen({ onBack }: { onBack: () => void }) {
  const { pad, isLg } = useLayout();
  const { locale, copy } = useSiteI18n();
  const french = locale === "fr";
  const sections = supportSections(locale);

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
            Platform.OS === "web" && webViewStyle({ position: "sticky", top: 0, zIndex: 50 }),
          ]}
        >
          <Pressable onPress={onBack} style={st.backBtn}>
            <Text style={st.backArrow}>←</Text>
            <Text style={st.backText}>{copy.mvp.backToHome}</Text>
          </Pressable>
        </View>

        <View style={[st.container, { paddingHorizontal: pad, maxWidth: isLg ? 880 : 720 }]}>
          <Text style={st.eyebrow}>
            {french ? "POUR VOS COURSES AU QUOTIDIEN" : "MADE FOR EVERYDAY SHOPPING"}
          </Text>
          <Text accessibilityRole="header" aria-level={1} style={st.title}>
            {french ? "Assistance PocketCart" : "PocketCart Help & Support"}
          </Text>
          <Text style={st.intro}>
            {french
              ? "Obtenez de l’aide pour votre compte et vos choix de confidentialité."
              : "Find help with your account, privacy choices, and PocketCart."}
          </Text>

          <View style={st.card}>
            <Text accessibilityRole="header" aria-level={2} style={st.cardTitle}>
              {french ? "Contactez-nous" : "Contact us"}
            </Text>
            <Text style={st.cardBody}>
              {SUPPORT_CONTACT[locale]}
            </Text>
            <Text
              accessibilityRole="link"
              {...(Platform.OS === "web" ? { href: `mailto:${SUPPORT_EMAIL}` } : {})}
              onPress={
                Platform.OS !== "web"
                  ? () => {
                      void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
                    }
                  : undefined
              }
              style={st.urlValue}
            >
              {SUPPORT_EMAIL}
            </Text>
          </View>

          {sections.map((section) => (
            <View key={section.title} style={st.card}>
              <Text accessibilityRole="header" aria-level={2} style={st.cardTitle}>
                {section.title}
              </Text>
              <Text style={st.cardBody}>{section.body}</Text>
              {section.url ? (
                <Text
                  accessibilityRole="link"
                  {...(Platform.OS === "web" ? { href: section.url } : {})}
                  style={st.urlValue}
                  onPress={
                    Platform.OS !== "web"
                      ? () => {
                          void Linking.openURL(section.url);
                        }
                      : undefined
                  }
                >
                  {section.url === DELETION_URL
                    ? french
                      ? "Suppression du compte →"
                      : "Account deletion guidance →"
                    : french
                      ? "Confidentialité →"
                      : "Privacy policy →"}
                </Text>
              ) : null}
              {section.secondaryUrl ? (
                <Text
                  accessibilityRole="link"
                  {...(Platform.OS === "web" ? { href: section.secondaryUrl } : {})}
                  style={st.urlValue}
                  onPress={
                    Platform.OS !== "web"
                      ? () => {
                          void Linking.openURL(section.secondaryUrl);
                        }
                      : undefined
                  }
                >
                  {french ? "Conditions d’utilisation →" : "Terms of service →"}
                </Text>
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
    ...(Platform.OS === "web" ? webViewStyle({ minHeight: "100vh", width: "100%" }) : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  topBar: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 14,
    ...(Platform.OS === "web" ? webViewStyle({ backdropFilter: "blur(14px)" }) : {}),
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
