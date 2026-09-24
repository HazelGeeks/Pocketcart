import { Platform } from "react-native";
import type { Variants } from "framer-motion";

export const isWeb = Platform.OS === "web";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const },
  }),
};
