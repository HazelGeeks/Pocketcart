import { useWindowDimensions } from "react-native";

export default function useLayout() {
  const { width: w } = useWindowDimensions();
  const isXs = w >= 480;
  const isSm = w >= 640;
  const isMd = w >= 768;
  const isLg = w >= 1024;
  const isXl = w >= 1280;
  const is2Xl = w >= 1536;
  const pad = is2Xl
    ? 88
    : isXl
      ? 72
      : isLg
        ? 56
        : isMd
          ? 36
          : isSm
            ? 24
            : 16;
  return {
    w,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    pad,
  };
}
