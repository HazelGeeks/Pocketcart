import { accountAuthStyles } from "./accountAuthStyles";
import { personalizationStyles } from "./personalizationStyles";
import { settingsStyles } from "./settingsStyles";

export const accountSettingsStyles = {
  ...settingsStyles,
  ...accountAuthStyles,
  ...personalizationStyles,
};
