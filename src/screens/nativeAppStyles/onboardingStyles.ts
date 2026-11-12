import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const onboardingStyles = StyleSheet.create({
  onboardingBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(11, 15, 4, 0.44)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  onboardingCard: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 16,
    gap: 8,
  },
  onboardingTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  onboardingMeta: {
    color: C.textSoft,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: F.regular,
  },
  onboardingActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  onboardingBtn: { flex: 1, minHeight: 44, paddingVertical: 8 },
  onboardingSkip: {
    alignSelf: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  onboardingSkipText: { color: C.textMuted, fontSize: 13, fontFamily: F.regular },
});
