const test=require('node:test'),assert=require('node:assert/strict');
const {billingHookHarness}=require('./helpers/billingHookHarness.cjs');
const info={entitlements:{active:{}}};
function service(overrides={}){return {observeBillingChanges:async()=>()=>{},billingConfigured:true,purchasesEnabled:true,PLUS_ENTITLEMENT:'pocketcart_plus',setBillingUser:async()=>{},loadBilling:async()=>({info,packages:[]}),verifyBillingAccess:async()=>false,billingError:e=>e?.userCancelled?null:e.message,restoreBillingPurchases:async()=>info,manageBillingSubscription:async()=>{},...overrides}}
test('membership is cleared immediately when accounts change and stale checks cannot grant access',async()=>{
 const pending=[];const h=billingHookHarness(service({verifyBillingAccess:()=>new Promise(resolve=>pending.push(resolve))}));
 await h.render('a');let state=await h.render('b');assert.equal(state.isPlus,false);
 pending[0](true);state=await h.render('b');assert.equal(state.isPlus,false);
 pending[1](false);state=await h.render('b');assert.equal(state.isPlus,false);h.unmount();
});
test('verification failure fails closed and preserves a retry message',async()=>{
 const h=billingHookHarness(service({verifyBillingAccess:async()=>{throw Error('Verification unavailable')}}));
 const state=await h.render('a');assert.equal(state.isPlus,false);assert.equal(state.message,'Verification unavailable');h.unmount();
});
test('double taps produce only one store purchase and restore reports no active purchase',async()=>{
 let calls=0,finish;const h=billingHookHarness(service({purchaseBillingPackage:()=>{calls++;return new Promise(resolve=>finish=resolve)}}));
 let state=await h.render('a');const first=state.purchase('monthly');const second=state.purchase('monthly');assert.equal(calls,1);finish(info);await Promise.all([first,second]);
 state=await h.render('a');assert.equal(state.busy,false);await state.restore();state=await h.render('a');assert.match(state.message,/No active Plus/);h.unmount();
});
