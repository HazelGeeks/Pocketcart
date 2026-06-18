import P from "../constants/palette";

export const badgeStyles = {
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
} as const;
