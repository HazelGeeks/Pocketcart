const test = require('node:test');
const assert = require('node:assert/strict');
const { calendarDays, shiftCalendarMonth } = require('../.tmp-tests/utils/calendarDays.js');
test('calendar uses local date strings and leap years with weekday padding', () => {
  const leap = calendarDays('2024-02-01');
  assert.deepEqual(leap.slice(0, 4), [null, null, null, null]);
  assert.equal(leap.at(-1), '2024-02-29');
  assert.equal(calendarDays('2025-02-01').filter(Boolean).length, 28);
  assert.equal(calendarDays('2026-03-01')[0], '2026-03-01');
});
test('calendar month navigation crosses years without day overflow', () => {
  assert.equal(shiftCalendarMonth('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftCalendarMonth('2026-01-31', -1), '2025-12-01');
  assert.equal(shiftCalendarMonth('2024-01-31', 1), '2024-02-01');
});
