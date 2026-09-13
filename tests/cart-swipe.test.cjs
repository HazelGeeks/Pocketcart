const assert = require("node:assert/strict");
const test = require("node:test");
const { shouldStartCartSwipe, getCartSwipeAction } = require("../.tmp-tests/utils/cartSwipe.js");

test("cart swipe leaves scrolling, taps, and multi-touch to their existing handlers", () => {
  assert.equal(shouldStartCartSwipe({ dx: 8, dy: 0 }), false);
  assert.equal(shouldStartCartSwipe({ dx: 20, dy: 30 }), false);
  assert.equal(shouldStartCartSwipe({ dx: 25, dy: 20 }), false);
  assert.equal(shouldStartCartSwipe({ dx: 40, dy: 2, numberActiveTouches: 2 }), false);
  assert.equal(shouldStartCartSwipe({ dx: 20, dy: 2 }), true);
  assert.equal(shouldStartCartSwipe({ dx: -20, dy: 2 }), true);
});

test("only deliberate horizontal swipes purchase or delete", () => {
  assert.equal(getCartSwipeAction({ dx: 87, dy: 0 }), null);
  assert.equal(getCartSwipeAction({ dx: -87, dy: 0 }), null);
  assert.equal(getCartSwipeAction({ dx: 100, dy: 80 }), null);
  assert.equal(getCartSwipeAction({ dx: 88, dy: 5 }), "purchase");
  assert.equal(getCartSwipeAction({ dx: -88, dy: 5 }), "delete");
  assert.equal(getCartSwipeAction({ dx: 0, dy: 0 }), null);
});
