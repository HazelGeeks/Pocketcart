import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const detailNavigationStyles = StyleSheet.create({
  detailActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailActionBtn: {
    flex: 1,
  },
  detailNavBtn: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  detailNavBtnAccent: {
    backgroundColor: C.primaryGhost,
    borderColor: C.primary,
  },
  detailNavText: {
    color: C.primaryDeep,
    fontSize: 13,
    fontWeight: "900",
    fontFamily: F.extraBold,
  },
});
