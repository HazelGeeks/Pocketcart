import { StyleSheet } from "react-native";
import { badgeStyles } from "./badgeStyles";
import { baseStyles } from "./baseStyles";
import { footerStyles } from "./footerStyles";
import { heroStyles } from "./heroStyles";
import { navStyles } from "./navStyles";
import { sectionStyles } from "./sectionStyles";

const s = StyleSheet.create({
  ...baseStyles,
  ...navStyles,
  ...badgeStyles,
  ...heroStyles,
  ...sectionStyles,
  ...footerStyles,
});

export default s;
