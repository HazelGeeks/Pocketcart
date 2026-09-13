const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFreezerReminders } = require('../.tmp-tests/utils/freezerReminders.js');
const date = (y,m,d,h=0) => new Date(y,m-1,d,h);
test('food reminders use local 9 AM at D-3, D-Day and D+3 across month boundaries', () => {
  const plans=buildFreezerReminders([{id:'a',name:'Milk',expires_on:'2026-10-01'}],date(2026,9,1));
  assert.deepEqual(plans.map(p=>[new Date(p.at).getMonth()+1,new Date(p.at).getDate(),new Date(p.at).getHours()]),[[9,28,9],[10,1,9],[10,4,9]]);
  assert.deepEqual(plans.map(p=>p.body),['D-3: Milk','D-Day: Milk','D+3: Milk']);
});
test('past reminder times and invalid or missing dates are skipped without catch-up spam', () => {
  const plans=buildFreezerReminders([{id:'a',name:'Milk',expires_on:'2026-10-01'}, {id:'b',name:'Bad',expires_on:'2026-02-30'}, {id:'c',name:'None',expires_on:null}],date(2026,10,1,10));
  assert.equal(plans.length,1); assert.equal(plans[0].body,'D+3: Milk');
});
test('same-day reminders are grouped and order-independent, date changes change the schedule', () => {
  const items=[{id:'a',name:'Milk',expires_on:'2026-10-01'}, {id:'b',name:'Eggs',expires_on:'2026-10-04'}];
  const plans=buildFreezerReminders(items,date(2026,9,1));
  assert.equal(plans.length,4); assert.match(plans[1].body,/D-Day: Milk\nD-3: Eggs/);
  assert.deepEqual(plans,buildFreezerReminders([...items].reverse(),date(2026,9,1)));
  assert.notDeepEqual(plans,buildFreezerReminders([{...items[0],expires_on:'2026-10-10'}],date(2026,9,1)));
});
