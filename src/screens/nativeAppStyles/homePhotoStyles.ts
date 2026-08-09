import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "./fonts";

export const homePhotoStyles = StyleSheet.create({
  homePhotoBanner: {
    minHeight: 178,
    overflow: "hidden",
    borderRadius: 22,
    justifyContent: "flex-end",
  },
  homePhotoBannerImage: {
    borderRadius: 22,
  },
  homePhotoBannerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 28, 16, 0.5)",
  },
  homePhotoBannerCopy: {
    maxWidth: 320,
    padding: 18,
    gap: 7,
  },
  homePhotoBannerEyebrowWrap: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  homePhotoBannerEyebrow: {
    color: C.primaryDeep,
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: F.extraBold,
  },
  homePhotoBannerTitle: {
    color: C.white,
    fontSize: 24,
    lineHeight: 29,
    fontFamily: F.extraBold,
  },
  homePhotoBannerBody: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.semibold,
  },
});
