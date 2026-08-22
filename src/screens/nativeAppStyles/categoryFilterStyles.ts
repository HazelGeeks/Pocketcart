import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const categoryFilterStyles = StyleSheet.create({
  categoryTile: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  categoryTileImageFrame: {
    width: 58,
    height: 58,
    overflow: "hidden",
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTileImageFrameActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryGhost,
  },
  categoryTileImage: {
    width: "100%",
    height: "100%",
  },
  categoryTileLabel: {
    maxWidth: 72,
    color: C.textMuted,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    fontFamily: F.bold,
  },
  categoryTileLabelActive: {
    color: C.primaryDeep,
    fontFamily: F.extraBold,
  },
});
