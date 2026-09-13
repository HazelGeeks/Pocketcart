const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldStartNativeForwardGesture: starts, shouldCompleteNativeForwardGesture: completes } = require('../.tmp-tests/utils/nativeBackNavigation.js');
test('forward gesture starts only at right edge with leftward horizontal intent', () => {
  assert.equal(starts({ x0: 380, dx: -20, dy: 3 }, 390), true);
  assert.equal(starts({ x0: 180, dx: -20, dy: 3 }, 390), false);
  assert.equal(starts({ x0: 380, dx: 20, dy: 3 }, 390), false);
  assert.equal(starts({ x0: 380, dx: -20, dy: 30 }, 390), false);
  assert.equal(starts({ x0: 380, dx: -5, dy: 0 }, 390), false);
  assert.equal(starts({ x0: 400, dx: -20, dy: 0 }, 390), false);
});
test('forward gesture completes only past distance or velocity threshold', () => {
  assert.equal(completes({ dx: -90, dy: 4, vx: -0.1 }), true);
  assert.equal(completes({ dx: -30, dy: 4, vx: -0.7 }), true);
  assert.equal(completes({ dx: -30, dy: 4, vx: -0.1 }), false);
  assert.equal(completes({ dx: 90, dy: 4, vx: 0.8 }), false);
  assert.equal(completes({ dx: -90, dy: 100, vx: -0.8 }), false);
});
