const test = require('node:test');
const assert = require('node:assert/strict');
const { sourceModule } = require('./helpers/sourceModule.cjs');
const react = { createElement: (type, props, ...children) => ({ type, props, children }) };
const { CartSummary } = sourceModule('src/components/nativeApp/CartSummary.tsx', {
  react, 'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: value => value } },
  '../../screens/nativeAppData': { money: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }) },
  '../../screens/nativeAppStyles': { st: {} }, '../../shared/design/palette': { marketingPalette: {} },
});
const text = node => typeof node === 'string' ? node : (node?.children ?? []).map(text).join(' ');
const props = { familyName: null, pendingCount: 2, total: null, unpricedCount: 2, loading: false, listLoading: false };
test('Cart distinguishes unavailable prices, zero prices, partial estimates and loading', () => {
  assert.match(text(CartSummary(props)), /No current prices/);
  assert.doesNotMatch(text(CartSummary(props)), /\$0/);
  assert.match(text(CartSummary({ ...props, total: 0, unpricedCount: 0 })), /\$0\.00/);
  assert.match(text(CartSummary({ ...props, total: 4.49, unpricedCount: 1 })), /\$4\.49.*Subtotal · 1 unpriced/);
  assert.match(text(CartSummary({ ...props, loading: true })), /Updating/);
});
