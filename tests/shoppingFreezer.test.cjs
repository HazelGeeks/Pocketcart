const test=require('node:test'),assert=require('node:assert/strict');
const {shoppingItemFreezerDraft,markShoppingItemStored}=require('../.tmp-tests/utils/shoppingFreezer.js');
const {toggleShoppingListItem,addShoppingListProduct}=require('../.tmp-tests/utils/shoppingListState.js');
const {shoppingHookHarness}=require('./helpers/shoppingHookHarness.cjs');
const item={productId:'milk',name:'Milk',unit:'1 L',quantity:2,completed:true};
test('freezer draft preserves product identity and package count without inventing an expiry date',()=>{
 const draft=shoppingItemFreezerDraft(item);assert.equal(draft.name,'Milk');assert.equal(draft.quantity,'2');assert.equal(draft.unit,'1 L');assert.equal(draft.expiresOn,'');assert.equal(draft.storageArea,'fridge');
 assert.equal(shoppingItemFreezerDraft({...item,productId:'custom:1',unit:null}).unit,'');
});
test('saving keeps the purchased entry and only marks the requested completed item',()=>{
 const items=markShoppingItemStored([item,{...item,productId:'bread',completed:false}],'milk','freezer-id');
 assert.equal(items.length,2);assert.equal(items[0].completed,true);assert.equal(items[0].freezerItemId,'freezer-id');
 assert.equal(markShoppingItemStored(items,'bread','other')[1].freezerItemId,undefined);
 assert.equal(toggleShoppingListItem(items,'milk')[0].freezerItemId,undefined);
 assert.equal(addShoppingListProduct(items,{id:'milk',name:'Milk',unit:'1 L'})[0].freezerItemId,undefined);
});
test('added marker survives reopening the list and does not leak to another account',async()=>{
 const data=new Map();const storage={getItem:async k=>data.get(k)??null,setItem:async(k,v)=>data.set(k,v),removeItem:async k=>data.delete(k)};
 let h=shoppingHookHarness(storage);let list=await h.render('user-a');
 list.addProduct({id:'milk',english_name:'Milk',unit:'1 L'});list=await h.render('user-a');list.toggleCompleted('milk');list=await h.render('user-a');
 list.markStored('milk','freezer-id');await h.render('user-a');h.unmount();
 h=shoppingHookHarness(storage);list=await h.render('user-a');assert.equal(list.items[0].freezerItemId,'freezer-id');assert.equal(list.items[0].completed,true);
 list=await h.render('user-b');assert.equal(list.items.length,0);h.unmount();
});
