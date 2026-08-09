import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const headerActionStyles = StyleSheet.create({
  headerAlertButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.primaryGhost,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAlertBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: C.white,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAlertBadgeText: {
    color: C.white,
    fontSize: 8,
    lineHeight: 9,
    fontFamily: F.extraBold,
  },
});
