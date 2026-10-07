export const PRIVACY_UPDATED = "October 3, 2026";
const PRIVACY_SUPPORT_URL = "https://pocketcart.app/support";

export const PRIVACY_SECTIONS = [
  {
    title: "1. Introduction",
    body: `Welcome to PocketCart ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.

When you use our mobile application ("App") and related services (collectively, the "Service"), you trust us with your personal information. We take your privacy very seriously. If you have any questions or concerns about this policy or our practices with regard to your personal information, please use our support page at ${PRIVACY_SUPPORT_URL}.`,
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
• Receipt Data — receipt photos you choose to save, stores, purchase dates, purchased items, quantities, prices, currency and payment totals. Saved receipts and photos are linked to your account for access across devices.
• Food Scan — temporarily unavailable. The app does not offer new food-analysis captures or requests while this feature is paused.
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
• To provide Receipts — privately storing your receipts, synchronizing them across your devices and calculating spending by purchase date. If you choose “Read receipt details,” we send the photo to OpenAI to extract purchase details for your review.
• To maintain our Service — we use service and notification diagnostics to investigate errors and keep features working.
• To communicate with you — responding to your inquiries, sending service updates, and providing customer support.
• To protect our Service — detecting and preventing fraud, abuse, and security incidents.

We do not sell your personal information to third parties. We do not use your data for targeted advertising from external ad networks.`,
  },
  {
    title: "4. Data Sharing & Third Parties",
    body: `We may share your information in the following situations:

• Family Sharing — When you create or join a family, members can see your display name and read, add, edit, and remove items in the shared Cart and My Freezer. Existing personal items are shared only when you choose to copy or move them. Leaving removes your access; shared items remain with the remaining members, including after account deletion. If the last member leaves or deletes their account, the shared inventory is deleted. Receipts, product alerts and subscription access remain personal and are not shared with family members.

• Subscriptions — If you use in-app subscriptions, Apple or Google processes the payment. RevenueCat processes your app account identifier and purchase/subscription status to validate access and restore purchases. Pocketcart does not receive your full payment card details.

• Service Providers — Supabase provides authentication, database storage, and server functions. Expo and Apple or Google deliver optional push notifications. Food Scan is temporarily unavailable. Optional receipt reading sends your chosen photo to OpenAI, without your PocketCart account identifier or login token, and requests that the API response not be stored. Provider processing and retention remain subject to the provider settings and agreement. Avoid photographing personal or sensitive information such as payment card or loyalty details. Google Analytics is used on the website where enabled, not in the native iOS app.
• Legal Obligations — We may disclose your information where required by law, court order, or governmental regulation.
• Business Transfers — In the event of a merger, acquisition, or asset sale, your data may be transferred as part of that transaction. We will notify you of any such change.
• With Your Consent — We may share your information for any other purpose with your explicit consent.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.

When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain certain information for legal or regulatory purposes.

Saved receipt photos and purchase details remain in your account until you delete the receipt or your account. Deleted receipts are immediately excluded from your spending; photo removal is retried if the storage service is temporarily unavailable.

Earlier Food Scan versions sent captures for analysis without intentionally saving them in the PocketCart application database. The provider may retain earlier requests under its settings and applicable agreement. Pausing Food Scan does not change the retention of those earlier provider requests.

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

To exercise any of these rights, please use our support page at ${PRIVACY_SUPPORT_URL}. We will respond within 30 days after receiving the request details needed to identify your account.`,
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
Support: ${PRIVACY_SUPPORT_URL}
For data protection inquiries, include "Privacy request" in your support request details.`,
  },
];


export const TERMS_UPDATED = "October 3, 2026";
const TERMS_SUPPORT_URL = "https://pocketcart.app/support";

export const TERMS_SECTIONS = [
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
• Save private purchase records with optional receipt photos and receipt-detail extraction for your review.

The Service is provided on an "as-is" and "as-available" basis. We do not guarantee that product pricing information will always be accurate, complete, or up-to-date, as prices are sourced from third-party retailers and may change without notice.

Food Scan is temporarily unavailable; new food-analysis captures and requests are paused. Earlier Food Scan results are automated estimates and are not medical, dietary, allergy, or food-safety advice. The feature cannot detect bacteria, toxins, contamination, internal spoilage, or guarantee that an item is safe to consume. Always inspect labels directly and use appropriate food-safety practices.`,
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
• Using the support page at ${TERMS_SUPPORT_URL}.

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
Support: ${TERMS_SUPPORT_URL}
Address: Seoul, South Korea

For general support inquiries, use the same support page and include your platform (iOS or Android).`,
  },
];
