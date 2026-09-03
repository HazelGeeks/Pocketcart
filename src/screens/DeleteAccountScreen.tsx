import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSiteI18n } from "../i18n/siteI18n";
import useLayout from "../hooks/useLayout";
import { submitAccountDeletionRequest } from "../services/userProfile";
import { appPalette as P } from "../shared/design/palette";

const DELETION_URL = "https://pocketcart.hazelgeeks.workers.dev/delete-account";

export default function DeleteAccountScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  const { copy } = useSiteI18n();
  const { pad, isLg } = useLayout();
  const page = copy.mvp.deletePage;
  const [email, setEmail] = React.useState("");
  const [platform, setPlatform] = React.useState("ios");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Enter the account email address used for PocketCart.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    const result = await submitAccountDeletionRequest({
      email: normalizedEmail,
      platform,
      details,
    });
    setSubmitting(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setEmail("");
    setDetails("");
    setMessage("Deletion request received. We will review the account deletion request.");
  }, [details, email, platform]);

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
            <Text style={st.cardTitle}>Submit deletion request</Text>
            <Text style={st.cardBody}>
              If you cannot sign in to the app, submit your account email here
              so the deletion request can be reviewed.
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Account email"
              placeholderTextColor={P.textSoft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={st.input}
            />
            <View style={st.platformRow}>
              {["ios", "android", "web", "unknown"].map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  onPress={() => setPlatform(item)}
                  style={[
                    st.platformBtn,
                    platform === item && st.platformBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      st.platformText,
                      platform === item && st.platformTextActive,
                    ]}
                  >
                    {item === "ios"
                      ? "iOS"
                      : item === "android"
                        ? "Android"
                        : item === "web"
                          ? "Web"
                          : "Unknown"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Optional details"
              placeholderTextColor={P.textSoft}
              multiline
              style={[st.input, st.textArea]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[st.submitBtn, submitting && st.submitBtnDisabled]}
            >
              <Text style={st.submitText}>
                {submitting ? "Submitting..." : "Submit deletion request"}
              </Text>
            </Pressable>
            {message ? <Text style={st.formMessage}>{message}</Text> : null}
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
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.bg,
    color: P.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: P.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: P.white,
  },
  platformBtnActive: {
    backgroundColor: P.brick,
    borderColor: P.brick,
  },
  platformText: {
    color: P.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  platformTextActive: {
    color: P.white,
  },
  submitBtn: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: P.brick,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: P.white,
    fontSize: 14,
    fontWeight: "800",
  },
  formMessage: {
    color: P.brickDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
});
