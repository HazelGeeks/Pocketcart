import { accountOverviewStyles } from "./accountOverviewStyles";
import { accountAuthStyles } from "./accountAuthStyles";
import { personalizationStyles } from "./personalizationStyles";
import { settingsStyles } from "./settingsStyles";

export const accountSettingsStyles = {
  ...settingsStyles,
  ...accountOverviewStyles,
  ...accountAuthStyles,
  ...personalizationStyles,
};
