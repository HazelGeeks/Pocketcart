import type React from "react";
import type { AdminStore } from "../../services/adminBackoffice";
import { WEB_FILTER_SELECT_STYLE } from "../../utils/adminScreenHelpers";

export const storeBrandLabel = (store: AdminStore) => store.brand?.trim() || "Other";

export const webDateInputStyle: React.CSSProperties = {
  ...WEB_FILTER_SELECT_STYLE,
  width: "100%",
  minWidth: 0,
  height: 40,
  fontSize: 13,
};

export const webTableSelectStyle: React.CSSProperties = {
  ...WEB_FILTER_SELECT_STYLE,
  width: "100%",
  minWidth: 0,
  height: 40,
  fontSize: 13,
};
