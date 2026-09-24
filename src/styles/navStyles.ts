import { webViewStyle } from "../shared/design/webViewStyle";
import { Platform } from "react-native";
import P from "../constants/palette";

export const navStyles = {
  nav: {
    backgroundColor: P.glass,
    borderBottomWidth: 1,
    borderBottomColor: P.line,
    paddingVertical: 12,
    ...(Platform.OS === "web" ? (webViewStyle({ backdropFilter: "blur(20px)" })) : {}),
  },
  navInner: {
    maxWidth: 1280,
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
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 17,
    fontWeight: "800",
    color: P.text,
    letterSpacing: -0.3,
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
      ? (webViewStyle({ boxShadow: "0 1px 3px rgba(30,46,12,0.08)" }))
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
    backgroundColor: P.dark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navCtaText: {
    color: P.white,
    fontSize: 14,
    fontWeight: "700",
  },
} as const;
