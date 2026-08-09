const test = require("node:test");
const assert = require("node:assert/strict");

const {
  HOME_PRODUCT_BATCH_SIZE,
  isScrollNearEnd,
  nextVisibleProductCount,
} = require("../.tmp-tests/utils/infiniteScroll.js");

test("home catalog requests another batch only near the scroll end", () => {
  assert.equal(
    isScrollNearEnd({ contentHeight: 1800, scrollY: 500, viewportHeight: 800 }),
    false,
  );
  assert.equal(
    isScrollNearEnd({ contentHeight: 1800, scrollY: 740, viewportHeight: 800 }),
    true,
  );
  assert.equal(
    isScrollNearEnd({ contentHeight: 0, scrollY: 0, viewportHeight: 800 }),
    false,
  );
});

test("home catalog reveals six products per scroll batch without exceeding total", () => {
  assert.equal(HOME_PRODUCT_BATCH_SIZE, 6);
  assert.equal(nextVisibleProductCount(6, 479), 12);
  assert.equal(nextVisibleProductCount(12, 14), 14);
  assert.equal(nextVisibleProductCount(14, 14), 14);
});
