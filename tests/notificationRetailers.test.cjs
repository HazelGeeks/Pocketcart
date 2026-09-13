const test = require('node:test');
const assert = require('node:assert/strict');
const { notificationRetailers } = require('../.tmp-tests/utils/notificationRetailers.js');
test('notification selector lists each retailer once regardless of branch count and casing', () => {
  const rows = [
    {brand:'Hannam Supermarket',name:'Burnaby',is_active:true},
    {brand:' Hannam Supermarket ',name:'Surrey',is_active:true},
    {brand:'hannam supermarket',name:'Vancouver',is_active:true},
    {brand:'H-Mart',name:'Coquitlam',is_active:true},
    {brand:'Inactive',name:'Closed',is_active:false},
  ];
  const names = notificationRetailers(rows);
  assert.equal(names.length,2);
  assert.deepEqual(names.map(name => name.toLowerCase()).sort(), ['h-mart','hannam supermarket']);
  assert.deepEqual(notificationRetailers([...rows].reverse()), names);
});
test('independent retailers use a trimmed store name when no brand is available', () => {
  assert.deepEqual(notificationRetailers([
    {brand:null,name:' Local Market ',is_active:true},
    {brand:' ',name:'Local Market',is_active:true},
    {brand:null,name:' ',is_active:true},
  ]), ['Local Market']);
});
