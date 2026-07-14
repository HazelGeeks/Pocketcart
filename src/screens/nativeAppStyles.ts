import { appChromeStyles } from "./nativeAppStyles/appChromeStyles";
import { catalogStyles } from "./nativeAppStyles/catalogStyles";
import { commonStyles } from "./nativeAppStyles/commonStyles";
import { onboardingStyles } from "./nativeAppStyles/onboardingStyles";
import { productDetailStyles } from "./nativeAppStyles/productDetailStyles";

export { F } from "./nativeAppStyles/fonts";

export const st = {
  ...commonStyles,
  ...productDetailStyles,
  ...appChromeStyles,
  ...catalogStyles,
  ...onboardingStyles,
};
