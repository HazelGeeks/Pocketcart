import P from "../constants/palette";

export const footerStyles = {
  footer: {
    backgroundColor: P.dark,
    borderTopWidth: 1,
    borderTopColor: "rgba(97,227,146,0.10)",
    paddingTop: 28,
    paddingBottom: 18,
  },
  footerInner: {
    width: "100%",
    alignSelf: "center",
    gap: 18,
  },
  footerInnerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  footerCol: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  footerBrand: {
    gap: 10,
    justifyContent: "flex-start",
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  footerMarkText: {
    color: P.white,
    fontSize: 13,
    fontWeight: "800",
  },
  footerBrandName: {
    fontSize: 17,
    fontWeight: "700",
    color: P.white,
  },
  footerTagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
  },
  footerLinkCols: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    alignSelf: "stretch",
    width: "100%",
  },
  footerLinkColsMobile: {
    flexWrap: "wrap",
    rowGap: 18,
    columnGap: 24,
  },
  footerLinkCol: {
    gap: 10,
    minWidth: 140,
    flexShrink: 1,
  },
  footerLinkTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  footerLinkMuted: {
    fontSize: 14,
    color: "rgba(255,255,255,0.38)",
    lineHeight: 22,
  },
  footerBottom: {
    width: "100%",
    alignSelf: "center",
    marginTop: 0,
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 6,
  },
  footerCopy: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
  },
  footerMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  footerSocialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerSocialSep: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.35)",
  },
  footerSocialLink: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
} as const;
