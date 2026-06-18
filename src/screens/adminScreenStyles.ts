import { StyleSheet } from "react-native";
import { adminButtonStyles } from "./adminStyles/buttonStyles";
import { adminDataStyles } from "./adminStyles/dataStyles";
import { adminFormListStyles } from "./adminStyles/formListStyles";
import { adminLayoutStyles } from "./adminStyles/layoutStyles";
import { adminModalStyles } from "./adminStyles/modalStyles";

export const st = StyleSheet.create({
  ...adminLayoutStyles,
  ...adminDataStyles,
  ...adminFormListStyles,
  ...adminModalStyles,
  ...adminButtonStyles,
});
