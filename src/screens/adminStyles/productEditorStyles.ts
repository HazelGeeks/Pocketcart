export const adminProductEditorStyles = {
  productImageTopSection: {
    gap: 8,
  },
  productImageTopCopy: {
    gap: 2,
  },
  productEditorTopLayout: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 14,
  },
  productImageControls: {
    width: 180,
    gap: 8,
  },
  productDetailsTopSection: {
    flex: 1,
    flexBasis: 360,
    minWidth: 260,
    gap: 10,
  },
  modalImagePreview: {
    width: 180,
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe1ec",
    backgroundColor: "#eef1f7",
  },
  imageUploadArea: {
    width: 180,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  productImageActionRow: {
    width: 180,
    flexDirection: "row",
    gap: 6,
  },
  productImageActionBtn: {
    flex: 1,
    minHeight: 32,
    paddingHorizontal: 8,
  },
  productImageUrlInput: {
    width: 180,
    minHeight: 36,
    fontSize: 11,
  },
  imageUploadOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 34,
    backgroundColor: "rgba(24, 34, 52, 0.62)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  imageUploadOverlayText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  modalImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
} as const;
