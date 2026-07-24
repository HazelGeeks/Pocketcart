import { Platform } from "react-native";

export const adminUserStyles: Record<string, any> = {
  userDirectoryStack: {
    gap: 12,
  },
  userDirectoryIntro: {
    color: "#68758a",
    fontSize: 13,
    lineHeight: 19,
  },
  userDirectorySearch: {
    flexGrow: 1,
    minWidth: 320,
  },
  userDirectoryLoading: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  userDirectoryGrid: {
    gap: 10,
    ...(Platform.OS === "web"
      ? ({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 410px), 1fr))",
          alignItems: "stretch",
        } as any)
      : {}),
  },
  userDirectoryCard: {
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce3ed",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 12,
  },
  userDirectoryCardHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  userDirectoryIdentity: {
    flexGrow: 1,
    minWidth: 180,
    gap: 2,
  },
  userDirectoryName: {
    color: "#2d3444",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  userDirectoryEmail: {
    color: "#66748a",
    fontSize: 12,
    lineHeight: 17,
  },
  userDirectoryStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  userDirectoryStatusChip: {
    borderRadius: 999,
    backgroundColor: "#edf1f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userDirectoryStatusChipAdmin: {
    backgroundColor: "#e5e7ff",
  },
  userDirectoryStatusChipSuccess: {
    backgroundColor: "#dcf5e7",
  },
  userDirectoryStatusChipWarning: {
    backgroundColor: "#fff0d6",
  },
  userDirectoryStatusText: {
    color: "#3f4b5e",
    fontSize: 10,
    fontWeight: "800",
  },
  userDirectoryMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  userDirectoryMetaLabel: {
    color: "#8490a2",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  userDirectoryMetaValue: {
    color: "#394457",
    fontSize: 12,
    lineHeight: 17,
  },
  userDirectoryPreferenceGroup: {
    borderTopWidth: 1,
    borderTopColor: "#edf0f5",
    paddingTop: 9,
    gap: 2,
  },
  userDirectoryActivityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  userDirectoryActivityText: {
    borderRadius: 7,
    backgroundColor: "#f2f5f9",
    color: "#4d5a6f",
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
  },
};
