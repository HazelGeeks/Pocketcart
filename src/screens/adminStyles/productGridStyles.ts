import { Platform } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";

export const adminProductGridStyles: Record<string, any> = {
  productHeaderStack: {
    position: "relative",
    zIndex: 20,
    gap: 8,
  },
  csvActionsMenuPanelInline: {
    width: "100%",
    maxWidth: 280,
    alignSelf: "flex-end",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 6,
    gap: 2,
    ...(Platform.OS === "web"
      ? ({
          position: "absolute",
          top: "100%",
          right: 0,
          zIndex: 30,
          marginTop: 8,
          boxShadow: "0 10px 24px rgba(36, 48, 72, 0.12)",
        } as any)
      : {}),
  },
  productGrid: {
    gap: 10,
    ...(Platform.OS === "web"
      ? ({
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          alignItems: "stretch",
        } as any)
      : {
          flexDirection: "row",
          flexWrap: "wrap",
        }),
  },
  productGridSingle: {
    ...(Platform.OS === "web"
      ? ({ gridTemplateColumns: "minmax(0, 1fr)" } as any)
      : {}),
  },
  productGridCard: {
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce3ed",
    backgroundColor: "#ffffff",
    padding: 13,
    gap: 11,
    justifyContent: "space-between",
    ...(Platform.OS === "web"
      ? ({ height: "100%", boxSizing: "border-box" } as any)
      : { width: "100%" }),
  },
  productGridCardSelected: {
    borderColor: C.primaryLight,
    backgroundColor: C.primaryGhost,
  },
  productGridCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  productGridIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productGridTitle: {
    color: "#2f3748",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  productGridSubtitle: {
    color: "#647188",
    fontSize: 11,
    lineHeight: 16,
  },
  productGridCategory: {
    color: "#506078",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  productGridThumbnail: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dce4ef",
    backgroundColor: "#eef2f8",
  },
  productGridThumbnailPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d4dce8",
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    justifyContent: "center",
  },
  productGridThumbnailPlaceholderText: {
    color: "#8a96a8",
    fontSize: 9,
    fontWeight: "700",
  },
  productGridMetrics: {
    flexDirection: "row",
    gap: 6,
  },
  productGridMetric: {
    flex: 0.7,
    minWidth: 66,
    borderRadius: 8,
    backgroundColor: "#f2f6fd",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  productGridMetricWide: {
    flex: 1.4,
    minWidth: 110,
    borderRadius: 8,
    backgroundColor: "#f2f6fd",
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  productGridMetricLabel: {
    color: "#7b8799",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  productGridMetricValue: {
    color: "#33425e",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  productGridSale: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e3e8f1",
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productGridSalePeriod: {
    flexShrink: 0,
    gap: 2,
  },
  productGridSaleBrands: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productGridSaleBrandsDivided: {
    borderLeftWidth: 1,
    borderLeftColor: "#dce3ed",
    paddingLeft: 10,
  },
  productGridSaleLabel: {
    color: "#7b8799",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  productGridSaleValue: {
    color: "#46536a",
    fontSize: 11,
    fontWeight: "700",
  },
  productGridCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#edf0f5",
    paddingTop: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  productGridCreated: {
    color: "#7b8799",
    fontSize: 10,
    fontWeight: "700",
  },
  productGridActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productGridActionButton: {
    minHeight: 34,
    minWidth: 68,
  },
  productGridDetailsButtonActive: {
    borderColor: C.primaryLight,
    backgroundColor: C.primaryGhost,
  },
};
