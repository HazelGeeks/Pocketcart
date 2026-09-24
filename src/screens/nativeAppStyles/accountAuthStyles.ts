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
  authGoogleMark: {
    color: "#4285F4",
    fontSize: 18,
    fontFamily: F.extraBold,
  },
  authSocialStatus: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: "center",
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
