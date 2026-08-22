import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";

export const headerActionStyles = StyleSheet.create({
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAlertDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: C.white,
    backgroundColor: C.primary,
  },
});
