export const ADMIN_PRODUCT_PAGE_SIZES = [20, 50, 100] as const;

export type AdminProductPageSize =
  (typeof ADMIN_PRODUCT_PAGE_SIZES)[number];

export type AdminProductPagination = {
  page: number;
  pageCount: number;
  startIndex: number;
  endIndex: number;
  rangeStart: number;
  rangeEnd: number;
};

export function buildAdminProductPagination(
  totalItems: number,
  requestedPage: number,
  pageSize: AdminProductPageSize,
): AdminProductPagination {
  const safeTotal = Math.max(0, Math.floor(totalItems));
  const pageCount = Math.max(1, Math.ceil(safeTotal / pageSize));
  const page = Math.min(
    pageCount,
    Math.max(1, Math.floor(requestedPage) || 1),
  );
  const startIndex = safeTotal === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = Math.min(safeTotal, startIndex + pageSize);

  return {
    page,
    pageCount,
    startIndex,
    endIndex,
    rangeStart: safeTotal === 0 ? 0 : startIndex + 1,
    rangeEnd: endIndex,
  };
}
