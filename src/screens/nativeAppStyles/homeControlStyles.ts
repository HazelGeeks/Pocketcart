import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const homeControlStyles = StyleSheet.create({
  homeStoreCheckbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 1,
    borderColor: C.textMuted, alignItems: "center", justifyContent: "center",
    backgroundColor: C.white,
  },
  homeStoreCheckboxChecked: { backgroundColor: C.primary, borderColor: C.primary },
  searchCard: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
  },
  dealSearchRow: {
    gap: 6,
  },
  homeSearchToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    height: 42,
    color: C.text,
    fontSize: 15,
    fontFamily: F.semibold,
  },
  homeFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.primaryGhost,
    alignItems: "center",
    justifyContent: "center",
  },
  homeFilterButtonActive: {
    backgroundColor: C.primaryPale,
  },
  homeSortMenuTitle: {
    color: C.textMuted,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontFamily: F.bold,
  },
  homeFilterToggleRow: {
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: C.primaryGhost,
  },
  homeFilterToggleCopy: {
    flex: 1,
    gap: 2,
  },
  homeFilterToggleHelp: {
    color: C.textMuted,
    fontSize: 11,
    fontFamily: F.semibold,
  },
  homeSortOption: {
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  homeSortOptionDivider: {
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  homeSortOptionActive: {
    backgroundColor: C.primaryGhost,
  },
  homeSortOptionText: {
    color: C.textSoft,
    fontSize: 14,
    fontFamily: F.bold,
  },
  homeSortOptionTextActive: {
    color: C.primaryDeep,
    fontFamily: F.extraBold,
  },
});
