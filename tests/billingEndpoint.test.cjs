const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function endpoint(env,fetcher){let handler;vm.runInNewContext(ts.transpileModule(fs.readFileSync('supabase/functions/billing-status/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
 exports:{},Response,AbortSignal,fetch:fetcher,Deno:{env:{get:k=>env[k]},serve:fn=>handler=fn},require:()=>require('../.tmp-tests/supabase/functions/_shared/billingEntitlement.js')});return handler;}
const env={SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'public',REVENUECAT_SECRET_API_KEY:'server-only'};
test('billing endpoint rejects anonymous requests before fetching any account data',async()=>{
 const handler=endpoint(env,()=>{throw Error('must not fetch')});assert.equal((await handler(new Request('https://local',{method:'POST'}))).status,401);
});
test('billing endpoint ignores supplied user ID and checks the authenticated account only',async()=>{
 const calls=[];const handler=endpoint(env,async(url,options)=>{calls.push({url,options});return calls.length===1?new Response(JSON.stringify({id:'authenticated-user'})):new Response(JSON.stringify({subscriber:{entitlements:{}}}))});
 const result=await handler(new Request('https://local',{method:'POST',headers:{Authorization:'Bearer test-user-token'},body:JSON.stringify({userId:'victim'})}));
 assert.equal(result.status,200);assert.deepEqual(await result.json(),{isPlus:false});assert.match(calls[1].url,/authenticated-user$/);assert.equal(calls[1].options.headers.Authorization,'Bearer server-only');assert.equal(result.headers.get('Cache-Control'),'no-store');
});
test('provider failures and missing configuration never return paid access',async()=>{
 const missing=endpoint({},()=>{});assert.equal((await missing(new Request('https://local',{method:'POST',headers:{Authorization:'Bearer token'}}))).status,503);
 let calls=0;const failed=endpoint(env,async()=>++calls===1?new Response(JSON.stringify({id:'u'})):new Response('unavailable',{status:500}));
 const result=await failed(new Request('https://local',{method:'POST',headers:{Authorization:'Bearer token'}}));assert.equal(result.status,503);assert.equal((await result.json()).isPlus,undefined);
});
