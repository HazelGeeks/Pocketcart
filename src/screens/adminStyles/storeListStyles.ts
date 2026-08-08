import { Platform } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";

export const adminStoreListStyles: Record<string, any> = {
  storeListTable: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce3ed",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  storeListColumnHeader: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f3f6fa",
  },
  storeListColumnLabel: {
    color: "#6f7b8e",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  storeListRow: {
    minWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#e7ebf1",
    backgroundColor: "#ffffff",
  },
  storeListRowActive: {
    borderColor: C.primaryLight,
    backgroundColor: C.primaryGhost,
  },
  storeListRowMain: {
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeListRowMainCompact: {
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 8,
  },
  storeListStoreColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  storeListStoreColumnCompact: {
    width: "100%",
    minWidth: "100%",
  },
  storeListStatusColumn: {
    width: 126,
    minWidth: 126,
    alignItems: "flex-start",
    gap: 5,
  },
  storeListCoverageColumn: {
    width: 94,
    minWidth: 94,
    gap: 6,
  },
  storeListLatestColumn: {
    width: 112,
    minWidth: 112,
    gap: 6,
  },
  storeListActionsColumn: {
    width: 276,
    minWidth: 276,
    alignItems: "flex-end",
  },
  storeListMetricCompact: {
    flex: 1,
    width: "auto",
    minWidth: 132,
    borderRadius: 8,
    backgroundColor: "#f3f6fa",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  storeListActionsCompact: {
    width: "100%",
    minWidth: "100%",
  },
  storeListLabelValue: {
    gap: 1,
  },
  storeListMetricLabel: {
    color: "#7b8799",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  storeListMetricValue: {
    color: "#33425e",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  storeListMetricSecondary: {
    color: "#6f7b8e",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  storeListSupportingText: {
    color: "#7a8699",
    fontSize: 10,
    lineHeight: 14,
  },
  storeMetaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primaryLight,
    backgroundColor: C.primaryGhost,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  storeMetaChipText: {
    color: C.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
  },
  storeInactiveChip: {
    borderColor: "#d6dce7",
    backgroundColor: "#eef1f6",
  },
  storeInactiveChipText: {
    color: "#66748f",
  },
  storeActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    ...(Platform.OS === "web" ? ({ display: "inline-flex" } as any) : {}),
  },
  storeActionBtn: {
    minHeight: 32,
    paddingHorizontal: 10,
  },
  storeListDetailsPanel: {
    borderTopWidth: 1,
    borderTopColor: "#e7ebf1",
    backgroundColor: "#fafbfd",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
};
