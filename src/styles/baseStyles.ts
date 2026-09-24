import { webViewStyle } from "../shared/design/webViewStyle";
import { Platform } from "react-native";
import P from "../constants/palette";

export const baseStyles = {
  root: {
    flex: 1,
    backgroundColor: P.bg,
    ...(Platform.OS === "web"
      ? (webViewStyle({ minHeight: "100vh", width: "100%" }))
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
} as const;
