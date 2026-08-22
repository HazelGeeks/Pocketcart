import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const productDetailStyles = StyleSheet.create({
  productDetailStack: {
    gap: 0,
  },
  productHeroCard: {
    backgroundColor: C.bg,
  },
  productHeroImage: {
    width: "100%",
    height: 176,
    borderRadius: 16,
    backgroundColor: C.primaryPale,
  },
  productHeroPlaceholder: {
    width: "100%",
    height: 176,
    borderRadius: 16,
    backgroundColor: C.primaryPale,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  productHeroPlaceholderText: {
    color: C.primaryDeep,
    fontSize: 14,
    fontFamily: F.extraBold,
    textAlign: "center",
  },
  productHeroBody: {
    paddingVertical: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  productHeroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  productHeroTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  productHeroName: {
    color: C.text,
    fontSize: 22,
    lineHeight: 27,
    fontFamily: F.extraBold,
  },
  productHeroDecision: {
    minWidth: 68,
    borderRadius: 999,
    backgroundColor: C.primaryGhost,
    color: C.primaryDeep,
    paddingHorizontal: 11,
    paddingVertical: 6,
    textAlign: "center",
    fontSize: 12,
    fontFamily: F.extraBold,
    overflow: "hidden",
  },
  productHeroStore: {
    color: C.primaryDeep,
    fontSize: 13,
    fontFamily: F.extraBold,
  },
  productHeroPriceRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 12,
  },
  productHeroPrice: {
    color: C.text,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: F.extraBold,
  },
  productHeroChangeCard: {
    minWidth: 112,
    borderLeftWidth: 1,
    borderLeftColor: C.line,
    paddingLeft: 16,
    justifyContent: "center",
    gap: 2,
  },
  productHeroChange: {
    color: C.text,
    fontSize: 18,
    fontFamily: F.extraBold,
  },
  productDecisionText: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.extraBold,
  },
  productHeroActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  productHeroPrimaryAction: {
    flex: 1,
  },
  productHeroSecondaryAction: {
    minWidth: 120,
  },
  watchlistCtaBtn: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  watchlistCtaText: {
    color: C.white,
    fontSize: 14,
    fontFamily: F.extraBold,
  },
  watchlistSecondaryBtn: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: C.primaryGhost,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  watchlistSecondaryText: {
    color: C.text,
    fontSize: 13,
    fontFamily: F.extraBold,
  },
  watchlistCtaHelp: {
    color: C.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: F.regular,
  },
  productTrendCard: {
    paddingVertical: 20,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  productStoreComparisonCard: {
    paddingVertical: 20,
    gap: 10,
  },
  productTrendHeading: {
    color: C.text,
    fontSize: 19,
    fontFamily: F.extraBold,
  },
  productInfoSection: {
    paddingVertical: 20,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  productInfoList: {
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  productInfoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  productInfoValue: {
    flex: 1,
    textAlign: "right",
  },
});
