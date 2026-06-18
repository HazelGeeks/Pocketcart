import { Platform } from "react-native";
import P from "../constants/palette";

export const sectionStyles = {
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
} as const;
