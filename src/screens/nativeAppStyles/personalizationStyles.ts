import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const personalizationStyles = StyleSheet.create({
  personalizationPage: {
    gap: 16,
    paddingTop: 8,
  },
  flowHeroCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  flowHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryGhost,
    borderWidth: 1,
    borderColor: C.line,
  },
  flowHeroIconText: {
    color: C.primaryDeep,
    fontSize: 24,
    fontFamily: F.extraBold,
  },
  surveyCard: {
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 16,
  },
  surveyQuestionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  surveyNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryGhost,
    borderWidth: 1,
    borderColor: C.line,
  },
  surveyNumberText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontFamily: F.extraBold,
  },
  surveyTitle: {
    color: C.text,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: F.extraBold,
  },
  surveyChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  surveyChip: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  surveyChipSelected: {
    borderColor: C.primaryDeep,
    backgroundColor: C.primaryGhost,
  },
  surveyChipText: {
    color: C.textSoft,
    fontSize: 13,
    fontFamily: F.semibold,
  },
  surveyChipTextSelected: {
    color: C.primaryDeep,
    fontFamily: F.bold,
  },
  surveyOptionStack: {
    gap: 8,
  },
  surveyRadioRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 13,
  },
  surveyRadioRowSelected: {
    borderColor: C.primaryDeep,
    backgroundColor: C.primaryGhost,
  },
  surveyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  surveyRadioSelected: {
    borderColor: C.primaryDeep,
  },
  surveyRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primaryDeep,
  },
  surveyRadioLabel: {
    color: C.text,
    fontSize: 14,
    fontFamily: F.semibold,
  },
  personalizationActions: {
    gap: 4,
    paddingTop: 4,
  },
  personalizationSkipButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
