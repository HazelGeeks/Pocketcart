import { Platform } from "react-native";
import P from "../constants/palette";

export const heroStyles = {
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
    borderColor: "rgba(97,227,146,0.35)",
    backgroundColor: "rgba(97,227,146,0.08)",
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
    backgroundColor: "rgba(97,227,146,0.18)",
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
} as const;
