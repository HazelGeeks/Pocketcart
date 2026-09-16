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

const LAST_UPDATED = "September 16, 2026";
const SUPPORT_URL = "https://pocketcart.hazelgeeks.workers.dev/support";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: `Welcome to PocketCart ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.

When you use our mobile application ("App") and related services (collectively, the "Service"), you trust us with your personal information. We take your privacy very seriously. If you have any questions or concerns about this policy or our practices with regard to your personal information, please use our support page at ${SUPPORT_URL}.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect information that you voluntarily provide to us when you register on the App, express an interest in obtaining information about us or our products, or otherwise contact us.

Personal Information Provided by You:
• Account Data — name and email address when you create an account. Authentication credentials are processed by Supabase Auth; we do not store plaintext passwords.
• Watchlist Data — products you choose to track, target prices, in-app alerts, and budget preferences.
• Shopping Profile Data — optional product interests, grocery shopping frequency, and favorite stores that you provide to personalize deal recommendations.
• Cart Data — products, quantities, and purchased status that you save in your personal or shared family cart.
• My Freezer Data — food names, storage location, quantity, unit, best-before date, and notes you choose to save in your personal or shared family inventory.
• Food Scan Data — camera images you choose to capture for food or ingredient-label analysis, detected barcodes, and the resulting analysis. PocketCart does not add these captures to your device photo library.
• Support & Deletion Request Data — account email, platform, request details, and technical request metadata when you submit a support or account deletion request.

Information Automatically Collected:
• Push Notification Data — if you enable push alerts, we store your notification token, platform, enabled status, and delivery status or errors with your account so we can deliver and troubleshoot notifications.
• Service Logs — our hosting and authentication providers process request metadata, such as IP addresses, request times, and error information, to operate and protect the Service.
• Website Analytics — where enabled, our website uses Google Analytics. The native iOS app does not run this website analytics code.
• Location — optional device location is used on your device to show nearby stores. PocketCart does not save your GPS coordinates to your account database. City or postal-code lookup uses the device's map and geocoding services. You can use these features without granting GPS access.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use the information we collect or receive for the following purposes:

• To provide and maintain the Service — including price comparison, watchlist tracking, budget planning, and your personal or shared family My Freezer inventory.
• To provide in-app alerts — price drop highlights, watchlist updates, and other service-related alert states you have opted into.
• To provide Food Scan — sending the image you choose to capture to an image-analysis provider and returning visible food, ripeness, ingredient-label, allergen, and general nutrition guidance.
• To maintain our Service — we use service and notification diagnostics to investigate errors and keep features working.
• To communicate with you — responding to your inquiries, sending service updates, and providing customer support.
• To protect our Service — detecting and preventing fraud, abuse, and security incidents.

We do not sell your personal information to third parties. We do not use your data for targeted advertising from external ad networks.`,
  },
  {
    title: "4. Data Sharing & Third Parties",
    body: `We may share your information in the following situations:

• Family Sharing — When you create or join a family, members can see your display name and read, add, edit, and remove items in the shared Cart and My Freezer. Existing personal items are shared only when you choose to copy or move them. Leaving removes your access; shared items remain with the remaining members, including after account deletion. If the last member leaves or deletes their account, the shared inventory is deleted. Product alerts and subscription access remain personal.

• Subscriptions — If you use in-app subscriptions, Apple or Google processes the payment. RevenueCat processes your app account identifier and purchase/subscription status to validate access and restore purchases. Pocketcart does not receive your full payment card details.

• Service Providers — Supabase provides authentication, database storage, and server functions. Expo and Apple or Google deliver optional push notifications. Food Scan sends your chosen image to OpenAI for analysis when that service is configured. The Food Scan request does not include your PocketCart account identifier or login token. Avoid photographing personal or sensitive information. Google Analytics is used on the website where enabled, not in the native iOS app.
• Optional Support — The Ko-fi support link opens an external website. Ko-fi and its payment providers process any information you enter there under their own privacy policies. Supporting PocketCart does not unlock app features.
• Legal Obligations — We may disclose your information where required by law, court order, or governmental regulation.
• Business Transfers — In the event of a merger, acquisition, or asset sale, your data may be transferred as part of that transaction. We will notify you of any such change.
• With Your Consent — We may share your information for any other purpose with your explicit consent.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.

When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain certain information for legal or regulatory purposes.

PocketCart does not intentionally save Food Scan captures in its application database. Images are transmitted for analysis, and the image-analysis provider may process or retain request data according to the provider settings and applicable agreement.

Aggregated and anonymized data that cannot be used to identify you may be retained indefinitely for analytical purposes.`,
  },
  {
    title: "6. Data Security",
    body: `We use HTTPS for connections to our services, authenticated requests for account features, and database access policies to restrict access to personal and family records. Server credentials are kept outside the distributed app.

However, no electronic transmission or storage method is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.`,
  },
  {
    title: "7. Your Rights",
    body: `Depending on your location, you may have the following rights regarding your personal data:

• Access — Request a copy of the personal data we hold about you.
• Correction — Request correction of inaccurate or incomplete data.
• Deletion — Request deletion of your personal data ("right to be forgotten").
• Portability — Request a machine-readable copy of your data.
• Objection — Object to processing of your data for certain purposes.
• Withdrawal of Consent — Withdraw consent at any time where we rely on consent to process your data.

To exercise any of these rights, please use our support page at ${SUPPORT_URL}. We will respond within 30 days after receiving the request details needed to identify your account.`,
  },
  {
    title: "8. Children's Privacy",
    body: `Our Service is not directed to children under the age of 13 (or 16 in the European Economic Area). We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We will take steps to delete such information from our servers.`,
  },
  {
    title: "9. International Data Transfers",
    body: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country.

Our service providers' processing locations and contractual terms govern their handling of this data. Contact us through our support page with questions about international processing.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date at the top of this page. We encourage you to review this Privacy Policy periodically.

If we make material changes, we will notify you through the App or by email prior to the change becoming effective.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have questions or comments about this Privacy Policy, you may contact us at:

PocketCart
Support: ${SUPPORT_URL}
For data protection inquiries, include "Privacy request" in your support request details.`,
  },
];

export default function PrivacyScreen({
  onBack,
  backLabel = "Back to Home",
  legalLabel = "LEGAL",
  titleLabel = "Privacy Policy",
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
              ({ position: "sticky", top: 0, zIndex: 50 } as any),
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
              <Text style={st.sectionTitle}>{sec.title}</Text>
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
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(16px)" } as any) : {}),
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
