const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function setup(){
  let items=[{id:'a',name:'Milk',expires_on:'2090-10-01'}],error=null,granted=true;
  const pending=new Map(),prefs=new Map(); let creates=0;
  const api={PermissionStatus:{GRANTED:'granted'},IosAuthorizationStatus:{PROVISIONAL:3},SchedulableTriggerInputTypes:{DATE:'date'},AndroidImportance:{DEFAULT:3},
    getPermissionsAsync:async()=>({granted}),requestPermissionsAsync:async()=>({granted}),
    getAllScheduledNotificationsAsync:async()=>[...pending.values()],cancelScheduledNotificationAsync:async id=>{pending.delete(id)},
    scheduleNotificationAsync:async request=>{creates++;pending.set(request.identifier,request);return request.identifier},setNotificationChannelAsync:async()=>{}};
  const mod={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/freezerNotifications.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
    exports:mod.exports,require(name){
      if(name==='react-native')return {Platform:{OS:'ios'}};
      if(name==='expo-notifications')return api;
      if(name.includes('async-storage'))return {getItem:async k=>prefs.get(k)??null,setItem:async(k,v)=>prefs.set(k,v)};
      if(name.includes('freezerReminders'))return require('../.tmp-tests/utils/freezerReminders.js');
      if(name==='./myFreezer')return {listMyFreezerItems:async()=>({data:items,error})};
      if(name==='./pushNotifications')return {configurePushNotificationHandler(){}};
      throw Error(name);
    }});
  return {service:mod.exports,pending,creates:()=>creates,setItems:v=>items=v,setError:v=>error=v,setGranted:v=>granted=v};
}
test('sync is idempotent and replaces date/name edits, deletion cancels only freezer reminders',async()=>{
  const h=setup();h.pending.set('sale',{identifier:'sale',content:{data:{kind:'sale'}}});
  await h.service.setFreezerReminderUser('u');assert.equal(h.creates(),3);
  await h.service.refreshFreezerReminders('u');assert.equal(h.creates(),3);
  h.setItems([{id:'a',name:'Eggs',expires_on:'2090-11-01'}]);await h.service.refreshFreezerReminders('u');
  assert.equal(h.pending.size,4);assert.equal(h.creates(),6);
  h.setItems([]);await h.service.refreshFreezerReminders('u');assert.deepEqual([...h.pending.keys()],['sale']);
});
test('logout cancels old schedules and disabled preference survives subsequent refresh',async()=>{
  const h=setup();await h.service.setFreezerReminderUser('u');await h.service.setFreezerReminderUser(null);assert.equal(h.pending.size,0);
  await h.service.setFreezerReminderUser('u');await h.service.setFreezerRemindersEnabled('u',false);assert.equal(h.pending.size,0);
  await h.service.refreshFreezerReminders('u');assert.equal(h.pending.size,0);
});
test('temporary data errors retain pending reminders and denied permission schedules none',async()=>{
  const h=setup();await h.service.setFreezerReminderUser('u');h.setError('Network unavailable');
  assert.equal(await h.service.refreshFreezerReminders('u'),'Network unavailable');assert.equal(h.pending.size,3);
  h.setGranted(false);await h.service.refreshFreezerReminders('u');assert.equal(h.pending.size,0);
});
test('queued work cannot restore notifications for an account after logout',async()=>{
  const h=setup();const first=h.service.setFreezerReminderUser('u');const last=h.service.setFreezerReminderUser(null);await Promise.all([first,last]);assert.equal(h.pending.size,0);
});
test('large inventories respect pending notification capacity and report deferred dates',async()=>{
  const h=setup();for(let i=0;i<59;i++)h.pending.set('other'+i,{identifier:'other'+i,content:{data:{}}});
  assert.match(await h.service.setFreezerReminderUser('u'),/Nearest reminder dates/);assert.equal(h.pending.size,60);
});
