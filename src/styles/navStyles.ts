import { Platform } from "react-native";
import P from "../constants/palette";

export const navStyles = {
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
} as const;
