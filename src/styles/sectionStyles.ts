import P from "../constants/palette";

export const sectionStyles = {
  sectionEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: P.primary,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "800",
    color: P.text,
    letterSpacing: -1,
  },
  sectionSub: {
    fontSize: 17,
    lineHeight: 26,
    color: P.textSoft,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: "#F7FAF8",
    padding: 26,
    alignItems: "flex-start",
    gap: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: P.text,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: P.textMuted,
  },

  /* ── FAQ ── */
  faqWrap: {
    backgroundColor: P.white,
    paddingTop: 64,
    paddingBottom: 64,
    overflow: "hidden",
  },
  faqInner: { width: "100%", maxWidth: 1280, alignSelf: "center", gap: 64 },
  faqIntro: { gap: 12 },
  faqList: { borderTopWidth: 1, borderTopColor: "rgba(7,31,18,0.14)" },
  faqItem: { borderBottomWidth: 1, borderBottomColor: "rgba(7,31,18,0.14)", paddingVertical: 22 },
  faqQuestionRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  faqItemNum: { width: 26, color: P.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  faqToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F4F1",
  },
  faqToggleOpen: { backgroundColor: P.primary },
  faqQ: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    color: P.text,
  },
  faqA: {
    marginLeft: 42,
    maxWidth: 650,
    paddingTop: 14,
    paddingRight: 42,
    fontSize: 15,
    lineHeight: 24,
    color: P.textSoft,
  },
  ctaEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: "#CFF36B",
    letterSpacing: 2,
  },
  ctaTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800",
    color: P.white,
    textAlign: "center",
    letterSpacing: -1.2,
  },
} as const;
