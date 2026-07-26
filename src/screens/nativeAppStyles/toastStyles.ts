import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const toastStyles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    zIndex: 20,
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  toastText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: F.extraBold,
    textAlign: "center",
  },
});
