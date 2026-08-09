import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const accountAuthStyles = StyleSheet.create({
  authPage: {
    gap: 24,
    paddingTop: 8,
  },
  authIntro: {
    gap: 7,
  },
  authTitle: {
    color: C.text,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: F.extraBold,
  },
  authDescription: {
    color: C.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.regular,
  },
  authCard: {
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 16,
  },
  authSocialGroup: {
    gap: 10,
  },
  authAppleButton: {
    width: "100%",
    height: 48,
  },
  authGoogleButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 16,
  },
  authGoogleButtonPressed: {
    backgroundColor: C.primaryGhost,
  },
  authGoogleMark: {
    color: "#4285F4",
    fontSize: 18,
    fontFamily: F.extraBold,
  },
  authGoogleButtonText: {
    color: C.text,
    fontSize: 14,
    fontFamily: F.bold,
  },
  authSocialStatus: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: "center",
    fontFamily: F.semibold,
  },
  authDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authDividerLine: {
    height: StyleSheet.hairlineWidth,
    flex: 1,
    backgroundColor: C.line,
  },
  authDividerText: {
    color: C.textMuted,
    fontSize: 11,
    fontFamily: F.semibold,
  },
  authField: {
    gap: 7,
  },
  authFieldLabel: {
    color: C.text,
    fontSize: 13,
    fontFamily: F.bold,
  },
  authFinePrint: {
    color: C.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontFamily: F.regular,
  },
  authInlineButton: {
    minHeight: 44,
    alignSelf: "flex-end",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    paddingHorizontal: 4,
  },
  authLegalRow: {
    minHeight: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: -12,
  },
  authLegalLink: {
    minHeight: 44,
    justifyContent: "center",
  },
  authLegalLinkText: {
    color: C.primaryDeep,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: F.bold,
  },
  authSwitchRow: {
    alignItems: "center",
    gap: 4,
  },
  authSwitchCopy: {
    color: C.textSoft,
    fontSize: 13,
    fontFamily: F.regular,
  },
  authTextButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  authTextButtonLabel: {
    color: C.primaryDeep,
    fontSize: 14,
    fontFamily: F.bold,
  },
});
