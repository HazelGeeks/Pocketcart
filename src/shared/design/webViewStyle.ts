import type { CSSProperties } from "react";
import type { ViewStyle } from "react-native";

/** React Native Web accepts browser CSS that native ViewStyle does not model.
 * Use only in web branches; validate the input with CSSProperties at this boundary.
 */
export function webViewStyle(style: CSSProperties): ViewStyle {
  return style as unknown as ViewStyle;
}
