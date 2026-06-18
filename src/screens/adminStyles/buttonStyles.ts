import { marketingPalette as C } from "../../shared/design/palette";

export const adminButtonStyles = {
  btn: {
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPrimary: {
    backgroundColor: C.primaryDark,
    borderColor: C.primaryDark,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  btnGhost: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnGhostText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnSidebar: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnSidebarMobile: {
    minHeight: 30,
    paddingHorizontal: 12,
    flexShrink: 0,
    minWidth: 78,
  },
  btnSidebarText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnLink: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
    minHeight: 30,
    paddingHorizontal: 10,
  },
  btnLinkText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#fff2f2",
    borderColor: "#f0c0c0",
    minHeight: 32,
    minWidth: 74,
  },
  btnDangerText: {
    color: "#a53d3d",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDangerSoft: {
    backgroundColor: "#fff6f6",
    borderColor: "#f3d1d1",
    minHeight: 28,
    paddingHorizontal: 10,
  },
  btnDangerSoftText: {
    color: "#b04a4a",
    fontSize: 11,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.65,
  },
} as const;
