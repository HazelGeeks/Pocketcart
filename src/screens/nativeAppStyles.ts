import { appChromeStyles } from "./nativeAppStyles/appChromeStyles";
import { accountSettingsStyles } from "./nativeAppStyles/accountSettingsStyles";
import { catalogStyles } from "./nativeAppStyles/catalogStyles";
import { commonStyles } from "./nativeAppStyles/commonStyles";
import { onboardingStyles } from "./nativeAppStyles/onboardingStyles";
import { productDetailStyles } from "./nativeAppStyles/productDetailStyles";
import { shoppingListStyles } from "./nativeAppStyles/shoppingListStyles";
import { storeMapStyles } from "./nativeAppStyles/storeMapStyles";

export const st = {
  ...commonStyles,
  ...accountSettingsStyles,
  ...productDetailStyles,
  ...appChromeStyles,
  ...catalogStyles,
  ...onboardingStyles,
  ...shoppingListStyles,
  ...storeMapStyles,
};
