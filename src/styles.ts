import { Platform, StyleSheet } from "react-native";
import P from "./constants/palette";
import { semanticPalette } from "./shared/design/palette";

const s = StyleSheet.create({
  /* ── Root ── */
  root: {
    flex: 1,
    backgroundColor: P.bg,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  /* ── Navbar ── */
  nav: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 14,
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(16px)" } as any) : {}),
  },
  navInner: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  brandMarkText: {
    color: P.white,
    fontSize: 14,
    fontWeight: "800",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: P.text,
  },
  navLinks: {
    flexDirection: "row",
    gap: 28,
  },
  navLink: {
    fontSize: 15,
    fontWeight: "600",
    color: P.textSoft,
  },
  navActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navLangWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: P.line,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
    padding: 3,
  },
  navLangOption: {
    minWidth: 42,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  navLangOptionActive: {
    backgroundColor: P.primaryGhost,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 1px 3px rgba(30,46,12,0.08)" } as any)
      : {}),
  },
  navLangOptionPressed: {
    opacity: 0.8,
  },
  navLangOptionText: {
    fontSize: 13,
    fontWeight: "800",
    color: P.textSoft,
    letterSpacing: 0.4,
  },
  navLangOptionTextActive: {
    color: P.primaryDeep,
  },
  navCta: {
    backgroundColor: P.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  navCtaText: {
    color: P.white,
    fontSize: 14,
    fontWeight: "700",
  },
  navDownloadWrap: {
    position: "relative",
  },
  navDownloadMenu: {
    position: "absolute",
    top: 48,
    right: 0,
    minWidth: 210,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.white,
    padding: 6,
    gap: 6,
    zIndex: 180,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 12px 32px rgba(30,46,12,0.16)" } as any)
      : {}),
  },
  navDownloadMenuWeb: {
    top: 44,
  },
  navDownloadItem: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navDownloadItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: P.text,
  },

  /* ── Store badges ── */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: P.badgeBg,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    minWidth: 170,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  badgeIconWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeSmall: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  badgeLarge: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },

  /* ── Hero ── */
  heroWrap: {
    backgroundColor: P.bg,
    paddingTop: 64,
    paddingBottom: 80,
    overflow: "hidden",
  },
  heroContent: {
    gap: 40,
  },
  heroCopy: {
    gap: 18,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(171,201,0,0.35)",
    backgroundColor: "rgba(171,201,0,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: P.primaryDeep,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800",
    color: P.text,
  },
  heroSub: {
    fontSize: 18,
    lineHeight: 28,
    color: P.textSoft,
  },

  /* Hero decorative card */
  heroCardWrap: {
    width: 300,
    minHeight: 340,
    position: "relative",
  },
  heroCard: {
    backgroundColor: P.white,
    borderRadius: 28,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: P.line,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 12px 40px rgba(30,46,12,0.08)" } as any)
      : {}),
  },
  heroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
  },
  heroCardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.primary,
  },
  heroCardHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: P.text,
  },
  heroCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: P.primaryGhost,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroCardStore: {
    fontSize: 13,
    fontWeight: "600",
    color: P.textSoft,
    flex: 1,
  },
  heroCardPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: P.text,
    marginRight: 10,
  },
  heroCardDelta: {
    backgroundColor: "rgba(171,201,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroCardDeltaText: {
    fontSize: 12,
    fontWeight: "700",
    color: P.primaryDeep,
  },
  heroCardBottom: {
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 10,
  },
  heroCardSaving: {
    fontSize: 13,
    fontWeight: "700",
    color: P.primaryDark,
    textAlign: "center",
  },

  /* ── Features ── */
  featWrap: {
    backgroundColor: P.white,
    paddingTop: 72,
    paddingBottom: 80,
    overflow: "hidden",
  },
  sectionInner: {
    alignSelf: "center",
    width: "100%",
    gap: 12,
  },
  sectionEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    color: P.text,
  },
  sectionSub: {
    fontSize: 17,
    lineHeight: 26,
    color: P.textSoft,
    marginBottom: 8,
  },
  featGrid: {
    gap: 20,
    marginTop: 20,
  },
  featCard: {
    backgroundColor: P.bg,
    borderRadius: 24,
    padding: 26,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(171,201,0,0.12)",
    minHeight: 200,
  },
  featIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(171,201,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featIcon: {
    fontSize: 22,
    color: P.primaryDeep,
  },
  featTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: P.text,
  },
  featBody: {
    fontSize: 15,
    lineHeight: 23,
    color: P.textSoft,
  },

  /* ── How It Works ── */
  howWrap: {
    backgroundColor: P.primaryGhost,
    paddingTop: 72,
    paddingBottom: 80,
    overflow: "hidden",
  },
  stepGrid: {
    gap: 24,
    marginTop: 28,
  },
  stepCard: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    position: "relative",
  },
  stepNumCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: P.primary,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 6px 20px rgba(171,201,0,0.25)" } as any)
      : {}),
  },
  stepNumText: {
    fontSize: 20,
    fontWeight: "800",
    color: P.white,
  },
  stepConnector: {
    position: "absolute",
    top: 30,
    right: -20,
    width: 40,
    height: 4,
    backgroundColor: "rgba(171,201,0,0.2)",
    borderRadius: 2,
  },
  stepConnectorDot: {
    position: "absolute",
    right: -4,
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.primaryLight,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: P.text,
    textAlign: "center",
  },
  stepBody: {
    fontSize: 15,
    lineHeight: 23,
    color: P.textSoft,
    textAlign: "center",
    maxWidth: 280,
  },

  /* Stats row */
  statRow: {
    gap: 16,
    marginTop: 44,
  },
  statCard: {
    backgroundColor: P.white,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(171,201,0,0.14)",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: P.primaryDeep,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: P.textMuted,
  },

  /* ── FAQ ── */
  faqWrap: {
    backgroundColor: P.white,
    paddingTop: 72,
    paddingBottom: 80,
    overflow: "hidden",
  },
  faqGrid: {
    gap: 18,
    marginTop: 22,
  },
  faqCard: {
    backgroundColor: P.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(171,201,0,0.15)",
    padding: 24,
    gap: 10,
    minHeight: 220,
  },
  faqQ: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: P.text,
  },
  faqA: {
    fontSize: 15,
    lineHeight: 23,
    color: P.textSoft,
  },

  /* ── CTA section ── */
  ctaWrap: {
    backgroundColor: P.dark,
    paddingTop: 80,
    paddingBottom: 80,
    overflow: "hidden",
    minHeight: 400,
  },
  ctaInner: {
    alignItems: "center",
    gap: 18,
  },
  ctaEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  ctaTitle: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "800",
    color: P.white,
    textAlign: "center",
  },
  ctaSub: {
    fontSize: 17,
    lineHeight: 26,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },

  /* ── Footer ── */
  footer: {
    backgroundColor: P.dark,
    borderTopWidth: 1,
    borderTopColor: "rgba(171,201,0,0.10)",
    paddingTop: 28,
    paddingBottom: 18,
  },
  footerInner: {
    width: "100%",
    alignSelf: "center",
    gap: 18,
  },
  footerInnerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  footerCol: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  footerBrand: {
    gap: 10,
    justifyContent: "flex-start",
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  footerMarkText: {
    color: P.white,
    fontSize: 13,
    fontWeight: "800",
  },
  footerBrandName: {
    fontSize: 17,
    fontWeight: "700",
    color: P.white,
  },
  footerTagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
  },
  footerLinkCols: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
  footerLinkColsMobile: {
    flexWrap: "wrap",
    rowGap: 18,
    columnGap: 24,
  },
  footerLinkCol: {
    gap: 10,
    minWidth: 140,
    flexShrink: 1,
  },
  footerLinkTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  footerLinkMuted: {
    fontSize: 14,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 22,
  },
  footerBottom: {
    width: "100%",
    alignSelf: "center",
    marginTop: 0,
  },
  footerSignup: {
    alignItems: "center",
    gap: 6,
    width: "100%",
    paddingVertical: 0,
  },
  footerSignupDesktop: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingVertical: 0,
  },
  footerSignupTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: P.white,
    textAlign: "center",
  },
  footerSignupSub: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    maxWidth: 420,
  },
  footerSignupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    width: "100%",
    maxWidth: 420,
  },
  footerSignupRowStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  footerSignupInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: P.white,
    backgroundColor: "rgba(255,255,255,0.06)",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  footerSignupBtn: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: semanticPalette.success,
    alignItems: "center",
    justifyContent: "center",
  },
  footerSignupBtnBlock: {
    width: "100%",
  },
  footerSignupBtnText: {
    color: P.white,
    fontSize: 14,
    fontWeight: "700",
    ...(Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as any) : {}),
  },
  footerSignupDone: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(171,201,0,0.12)",
  },
  footerSignupDoneText: {
    fontSize: 14,
    color: P.primary,
    fontWeight: "600",
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 6,
  },
  footerCopy: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  footerMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  footerSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerSocialSep: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.35)",
  },
  footerSocialLink: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});

export default s;
