const test=require('node:test'),assert=require('node:assert/strict');
const {revenueCatHasAccess:access}=require('../.tmp-tests/supabase/functions/_shared/billingEntitlement.js');
const now=Date.parse('2026-10-01T12:00:00Z');
const customer=(expires,extra={})=>({entitlements:{pocketcart_plus:{product_identifier:'plus-month',purchase_date:'2026-09-01T00:00:00Z',expires_date:expires}},subscriptions:{'plus-month':extra}});
test('server access covers active, expired, malformed and absent entitlements',()=>{
 assert.equal(access(customer('2026-11-01T00:00:00Z'),'pocketcart_plus',now),true);
 assert.equal(access(customer('2026-09-30T00:00:00Z'),'pocketcart_plus',now),false);
 assert.equal(access(customer('bad'),'pocketcart_plus',now),false);
 assert.equal(access(customer(undefined),'pocketcart_plus',now),false);
 assert.equal(access(undefined,'pocketcart_plus',now),false);
});
test('billing grace preserves paid access but an ended grace does not',()=>{
 assert.equal(access(customer('2026-09-30T00:00:00Z',{grace_period_expires_date:'2026-10-04T00:00:00Z'}),'pocketcart_plus',now),true);
 assert.equal(access(customer('2026-09-25T00:00:00Z',{grace_period_expires_date:'2026-09-30T00:00:00Z'}),'pocketcart_plus',now),false);
});
test('sandbox transactions are denied in production by default',()=>{
 const sandbox=customer('2026-11-01T00:00:00Z',{is_sandbox:true});
 assert.equal(access(sandbox,'pocketcart_plus',now),false);assert.equal(access(sandbox,'pocketcart_plus',now,true),true);
});
