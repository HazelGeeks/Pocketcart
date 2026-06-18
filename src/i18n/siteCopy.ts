import { enSiteCopy } from "./siteCopy.en";
import { frSiteCopy } from "./siteCopy.fr";
import type { SiteCopy, SiteCopyMap } from "./siteCopyTypes";

export type { SiteCopy } from "./siteCopyTypes";

export const SITE_COPY: SiteCopyMap = {
  en: enSiteCopy,
  fr: frSiteCopy,
};
