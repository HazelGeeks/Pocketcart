const test = require('node:test');
const assert = require('node:assert/strict');
const { freezerProductId, isCatalogProductId } = require('../.tmp-tests/utils/freezerProductImages.js');
const { shoppingItemFreezerDraft } = require('../.tmp-tests/utils/shoppingFreezer.js');
const { validateFreezerItemDraft, emptyFreezerItemDraft } = require('../.tmp-tests/utils/freezerItem.js');
const first = '11111111-1111-1111-1111-111111111111';
const second = '22222222-2222-2222-2222-222222222222';
const item = { id: 'food-id', name: 'Squash', unit: 'LB' };
const cartItem = { productId: first, freezerItemId: item.id, name: item.name, unit: item.unit, quantity: 2 };

test('Freezer images use persisted product identity even after the Cart entry is removed', () => {
  assert.equal(freezerProductId({ ...item, product_id: first }, []), first);
  assert.equal(freezerProductId({ ...item, product_id: first }, [{ ...cartItem, productId: second }]), first);
});
test('legacy Freezer items use only exact, unambiguous Cart transfer links', () => {
  assert.equal(freezerProductId(item, [cartItem]), first);
  assert.equal(freezerProductId(item, [{ ...cartItem, freezerItemId: 'another-food' }]), null);
  assert.equal(freezerProductId(item, [{ ...cartItem, name: 'Another variety' }]), null);
  assert.equal(freezerProductId(item, [{ ...cartItem, unit: 'kg' }]), null);
  assert.equal(freezerProductId(item, [cartItem, { ...cartItem, productId: second }]), null);
  assert.equal(freezerProductId(item, [{ ...cartItem, productId: 'custom:squash' }]), null);
});
test('Cart transfers preserve valid product IDs without assigning IDs to custom foods', () => {
  const draft = shoppingItemFreezerDraft(cartItem);
  assert.equal(draft.productId, first);
  assert.equal(validateFreezerItemDraft(draft).value.productId, first);
  assert.equal(shoppingItemFreezerDraft({ ...cartItem, productId: 'custom:squash' }).productId, undefined);
  assert.equal(isCatalogProductId('not-a-product'), false);
  assert.equal(validateFreezerItemDraft({ ...emptyFreezerItemDraft(), name: 'Food', productId: 'invalid' }).ok, false);
});
