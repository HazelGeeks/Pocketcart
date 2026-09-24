import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const commonStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
  },
  sectionStack: {
    gap: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  sectionSub: {
    color: C.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.regular,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primary,
    backgroundColor: C.primaryGhost,
    color: C.primaryDeep,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "800",
    fontFamily: F.extraBold,
    overflow: "hidden",
  },
  dealFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryLabel: {
    color: C.textSoft,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  rowCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 14,
    gap: 6,
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
  },
});
