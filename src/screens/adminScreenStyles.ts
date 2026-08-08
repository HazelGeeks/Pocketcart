import { StyleSheet } from "react-native";
import { adminButtonStyles } from "./adminStyles/buttonStyles";
import { adminDataStyles } from "./adminStyles/dataStyles";
import { adminFormListStyles } from "./adminStyles/formListStyles";
import { adminLayoutStyles } from "./adminStyles/layoutStyles";
import { adminModalStyles } from "./adminStyles/modalStyles";
import { adminPaginationStyles } from "./adminStyles/paginationStyles";
import { adminProductListStyles } from "./adminStyles/productListStyles";
import { adminStoreListStyles } from "./adminStyles/storeListStyles";
import { adminUserStyles } from "./adminStyles/userStyles";

export const st = StyleSheet.create({
  ...adminLayoutStyles,
  ...adminDataStyles,
  ...adminFormListStyles,
  ...adminModalStyles,
  ...adminButtonStyles,
  ...adminPaginationStyles,
  ...adminProductListStyles,
  ...adminStoreListStyles,
  ...adminUserStyles,
});
