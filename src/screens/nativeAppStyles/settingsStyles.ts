import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const settingsStyles = StyleSheet.create({
  settingsProfileIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsProfileCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  settingsGroup: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  settingsLocationBlock: {
    gap: 10,
    paddingVertical: 10,
  },
  settingsLocationTopRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsLocationIdentity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  settingsLocationStatus: {
    color: C.textSoft,
    fontSize: 12,
    fontFamily: F.regular,
  },
  settingsLocationAction: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: C.primaryGhost,
  },
  settingsLocationActionText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontFamily: F.bold,
  },
  settingsLocationEditor: {
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    paddingTop: 10,
  },
  settingsCurrentLocationButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    backgroundColor: C.primaryGhost,
  },
  settingsCurrentLocationButtonText: {
    color: C.primaryDeep,
    fontSize: 13,
    fontFamily: F.bold,
  },
  settingsPostalRow: {
    flexDirection: "row",
    gap: 8,
  },
  settingsPostalInput: {
    minWidth: 0,
    flex: 1,
  },
  settingsPostalButton: {
    minWidth: 86,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: C.primaryDeep,
  },
  settingsPostalButtonPressed: {
    opacity: 0.86,
  },
  settingsRowCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  settingsRowValue: {
    maxWidth: "48%",
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.semibold,
  },
  settingsHelp: {
    color: C.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: F.regular,
  },
  settingsInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: F.semibold,
  },
  settingsButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  settingsButton: {
    minHeight: 44,
    flex: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  settingsButtonPrimary: {
    backgroundColor: C.primaryDeep,
  },
  settingsButtonSecondary: {
    backgroundColor: C.primaryGhost,
  },
  settingsButtonDanger: {
    backgroundColor: "#A83939",
  },
  settingsButtonPrimaryText: {
    color: C.white,
    fontSize: 13,
    textAlign: "center",
    fontFamily: F.bold,
  },
  settingsButtonSecondaryText: {
    color: C.text,
    fontSize: 13,
    textAlign: "center",
    fontFamily: F.bold,
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.line,
  },
  settingsToggleRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  settingsRowPressed: {
    backgroundColor: C.primaryGhost,
  },
  settingsLinkMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsChevron: {
    color: C.textMuted,
    fontSize: 24,
    lineHeight: 26,
    fontFamily: F.regular,
  },
  settingsDangerText: {
    color: "#A83939",
  },
  settingsDangerBlock: {
    gap: 9,
    paddingVertical: 12,
  },
  settingsMessage: {
    borderRadius: 12,
    backgroundColor: C.primaryGhost,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  settingsMessageText: {
    color: C.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.semibold,
  },
  settingsSummaryRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  settingsSummaryValue: {
    flex: 1,
    color: C.text,
    fontSize: 13,
    lineHeight: 17,
    textAlign: "right",
    fontFamily: F.semibold,
  },
});
