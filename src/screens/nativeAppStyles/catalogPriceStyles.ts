import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const catalogPriceStyles = StyleSheet.create({
  homePriceCurrentCard: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 8,
    gap: 2,
  },
  homePriceValue: {
    color: C.text,
    fontSize: 15,
    fontWeight: "900",
    fontFamily: F.extraBold,
  },
  homePriceStoreText: {
    color: C.textSoft,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: F.bold,
    lineHeight: 15,
  },
  priceJudgmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceJudgmentCell: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    padding: 10,
    backgroundColor: C.bg,
    gap: 4,
  },
});
