import { appChromeStyles } from "./nativeAppStyles/appChromeStyles";
import { accountSettingsStyles } from "./nativeAppStyles/accountSettingsStyles";
import { catalogPriceStyles } from "./nativeAppStyles/catalogPriceStyles";
import { catalogStyles } from "./nativeAppStyles/catalogStyles";
import { commonStyles } from "./nativeAppStyles/commonStyles";
import { detailNavigationStyles } from "./nativeAppStyles/detailNavigationStyles";
import { onboardingStyles } from "./nativeAppStyles/onboardingStyles";
import { productDetailStyles } from "./nativeAppStyles/productDetailStyles";
import { productHistoryStyles } from "./nativeAppStyles/productHistoryStyles";
import { shoppingListStyles } from "./nativeAppStyles/shoppingListStyles";
import { storeMapStyles } from "./nativeAppStyles/storeMapStyles";
import { storeMapResultStyles } from "./nativeAppStyles/storeMapResultStyles";
import { toastStyles } from "./nativeAppStyles/toastStyles";

export const st = {
  ...commonStyles,
  ...accountSettingsStyles,
  ...productDetailStyles,
  ...productHistoryStyles,
  ...appChromeStyles,
  ...catalogStyles,
  ...catalogPriceStyles,
  ...detailNavigationStyles,
  ...onboardingStyles,
  ...shoppingListStyles,
  ...storeMapStyles,
  ...storeMapResultStyles,
  ...toastStyles,
};
