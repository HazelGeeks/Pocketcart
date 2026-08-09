export const HOME_PRODUCT_BATCH_SIZE = 6;

type ScrollMetrics = {
  contentHeight: number;
  scrollY: number;
  viewportHeight: number;
};

export function isScrollNearEnd(
  { contentHeight, scrollY, viewportHeight }: ScrollMetrics,
  threshold = 280,
) {
  if (contentHeight <= 0 || viewportHeight <= 0) return false;
  return contentHeight - (scrollY + viewportHeight) <= threshold;
}

export function nextVisibleProductCount(
  current: number,
  total: number,
  batchSize = HOME_PRODUCT_BATCH_SIZE,
) {
  return Math.min(Math.max(0, total), Math.max(0, current) + batchSize);
}
