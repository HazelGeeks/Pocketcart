const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function harness() {
  const personal = {items:[{productId:'private'}],loaded:true,clear(){throw Error('private write');}};
  const shared = {items:[{productId:'family'}],loaded:true,importItems(items){this.imported=items;}};
  let family = {userId:'u',family:null,ready:true,error:null,refresh:async()=>{}};
  const mod = {exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/hooks/useShoppingList.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText, {exports:mod.exports,require(name){
    if(name.includes('FamilyContext'))return {useFamily:()=>family};
    if(name.includes('usePersonal'))return ()=>personal;
    if(name.includes('useFamilyCart'))return ()=>shared;
    throw Error(name);
  }});
  return {render:mod.exports.default,personal,shared,setFamily(value){family={...family,...value};}};
}
test('shared Cart selects a separate source and requires explicit personal import',()=>{
  const h=harness();assert.equal(h.render('u').items,h.personal.items);
  h.setFamily({family:{id:'f',name:'Our family'}});
  let view=h.render('u');assert.equal(view.items,h.shared.items);assert.equal(h.shared.imported,undefined);
  view.importPersonal();assert.equal(h.shared.imported,h.personal.items);
  h.setFamily({family:null});view=h.render('u');assert.equal(view.items,h.personal.items);
});
test('unresolved membership and mismatched account hide data and block cart writes',()=>{
  const h=harness();
  h.setFamily({ready:false,error:'offline'});let view=h.render('u');assert.equal(view.items.length,0);view.clear();
  h.setFamily({ready:true,userId:'other'});view=h.render('u');assert.equal(view.items.length,0);view.clear();
});
