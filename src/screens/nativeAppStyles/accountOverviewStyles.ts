import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const accountOverviewStyles = StyleSheet.create({
  settingsPage: { gap: 28, paddingBottom: 24 },
  settingsProfileCard: {
    gap: 20,
    backgroundColor: C.primaryPale,
    borderRadius: 20,
    padding: 24,
    paddingVertical: 30,
  },
  settingsAccountTitle: { color: C.primaryDeep, fontSize: 34, fontFamily: F.extraBold },
  settingsProfileTitle: { color: C.primaryDeep, fontSize: 20, fontFamily: F.extraBold },
  settingsProfileSubtitle: {
    color: C.textSoft, fontSize: 14, lineHeight: 21, fontFamily: F.regular,
  },
  settingsAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center", backgroundColor: C.white,
  },
  settingsSection: { gap: 14 },
  settingsSectionLabel: { color: C.primaryDeep, fontSize: 21, fontFamily: F.extraBold },
  settingsLinkRow: {
    minHeight: 68, flexDirection: "row", alignItems: "center",
    gap: 14, paddingVertical: 16,
  },
  settingsRowTitle: { color: C.text, fontSize: 16, fontFamily: F.semibold },
  settingsLogout: {
    minHeight: 54, borderRadius: 12, borderWidth: 1, borderColor: C.primaryDeep,
    alignItems: "center", justifyContent: "center", padding: 14,
  },
  settingsLogoutText: { color: C.primaryDeep, fontSize: 16, fontFamily: F.bold },
});
