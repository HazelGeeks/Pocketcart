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

  /* Photo-led grocery story */
  heroCardWrap: {
    width: 300,
    minHeight: 340,
    position: "relative",
  },
  heroPhotoCard: {
    backgroundColor: P.white,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: P.line,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 12px 40px rgba(30,46,12,0.08)" } as any)
      : {}),
  },
  heroPhotoImage: {
    minHeight: 420,
    justifyContent: "flex-end",
  },
  heroPhotoImageSurface: {
    borderRadius: 27,
  },
  heroPhotoShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(5, 28, 16, 0.48)",
  },
  heroPhotoCopy: {
    padding: 24,
    gap: 9,
  },
  heroPhotoEyebrowWrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroPhotoEyebrow: {
    color: P.primaryDeep,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroPhotoTitle: {
    color: P.white,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "800",
  },
  heroPhotoBody: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
} as const;
