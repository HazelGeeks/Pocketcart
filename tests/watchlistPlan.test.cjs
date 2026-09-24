const test = require('node:test');
const assert = require('node:assert/strict');
const { activeWatchlist } = require('../.tmp-tests/supabase/functions/_shared/watchlistPlan.js');
const rows = Array.from({ length: 7 }, (_, i) => ({ id: `w${i}`, user_id: 'u', product_id: `p${i}`, created_at: `2026-09-${String(i + 1).padStart(2, '0')}` }));
test('free product alerts retain every product independent of input order', () => {
  assert.deepEqual(activeWatchlist([...rows].reverse(), false).map(r => r.id), ['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6']);
  assert.equal(rows.length, 7);
});
test('subscription flags from legacy callers cannot change eligibility', () => {
  assert.equal(activeWatchlist(rows, true).length, 7);
  assert.equal(activeWatchlist(rows, false).length, 7);
});
test('duplicate products and all other saved records remain eligible', () => {
  const duplicate = { ...rows[0], id: 'duplicate' };
  const result = activeWatchlist([duplicate, ...rows.slice(1)], false);
  assert.equal(result.length, 7);
  assert.equal(activeWatchlist([duplicate, ...rows], false).length, 8);
  assert.ok(activeWatchlist(rows.slice(1), false).some(r => r.id === 'w5'));
});
test('legacy entries remain eligible and equal timestamps have deterministic ordering', () => {
  const legacy = rows.map(r => ({ ...r, product_id: null, created_at: '2026-09-01' }));
  assert.deepEqual(activeWatchlist(legacy.reverse(), false).map(r => r.id), ['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6']);
});

test('background eligibility includes every account without a billing provider', async () => {
  const { sourceModule } = require('./helpers/sourceModule.cjs');
  const { eligibleWatchlist } = sourceModule('supabase/functions/_shared/watchlistAccess.ts', {
    './watchlistPlan.ts': { activeWatchlist },
  });
  const other = rows.map(row => ({ ...row, id: `other-${row.id}`, user_id: 'other' }));
  const result = await eligibleWatchlist([...rows, ...other]);
  assert.equal(result.length, 14);
  assert.equal(result.filter(row => row.user_id === 'other').length, 7);
});
