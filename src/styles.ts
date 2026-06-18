import { StyleSheet } from "react-native";
import { badgeStyles } from "./styles/badgeStyles";
import { baseStyles } from "./styles/baseStyles";
import { footerStyles } from "./styles/footerStyles";
import { heroStyles } from "./styles/heroStyles";
import { navStyles } from "./styles/navStyles";
import { sectionStyles } from "./styles/sectionStyles";

const s = StyleSheet.create({
  ...baseStyles,
  ...navStyles,
  ...badgeStyles,
  ...heroStyles,
  ...sectionStyles,
  ...footerStyles,
});

export default s;
