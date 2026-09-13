const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(enabled=true,key='appl_public_test'){
 let account='u',sdkUser=null,configured=false,purchases=0,restores=0,fail=null;
 const listeners=new Set();
 const info={entitlements:{active:{},all:{}}};const item={identifier:'monthly',product:{subscriptionPeriod:'P1M',priceString:'STORE PRICE'}};
 let packages=[item];
 const client={addCustomerInfoUpdateListener:fn=>listeners.add(fn),removeCustomerInfoUpdateListener:fn=>listeners.delete(fn),isConfigured:async()=>configured,configure:({appUserID})=>{configured=true;sdkUser=appUserID},getAppUserID:async()=>sdkUser,
 logIn:async id=>{sdkUser=id},isAnonymous:async()=>sdkUser===null,logOut:async()=>{sdkUser=null},
 invalidateCustomerInfoCache:async()=>{},getCustomerInfo:async()=>info,getOfferings:async()=>({current:{availablePackages:packages}}),
 purchasePackage:async p=>{if(fail)throw fail;assert.equal(p,item);purchases++;return {customerInfo:info}},
 restorePurchases:async()=>{restores++;return info},showManageSubscriptions:async()=>{}};
 const mod={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/billingClient.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
 exports:mod.exports,Error,process:{env:{EXPO_PUBLIC_REVENUECAT_IOS_KEY:key,EXPO_PUBLIC_PURCHASES_ENABLED:String(enabled)}},require(name){
 if(name==='react-native')return {Platform:{OS:'ios'}};
 if(name==='react-native-purchases')return client;
 if(name==='./supabaseClient')return {supabase:{auth:{getUser:async()=>({data:{user:{id:account}},error:null})},functions:{invoke:async()=>({data:{isPlus:false},error:null})}}};throw Error(name);
 }});
 return {service:mod.exports,info,item,setPackages:value=>packages=value,emit:()=>listeners.forEach(fn=>{fn(info)}),setAccount:id=>account=id,setFailure:e=>fail=e,purchases:()=>purchases,restores:()=>restores,sdkUser:()=>sdkUser};
}
test('monthly launch excludes other billing periods and preserves the localized store price',async()=>{
 const h=setup();await h.service.setBillingUser('u');
 const annual={identifier:'annual',product:{subscriptionPeriod:'P1Y'}};
 const quarterly={identifier:'quarterly',product:{subscriptionPeriod:'P3M'}};
 h.setPackages([annual,h.item,quarterly]);
 const result=await h.service.loadBilling('u');assert.equal(result.packages.length,1);
 assert.equal(result.packages[0].product.priceString,'STORE PRICE');
 await assert.rejects(h.service.purchaseBillingPackage('u','annual'),/no longer available/);
 // Reject a stale monthly selection if its period changed after loading.
 h.item.product.subscriptionPeriod='P1Y';
 await assert.rejects(h.service.purchaseBillingPackage('u','monthly'),/no longer available/);
 assert.equal(h.purchases(),0);
});
test('sales-disabled configuration blocks purchase but supports restore',async()=>{
 const h=setup(false);await h.service.setBillingUser('u');await assert.rejects(h.service.purchaseBillingPackage('u','monthly'),/not available/);
 await h.service.restoreBillingPurchases('u');assert.equal(h.purchases(),0);assert.equal(h.restores(),1);
});
test('store packages are selected by current offering and duplicate entitlement purchases are blocked',async()=>{
 const h=setup();await h.service.setBillingUser('u');await h.service.purchaseBillingPackage('u','monthly');assert.equal(h.purchases(),1);
 await assert.rejects(h.service.purchaseBillingPackage('u','removed-plan'),/no longer available/);
 h.info.entitlements.active.pocketcart_plus={isActive:true};await assert.rejects(h.service.purchaseBillingPackage('u','monthly'),/already have/);
});
test('account switching prevents stale callbacks from purchasing or restoring for the wrong user',async()=>{
 const h=setup();await h.service.setBillingUser('u');h.setAccount('other');await h.service.setBillingUser('other');
 await assert.rejects(h.service.purchaseBillingPackage('u','monthly'),/Sign in/);
 await assert.rejects(h.service.restoreBillingPurchases('u'),/Sign in/);assert.equal(h.purchases(),0);
 await h.service.setBillingUser(null);assert.equal(h.sdkUser(),null);
});
test('cancelled store sheets remain cancellation, not successful payment',async()=>{
 const h=setup();await h.service.setBillingUser('u');h.setFailure({userCancelled:true});
 let caught;try{await h.service.purchaseBillingPackage('u','monthly')}catch(e){caught=e}
 assert.equal(h.service.billingError(caught),null);assert.equal(h.purchases(),0);
});
test('missing keys and secret or Test Store keys cannot enable native purchases',async()=>{
 for(const key of ['', 'sk_secret', 'test_store']){const h=setup(true,key);assert.equal(h.service.billingConfigured,false);await h.service.setBillingUser('u');await assert.rejects(h.service.purchaseBillingPackage('u','monthly'),/not available/);assert.equal(h.purchases(),0);}
});

test('subscription updates refresh once per entitlement change and ignore the previous account',async()=>{
 const h=setup();await h.service.setBillingUser('u');let updates=0;
 const remove=await h.service.observeBillingChanges('u',()=>updates++);
 h.emit();assert.equal(updates,0);
 h.info.entitlements.all.pocketcart_plus={isActive:true};h.emit();h.emit();assert.equal(updates,1);
 h.setAccount('other');await h.service.setBillingUser('other');h.info.entitlements.all={};h.emit();assert.equal(updates,1);remove();
});
