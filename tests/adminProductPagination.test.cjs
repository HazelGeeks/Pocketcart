const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ADMIN_PRODUCT_PAGE_SIZES,
  buildAdminProductPagination,
} = require("../.tmp-tests/utils/adminProductPagination.js");

test("admin product pagination offers the requested page sizes", () => {
  assert.deepEqual(ADMIN_PRODUCT_PAGE_SIZES, [20, 50, 100]);
});

test("admin product pagination calculates a middle page range", () => {
  assert.deepEqual(buildAdminProductPagination(126, 2, 50), {
    page: 2,
    pageCount: 3,
    startIndex: 50,
    endIndex: 100,
    rangeStart: 51,
    rangeEnd: 100,
  });
});

test("admin product pagination clamps invalid and out-of-range pages", () => {
  assert.equal(buildAdminProductPagination(30, 99, 20).page, 2);
  assert.equal(buildAdminProductPagination(30, -4, 20).page, 1);
  assert.deepEqual(buildAdminProductPagination(0, 3, 100), {
    page: 1,
    pageCount: 1,
    startIndex: 0,
    endIndex: 0,
    rangeStart: 0,
    rangeEnd: 0,
  });
});
