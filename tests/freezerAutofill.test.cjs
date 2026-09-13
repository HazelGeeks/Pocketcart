const test = require('node:test');
const assert = require('node:assert/strict');
const { applyFreezerProduct } = require('../.tmp-tests/utils/freezerAutofill.js');

test('product selection fills identity and unit while preserving user storage, quantity and dates', () => {
  const draft = { name: 'milk', productId: null, unit: 'box', quantity: '3', storageArea: 'fridge', storageUnitId: 'my-fridge', expiresOn: '2026-10-01', note: 'Opened yesterday' };
  const product = { id: '11111111-1111-1111-1111-111111111111', english_name: 'Whole milk', unit: '2 L' };
  assert.deepEqual(applyFreezerProduct(draft, product), { ...draft, name: 'Whole milk', productId: product.id, unit: '2 L' });
  assert.equal(draft.name, 'milk');
});

test('switching to a product with no unit clears the previous product unit and never invents a date', () => {
  const draft = { name: 'Milk', productId: 'old-product', unit: '2 L', quantity: '1', expiresOn: '' };
  const next = applyFreezerProduct(draft, { id: 'new-product', english_name: 'Apple', unit: null });
  assert.equal(next.unit, '');
  assert.equal(next.expiresOn, '');
  assert.equal(next.productId, 'new-product');
});
