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

const LAST_UPDATED = "August 21, 2026";
const SUPPORT_URL = "https://pocketcart.pages.dev/support";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By downloading, installing, or using the PocketCart application ("App") and related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.

These Terms constitute a legally binding agreement between you ("User", "you") and PocketCart ("Company", "we", "our", "us"). We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Service following any changes indicates your acceptance of the new Terms.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 13 years of age (or 16 in the European Economic Area) to use the Service. By using the Service, you represent and warrant that you meet the applicable age requirement and have the legal capacity to enter into these Terms.

If you are using the Service on behalf of an organization, you represent and warrant that you are authorized to bind that organization to these Terms.`,
  },
  {
    title: "3. Account Registration",
    body: `To access certain features of the Service, you may be required to create an account. You agree to:

• Provide accurate, current, and complete information during registration.
• Maintain and promptly update your account information.
• Keep your password secure and confidential.
• Notify us immediately of any unauthorized use of your account.
• Accept responsibility for all activities that occur under your account.

We reserve the right to suspend or terminate your account if any information provided proves to be inaccurate, false, or in violation of these Terms.`,
  },
  {
    title: "4. Description of Service",
    body: `PocketCart provides a price comparison and budget tracking platform that enables users to:

• Compare product prices across multiple retail stores.
• Create and manage product watchlists with customizable price alerts.
• Track spending and visualize potential savings through budget planning tools.
• View in-app alerts when tracked products reach desired price points.
• Capture food or ingredient-label images for automated visual analysis and general guidance.

The Service is provided on an "as-is" and "as-available" basis. We do not guarantee that product pricing information will always be accurate, complete, or up-to-date, as prices are sourced from third-party retailers and may change without notice.

Food Scan results are automated estimates and are not medical, dietary, allergy, or food-safety advice. The feature cannot detect bacteria, toxins, contamination, internal spoilage, or guarantee that an item is safe to consume. Always inspect labels directly and use appropriate food-safety practices.`,
  },
  {
    title: "5. Acceptable Use",
    body: `You agree not to use the Service to:

• Violate any applicable local, state, national, or international law or regulation.
• Scrape, crawl, or use automated means to access the Service without our prior written consent.
• Interfere with or disrupt the Service or servers or networks connected to the Service.
• Attempt to gain unauthorized access to any part of the Service, other accounts, or computer systems.
• Transmit any viruses, worms, defects, Trojan horses, or other malicious code.
• Impersonate any person or entity or misrepresent your affiliation with a person or entity.
• Collect or harvest any personally identifiable information from the Service.
• Use the Service for any commercial purpose without our prior written consent, including reselling price data.

We reserve the right to investigate and take appropriate legal action against anyone who, at our sole discretion, violates this provision.`,
  },
  {
    title: "6. Intellectual Property",
    body: `The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of PocketCart and its licensors. The Service is protected by copyright, trademark, and other laws of both South Korea and foreign countries.

Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PocketCart.

You retain ownership of any content you submit to the Service (e.g., watchlist data, budget preferences). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, and process that content solely for the purpose of providing the Service to you.`,
  },
  {
    title: "7. Third-Party Links & Services",
    body: `The Service may contain links to third-party websites or services, including retail store websites, that are not owned or controlled by PocketCart.

We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. Clicking on links to third-party retailers and making purchases is at your own risk.

You acknowledge and agree that PocketCart shall not be responsible or liable, directly or indirectly, for any damage or loss caused by or in connection with the use of any such third-party content, goods, or services.`,
  },
  {
    title: "8. Pricing Information Disclaimer",
    body: `While we strive to provide accurate and timely pricing information, PocketCart does not guarantee the accuracy, completeness, or reliability of any price data displayed in the Service. Prices are sourced from third-party retailers and may:

• Be delayed or outdated at the time of viewing.
• Differ from the actual price at the point of purchase.
• Exclude taxes, shipping fees, or other applicable charges.
• Be subject to regional availability or membership requirements.

PocketCart is not a retailer and does not sell any products. We are solely a comparison and tracking tool. Always verify the final price directly with the retailer before making a purchase.`,
  },
  {
    title: "9. Subscription & Payments",
    body: `Certain features of the Service may be offered on a subscription basis ("Premium"). By subscribing to Premium:

• You agree to pay the applicable subscription fees as described in the App.
• Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
• You may manage your subscription and cancel auto-renewal through your device's app store settings.
• Refunds are handled in accordance with the policies of the Apple App Store or Google Play Store, as applicable.

We reserve the right to modify subscription pricing with reasonable advance notice. Price changes will not affect your current billing period.`,
  },
  {
    title: "10. Limitation of Liability",
    body: `To the maximum extent permitted by applicable law, PocketCart and its directors, employees, partners, agents, suppliers, or affiliates shall not be liable for:

• Any indirect, incidental, special, consequential, or punitive damages.
• Any loss of profits, data, use, goodwill, or other intangible losses.
• Any damages resulting from your access to or use of (or inability to access or use) the Service.
• Any damages resulting from unauthorized access to or alteration of your transmissions or data.
• Any damages resulting from the conduct of any third party on the Service.

In no event shall our total liability exceed the amount you have paid us in the twelve (12) months preceding the claim, or fifty US dollars ($50), whichever is greater.`,
  },
  {
    title: "11. Indemnification",
    body: `You agree to defend, indemnify, and hold harmless PocketCart and its licensees, licensors, employees, contractors, agents, officers, and directors from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from:

• Your use of and access to the Service.
• Your violation of any term of these Terms.
• Your violation of any third-party right, including without limitation any copyright, property, or privacy right.`,
  },
  {
    title: "12. Termination",
    body: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason, including but not limited to a breach of these Terms.

If you wish to terminate your account, you may do so by:
• Using the account deletion feature within the App settings.
• Using the support page at ${SUPPORT_URL}.

Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.`,
  },
  {
    title: "13. Governing Law",
    body: `These Terms shall be governed and construed in accordance with the laws of the Republic of Korea, without regard to its conflict of law provisions.

Any disputes arising from or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in Seoul, Republic of Korea.

Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`,
  },
  {
    title: "14. Severability",
    body: `If any provision of these Terms is held to be unenforceable or invalid, that provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.`,
  },
  {
    title: "15. Entire Agreement",
    body: `These Terms, together with the Privacy Policy and any other legal notices published by us on the Service, constitute the entire agreement between you and PocketCart concerning the Service and supersede all prior agreements and understandings.`,
  },
  {
    title: "16. Contact Us",
    body: `If you have questions about these Terms of Service, you may contact us at:

PocketCart
Support: ${SUPPORT_URL}
Address: Seoul, South Korea

For general support inquiries, use the same support page and include your platform (iOS or Android).`,
  },
];

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
