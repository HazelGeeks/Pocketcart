const test = require('node:test');
const assert = require('node:assert/strict');
const { activeWatchlist } = require('../.tmp-tests/supabase/functions/_shared/watchlistPlan.js');
const rows = Array.from({ length: 7 }, (_, i) => ({ id: `w${i}`, user_id: 'u', product_id: `p${i}`, created_at: `2026-09-${String(i + 1).padStart(2, '0')}` }));
test('free product alerts select the oldest five independent of input order', () => {
  assert.deepEqual(activeWatchlist([...rows].reverse(), false).map(r => r.id), ['w0', 'w1', 'w2', 'w3', 'w4']);
  assert.equal(rows.length, 7);
});
test('Plus retains all products; expiration returns to five without deleting rows', () => {
  assert.equal(activeWatchlist(rows, true).length, 7);
  assert.equal(activeWatchlist(rows, false).length, 5);
});
test('removing an active product frees a slot and duplicate products do not consume extra slots', () => {
  const duplicate = { ...rows[0], id: 'duplicate' };
  const result = activeWatchlist([duplicate, ...rows.slice(1)], false);
  assert.equal(result.length, 5);
  assert.equal(activeWatchlist([duplicate, ...rows], false).length, 6);
  assert.ok(activeWatchlist(rows.slice(1), false).some(r => r.id === 'w5'));
});
test('legacy entries count as slots and equal timestamps have deterministic ordering', () => {
  const legacy = rows.map(r => ({ ...r, product_id: null, created_at: '2026-09-01' }));
  assert.deepEqual(activeWatchlist(legacy.reverse(), false).map(r => r.id), ['w0', 'w1', 'w2', 'w3', 'w4']);
});
