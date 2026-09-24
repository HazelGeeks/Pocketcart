import { StyleSheet } from "react-native";
import { baseStyles } from "./baseStyles";
import { footerStyles } from "./footerStyles";
import { navStyles } from "./navStyles";
import { sectionStyles } from "./sectionStyles";

const s = StyleSheet.create({
  ...baseStyles,
  ...navStyles,
  ...sectionStyles,
  ...footerStyles,
});

export default s;
