import { StyleSheet } from "react-native";
import { adminButtonStyles } from "./adminStyles/buttonStyles";
import { adminDataStyles } from "./adminStyles/dataStyles";
import { adminFlyerStyles } from "./adminStyles/flyerStyles";
import { adminFormListStyles } from "./adminStyles/formListStyles";
import { adminLayoutStyles } from "./adminStyles/layoutStyles";
import { adminModalStyles } from "./adminStyles/modalStyles";
import { adminOverviewStyles } from "./adminStyles/overviewStyles";
import { adminPaginationStyles } from "./adminStyles/paginationStyles";
import { adminProductEditorStyles } from "./adminStyles/productEditorStyles";
import { adminProductListStyles } from "./adminStyles/productListStyles";
import { adminSidebarStyles } from "./adminStyles/sidebarStyles";
import { adminStoreListStyles } from "./adminStyles/storeListStyles";
import { adminUserStyles } from "./adminStyles/userStyles";

export const st = StyleSheet.create({
  ...adminLayoutStyles,
  ...adminSidebarStyles,
  ...adminOverviewStyles,
  ...adminDataStyles,
  ...adminFlyerStyles,
  ...adminFormListStyles,
  ...adminModalStyles,
  ...adminProductEditorStyles,
  ...adminButtonStyles,
  ...adminPaginationStyles,
  ...adminProductListStyles,
  ...adminStoreListStyles,
  ...adminUserStyles,
});
