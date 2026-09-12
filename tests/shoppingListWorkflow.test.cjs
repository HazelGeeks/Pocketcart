const test = require('node:test');
const assert = require('node:assert/strict');
const { shoppingHookHarness } = require('./helpers/shoppingHookHarness.cjs');
const { normalizeShoppingListItems, addShoppingListProduct, toggleShoppingListItem, restoreShoppingListItems } = require('../.tmp-tests/utils/shoppingListState.js');
const { groupShoppingList } = require('../.tmp-tests/utils/shoppingListGroups.js');
const { buildShoppingRecommendation } = require('../.tmp-tests/utils/shoppingOptimizer.js');
const milk = { productId: 'milk', name: 'Milk', unit: '1 L', quantity: 2, category: 'Dairy' };
function memoryStorage() {
  const data = new Map();
  return { data, getItem: async (key) => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); }, removeItem: async (key) => { data.delete(key); } };
}

test('purchase checkmarks and custom items survive serialization and reopening', async () => {
  const storage = memoryStorage();
  const harness = shoppingHookHarness(storage);
  let list = await harness.render();
  list.addCustomItem('Kitchen towels');
  list = await harness.render();
  const id = list.items[0].productId;
  list.toggleCompleted(id);
  await harness.render();
  harness.unmount();
  const reopened = shoppingHookHarness(storage);
  const restored = await reopened.render();
  assert.equal(restored.items[0].name, 'Kitchen towels');
  assert.equal(restored.items[0].completed, true);
  assert.ok(restored.items[0].productId.startsWith('custom:'));
  assert.equal(normalizeShoppingListItems(JSON.parse(JSON.stringify(restored.items)))[0].completed, true);
  reopened.unmount();
});

test('undo restores removed items without overwriting subsequent quantities or additions', () => {
  const bread = { ...milk, productId: 'bread', name: 'Bread' };
  const result = restoreShoppingListItems([{ ...milk, quantity: 5 }], [milk, bread]);
  assert.equal(result[0].quantity, 5);
  assert.equal(result.length, 2);
  assert.equal(result[1].name, 'Bread');
});

test('completed items leave the remaining estimate and re-add reopens instead of doubling quantity', () => {
  const checked = toggleShoppingListItem([milk], 'milk');
  const recommendation = buildShoppingRecommendation(checked.filter((item) => !item.completed), [], []);
  assert.equal(recommendation.recommended, null);
  assert.equal(recommendation.unpricedProductIds.length, 0);
  const reopened = addShoppingListProduct(checked, { id: 'milk', name: 'Milk', unit: '1 L' });
  assert.equal(reopened[0].completed, false);
  assert.equal(reopened[0].quantity, 2);
});

test('grouping excludes purchased items and keeps distinct store branches separate', () => {
  const bread = { ...milk, productId: 'bread', category: 'Bakery' };
  const custom = { ...milk, productId: 'custom:x', category: undefined };
  const items = [milk, bread, custom, { ...milk, productId: 'done', completed: true }];
  const plan = { stops: [
    { storeId: 'a', storeName: 'Walmart', storeArea: 'North', items: [milk] },
    { storeId: 'b', storeName: 'Walmart', storeArea: 'South', items: [bread] },
  ] };
  assert.deepEqual(groupShoppingList(items, 'category', null).map((g) => g.label), ['Dairy', 'Bakery', 'Other items']);
  assert.deepEqual(groupShoppingList(items, 'store', plan).map((g) => g.label), ['Walmart · North', 'Walmart · South', 'No recommended store']);
  assert.equal(groupShoppingList(items, 'list', null)[0].items.length, 3);
});

test('hook undo and account changes do not restore one account items into another', async () => {
  const harness = shoppingHookHarness(memoryStorage());
  let list = await harness.render('user-a');
  list.addCustomItem('Milk'); list = await harness.render('user-a');
  list.removeProduct(list.items[0].productId); list = await harness.render('user-a');
  assert.equal(list.undoCount, 1);
  list.undoRemove(); list = await harness.render('user-a');
  assert.equal(list.items.length, 1);
  list.clear(); list = await harness.render('user-a');
  list = await harness.render('user-b');
  assert.equal(list.undoCount, 0);
  list.undoRemove(); list = await harness.render('user-b');
  assert.equal(list.items.length, 0);
  harness.unmount();
});

test('local persistence failures are visible instead of claiming the list was saved', async () => {
  const storage = memoryStorage();
  storage.setItem = async () => { throw Error('Disk full'); };
  const harness = shoppingHookHarness(storage);
  const list = await harness.render();
  assert.match(list.syncMessage, /Couldn't save/);
  harness.unmount();
});

test('a removal made during remote hydration is not resurrected by the remote result', async () => {
  const storage = memoryStorage();
  storage.data.set('pc-shopping-list-v2.user.a', JSON.stringify([milk]));
  let resolveRead;
  const harness = shoppingHookHarness(storage, { read: () => new Promise((resolve) => { resolveRead = resolve; }) });
  let list = await harness.render('a');
  list.removeProduct('milk');
  resolveRead({ data: [milk], error: null });
  list = await harness.render('a');
  assert.equal(list.loaded, true);
  assert.equal(list.items.length, 0);
  harness.unmount();
});

test('failed remote hydration preserves local operation without overwriting unknown remote contents', async () => {
  let writes = 0;
  const harness = shoppingHookHarness(memoryStorage(), {
    read: async () => { throw Error('Offline'); },
    write: async () => { writes++; return null; },
  });
  let list = await harness.render('a');
  assert.equal(list.loaded, true);
  list.addCustomItem('Napkins'); list = await harness.render('a');
  assert.equal(list.items.length, 1);
  assert.equal(writes, 0);
  assert.match(list.syncMessage, /Couldn't sync/);
  harness.unmount();
});
