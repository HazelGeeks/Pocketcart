import { marketingPalette as C } from "../../shared/design/palette";

export const adminModalStyles = {
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "90%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  productEditorModalCard: {
    maxWidth: 1160,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 10,
  },
  productDeleteSummary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e1e6ef",
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 5,
  },
  productDeleteCount: {
    color: "#2f3748",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  productDeleteName: {
    color: "#4d5a70",
    fontSize: 13,
    lineHeight: 18,
  },
  confirmActionButton: {
    minHeight: 44,
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e8f1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  modalTitle: {
    color: "#2f3748",
    fontSize: 20,
    fontWeight: "800",
  },
  modalSub: {
    color: "#6c7890",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  modalBody: {
    maxHeight: 480,
  },
  modalBodyContent: {
    padding: 14,
    gap: 8,
  },
  modalTopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalTopCell: {
    flexGrow: 1,
    minWidth: 260,
    gap: 7,
  },
  modalTopCellHalf: {
    flexBasis: "48%",
  },
  fieldLabel: {
    color: "#41506e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6deeb",
    backgroundColor: "#f7f9fc",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  choiceChipActive: {
    borderColor: C.primaryLight,
    backgroundColor: C.primaryGhost,
  },
  choiceChipText: {
    color: "#40506c",
    fontSize: 12,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: C.primaryDeep,
  },
  storePriceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  storePriceTableScroll: {
    width: "100%",
  },
  storePriceTable: {
    width: "100%",
    minWidth: 1040,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  storePriceTableHeaderRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#dbe2ef",
    backgroundColor: "#f3f6fb",
  },
  storePriceTableRow: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e9f2",
    backgroundColor: "#ffffff",
  },
  storePriceTableRowLast: {
    borderBottomWidth: 0,
  },
  storePriceTableCell: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#e4e9f2",
    justifyContent: "center",
  },
  storePriceLastCell: {
    borderRightWidth: 0,
  },
  storePriceIndexCell: {
    width: 46,
    alignItems: "center",
  },
  storePriceRetailerCell: {
    width: 190,
  },
  storePriceBranchCell: {
    flex: 1,
    minWidth: 260,
  },
  storePriceDateCell: {
    width: 164,
  },
  storePriceAmountCell: {
    width: 124,
  },
  storePriceActionCell: {
    width: 108,
    alignItems: "center",
  },
  storePriceRowNumber: {
    color: "#52617a",
    fontSize: 12,
    fontWeight: "800",
  },
  storePriceTableInput: {
    width: "100%",
    minHeight: 40,
  },
  storePriceRemoveBtn: {
    width: "100%",
    minHeight: 36,
  },
  modalActionRow: {
    borderTopWidth: 1,
    borderTopColor: "#e4e8f1",
    padding: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  importStatusReady: {
    color: "#2c7a4b",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
  importStatusMuted: {
    color: "#a05a2c",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
} as const;
