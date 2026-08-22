import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const foodScanLinkStyles = StyleSheet.create({
  foodScanLinkLoading: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  foodScanLinkCard: {
    minHeight: 118,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 2,
  },
  foodScanLinkCardPressed: {
    opacity: 0.68,
  },
  foodScanLinkContent: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  foodScanLinkName: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  foodScanLinkPrice: {
    color: C.primaryDeep,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  foodScanLinkMeta: {
    color: C.textSoft,
    fontSize: 12,
    fontFamily: F.regular,
  },
  foodScanLinkPrevious: {
    color: C.textMuted,
    fontSize: 11,
    fontFamily: F.regular,
  },
  foodScanLinkAction: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  foodScanLinkActionText: {
    color: C.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
});
