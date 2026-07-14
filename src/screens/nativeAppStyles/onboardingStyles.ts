import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const onboardingStyles = StyleSheet.create({
  watchTargetSummary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    padding: 8,
    gap: 8,
  },
  saleAlertCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 10,
    gap: 10,
  },
  saleAlertCopy: {
    gap: 4,
  },
  saleAlertBtn: {
    alignSelf: "stretch",
  },
  targetBadge: {
    backgroundColor: C.primaryGhost,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#EAF3D2",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: C.primary,
  },
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
  onboardingBtn: {
    minHeight: 42,
    marginTop: 4,
  },
  inlineToggleBtn: {
    minHeight: 40,
    marginTop: 4,
    marginBottom: 4,
  },
});
