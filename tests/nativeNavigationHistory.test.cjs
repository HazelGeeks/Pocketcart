const test = require('node:test');
const assert = require('node:assert/strict');
const { navigationHookHarness } = require('./helpers/navigationHookHarness.cjs');
function setup() {
  const hook = navigationHookHarness();
  const product = { id: 'original-product', english_name: 'Milk' };
  const catalog = { route: 'detail', selectedProduct: product, query: '', category: 'All', onSaleOnly: true,
    setRoute(route) { catalog.route = route; }, openProduct(value) { catalog.selectedProduct = value; catalog.route = 'detail'; } };
  const options = { catalog, shell: { activeTab: 'home' }, account: { accountRoute: 'settings', profile: null }, map: {}, gestureEnabled: true, width: 390 };
  return { hook, options, product, render: () => hook.render(options) };
}
const back = { x0: 10, dx: 90, dy: 0, vx: 0.3 };
const forward = { x0: 380, dx: -90, dy: 0, vx: -0.3 };
function swipe(nav, gesture) {
  const handlers = nav.backPanHandlers;
  const captures = handlers.onMoveShouldSetPanResponderCapture({}, gesture);
  if (captures) { handlers.onPanResponderMove({}, gesture); handlers.onPanResponderRelease({}, gesture); }
  return captures;
}
test('back and forward restore the exact product even when the catalogue selection changes', async () => {
  const h = setup(); let nav = await h.render(); assert.equal(swipe(nav, back), true);
  h.options.catalog.selectedProduct = { id: 'different-selection' };
  nav = await h.render(); assert.equal(h.options.catalog.route, 'catalog');
  assert.equal(swipe(nav, forward), true); nav = await h.render();
  assert.equal(h.options.catalog.selectedProduct, h.product); assert.equal(h.options.catalog.route, 'detail');
  assert.equal(nav.backTranslateX.value, 0);
  assert.equal(swipe(nav, back), true); nav = await h.render(); assert.equal(swipe(nav, forward), true);
  h.hook.unmount();
});
test('changing tab or search invalidates the forward destination', async () => {
  for (const change of ['tab', 'query']) {
    const h = setup(); let nav = await h.render(); swipe(nav, back); await h.render();
    if (change === 'tab') h.options.shell.activeTab = 'map'; else h.options.catalog.query = 'bread';
    await h.render(); h.options.shell.activeTab = 'home'; nav = await h.render();
    assert.equal(swipe(nav, forward), false); h.hook.unmount();
  }
});
test('cancelled and disabled forward gestures do not change the route or consume history', async () => {
  const h = setup(); let nav = await h.render(); swipe(nav, back); nav = await h.render();
  assert.equal(swipe(nav, { ...forward, dx: -20, vx: -0.1 }), true);
  nav = await h.render(); assert.equal(h.options.catalog.route, 'catalog'); assert.equal(nav.backTranslateX.value, 0);
  h.options.gestureEnabled = false; nav = await h.render(); assert.equal(swipe(nav, forward), false);
  h.options.gestureEnabled = true; nav = await h.render(); assert.equal(swipe(nav, forward), true);
  h.hook.unmount();
});
