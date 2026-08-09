import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const homeControlStyles = StyleSheet.create({
  searchCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
  },
  dealSearchRow: {
    gap: 6,
  },
  searchInput: {
    height: 42,
    color: C.text,
    fontSize: 15,
    fontFamily: F.semibold,
  },
  sortSegmentedControl: {
    height: 40,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    flexDirection: "row",
  },
  sortSegment: {
    flex: 1,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sortSegmentDivider: {
    borderLeftWidth: 1,
    borderLeftColor: C.line,
  },
  sortSegmentActive: {
    backgroundColor: C.primaryGhost,
  },
  sortSegmentText: {
    color: C.textMuted,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
    fontFamily: F.bold,
  },
  sortSegmentTextActive: {
    color: C.primaryDeep,
    fontFamily: F.extraBold,
  },
});
