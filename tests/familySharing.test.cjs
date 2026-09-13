const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFamilyInvite, familyInviteUrl } = require('../.tmp-tests/utils/familyInvite.js');
const { mutateFamilyCart } = require('../.tmp-tests/utils/familyCartSync.js');
const token = 'a'.repeat(64);
test('family invite accepts app, landing link and copied token, rejects spoofed origins', () => {
  assert.equal(parseFamilyInvite(familyInviteUrl(token)), token);
  assert.equal(parseFamilyInvite(`https://pocketcart.hazelgeeks.workers.dev/family#invite=${token}`), token);
  assert.equal(parseFamilyInvite(`https://pocketcart.hazelgeeks.workers.dev/family.html#invite=${token}`), token);
  assert.equal(parseFamilyInvite(`pocketcart://family?invite=${token}`), token);
  assert.equal(parseFamilyInvite(token), token);
  for (const link of [`https://evil.test/family.html#invite=${token}`, `https://pocketcart.hazelgeeks.workers.dev.evil.test/family.html#invite=${token}`, `pocketcart://auth?invite=${token}`, `https://pocketcart.hazelgeeks.workers.dev/family.html#invite=bad`, 'javascript:alert(1)']) assert.equal(parseFamilyInvite(link), null);
});
test('concurrent family cart edits rebase without losing another member item', async () => {
  let server = { items: [{productId:'milk',name:'Milk',quantity:1,unit:null}], revision: 0 };
  let writes = 0;
  const result = await mutateFamilyCart(async () => structuredClone(server), async (revision, items) => {
    writes++;
    if (writes === 1) { server.items.push({productId:'bread',name:'Bread',quantity:1,unit:null}); server.revision++; return false; }
    assert.equal(revision, 1); server = { items, revision: 2 }; return true;
  }, items => items.map(item => item.productId === 'milk' ? {...item,quantity:item.quantity+1} : item));
  assert.equal(result.find(item => item.productId === 'milk').quantity, 2);
  assert.equal(result.find(item => item.productId === 'bread').quantity, 1);
});
test('changed account or family cancels a queued cart write', async () => {
  let writes = 0;
  await assert.rejects(mutateFamilyCart(async () => ({items:[],revision:0}), async () => {writes++;return true;}, items => items, () => false), /family changed/);
  assert.equal(writes,0);
});
test('cart contention is bounded and uncertain network writes are not replayed', async () => {
  let writes = 0;
  await assert.rejects(mutateFamilyCart(async () => ({items:[],revision:0}), async () => {writes++;return false;}, items => items), /try again/);
  assert.equal(writes,4);
  writes = 0;
  await assert.rejects(mutateFamilyCart(async () => ({items:[],revision:0}), async () => {writes++;throw new Error('network');}, items => items), /network/);
  assert.equal(writes,1);
});
test('two members checking the same item keep it purchased after a retry', async () => {
  const { setFamilyItemCompleted } = require('../.tmp-tests/utils/familyCartSync.js');
  let state = {items:[{productId:'milk',name:'Milk',quantity:1,unit:null,completed:false}],revision:0};
  let attempt = 0;
  const items = await mutateFamilyCart(async()=>structuredClone(state),async(revision,items)=>{
    if(attempt++===0){state={items:setFamilyItemCompleted(state.items,'milk',true),revision:1};return false;}
    state={items,revision:revision+1};return true;
  },items=>setFamilyItemCompleted(items,'milk',true));
  assert.equal(items[0].completed,true);
});
