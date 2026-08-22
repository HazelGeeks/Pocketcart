import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const saleAlertsStyles = StyleSheet.create({
  alertActivity: {
    gap: 0,
  },
  alertActivityHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.primaryDeep,
  },
  alertActivityHeading: {
    color: C.text,
    fontSize: 22,
    fontFamily: F.extraBold,
  },
  alertActivityMarkRead: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  alertActivityMarkReadText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontFamily: F.bold,
  },
  alertActivityMessage: {
    color: C.textSoft,
    fontSize: 12,
    lineHeight: 17,
    paddingVertical: 12,
    fontFamily: F.semibold,
  },
  alertActivityRow: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 4,
    paddingVertical: 18,
  },
  alertActivityRowUnread: {
    backgroundColor: C.primaryGhost,
    marginHorizontal: -8,
    paddingHorizontal: 12,
  },
  alertActivityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  alertActivityCopy: {
    minWidth: 0,
    flex: 1,
    gap: 5,
  },
  alertActivityMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  alertActivitySource: {
    minWidth: 0,
    flex: 1,
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.semibold,
  },
  alertActivityTime: {
    color: C.textMuted,
    fontSize: 11,
    fontFamily: F.regular,
  },
  alertActivityTitle: {
    color: C.text,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: F.extraBold,
  },
  alertActivityBody: {
    color: C.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.regular,
  },
  alertActivityEmpty: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 52,
  },
  alertActivityEmptyTitle: {
    color: C.text,
    fontSize: 17,
    fontFamily: F.extraBold,
  },
  alertActivityEmptyCopy: {
    color: C.textSoft,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    fontFamily: F.regular,
  },
});
