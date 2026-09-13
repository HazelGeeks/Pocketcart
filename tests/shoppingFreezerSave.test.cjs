const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {emptyFreezerItemDraft}=require('../.tmp-tests/utils/freezerItem.js');
function setup(){
 const rows=new Map();let user='u';
 const client={auth:{getUser:async()=>({data:{user:{id:user}},error:null})},from:()=>({upsert(payload){rows.set(payload.id,payload);return {select:()=>({single:async()=>({data:payload,error:null})})}}})};
 const mod={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/myFreezer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,require(name){if(name==='./family')return {loadFamily:async()=>null};if(name.includes('paginatedQuery'))return require('../.tmp-tests/utils/paginatedQuery.js');if(name.includes('freezerItem'))return require('../.tmp-tests/utils/freezerItem.js');if(name.includes('supabaseClient'))return {hasSupabaseEnv:true,supabase:client};throw Error(name)}});
 return {save:mod.exports.saveMyFreezerItem,rows,setUser:v=>user=v};
}
test('retries with the same transfer id create only one freezer record',async()=>{
 const h=setup(),draft={...emptyFreezerItemDraft(),name:'Milk',quantity:'2',unit:'1 L'};
 const result=await h.save({userId:'u',creationId:'stable-id',draft});assert.equal(result.error,null);
 await h.save({userId:'u',creationId:'stable-id',draft});assert.equal(h.rows.size,1);assert.equal(h.rows.get('stable-id').quantity,2);assert.equal(h.rows.get('stable-id').expires_on,null);
});
test('invalid dates and account changes prevent a transfer write',async()=>{
 const h=setup(),draft={...emptyFreezerItemDraft(),name:'Milk',quantity:'2',expiresOn:'2026-02-30'};
 assert.match((await h.save({userId:'u',creationId:'id',draft})).error,/YYYY-MM-DD/);assert.equal(h.rows.size,0);
 h.setUser('other');assert.match((await h.save({userId:'u',creationId:'id',draft:{...draft,expiresOn:''}})).error,/sign in/);assert.equal(h.rows.size,0);
});
test('changed family prevents a transfer into a different inventory',async()=>{
 const h=setup(),draft={...emptyFreezerItemDraft(),name:'Milk'};
 const result=await h.save({userId:'u',creationId:'id',draft,expectedFamilyId:'old-family'});
 assert.match(result.error,/family changed/);assert.equal(h.rows.size,0);
});
test('Cart product identity is persisted with food and retained when quantities or notes change',async()=>{
 const h=setup(),productId='11111111-1111-1111-1111-111111111111';
 const draft={...emptyFreezerItemDraft(),name:'Milk',productId};
 assert.equal((await h.save({userId:'u',creationId:'stable-id',draft})).error,null);
 assert.equal(h.rows.get('stable-id').product_id,productId);
 await h.save({userId:'u',creationId:'stable-id',draft:{...draft,quantity:'3',note:'Top shelf'}});
 assert.equal(h.rows.get('stable-id').product_id,productId);assert.equal(h.rows.size,1);
});
