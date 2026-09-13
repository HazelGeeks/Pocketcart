import assert from 'node:assert/strict';
const project = process.env.SUPABASE_PROJECT_ID, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (project !== 'jmxbvqrvxshlybeomagw' || !key) throw new Error('Missing credentials or incorrect project.');
const base = `https://${project}.supabase.co`, users = [];
async function request(path, { method = 'GET', token = key, body } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { response, data: await response.json().catch(() => null) };
}
function ok(result, label) { assert.ok(result.response.ok, `${label}: HTTP ${result.response.status}`); return result.data; }
async function action(user, name, value = null) { return request('/rest/v1/rpc/family_action', { method:'POST',token:user.token,body:{p_action:name,p_value:value} }); }
async function cart(user, family, revision, items) { return request('/rest/v1/rpc/save_family_cart', { method:'POST',token:user.token,body:{p_family_id:family,p_revision:revision,p_items:items} }); }
try {
  for(let i=0;i<3;i++) {
    const email=`pocketcart-family-${crypto.randomUUID()}@example.com`, password=`Pc!${crypto.randomUUID()}A9`;
    const user=ok(await request('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,user_metadata:{full_name:`Family QA ${i+1}`}}}),'Create disposable member');
    users.push({id:user.id,token:null});
    const session=ok(await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}),'Sign in disposable member');
    users.at(-1).token=session.access_token;
  }
  const [owner,member,outsider]=users;
  const plan=ok(await request('/functions/v1/billing-status',{method:'POST',token:owner.token,body:{}}),'Read General account status');
  assert.equal(plan.isPlus,false);
  assert.equal((await request('/rest/v1/rpc/family_action',{method:'POST',token:'invalid-token',body:{p_action:'create',p_value:'Denied'}})).response.ok,false);
  const family=ok(await action(owner,'create','Disposable family QA'),'Create family').family_id;
  const invite=ok(await action(owner,'invite'),'Create invitation').token;
  assert.match(invite,/^[a-f0-9]{64}$/);
  ok(await action(member,'join',invite),'Accept invitation from new account');
  assert.equal((await action(outsider,'join',invite)).response.ok,false,'Invite must only be usable once');
  assert.equal((await action(member,'invite')).response.ok,false,'Only owner invites');
  const members=ok(await request('/rest/v1/rpc/list_family_members',{method:'POST',token:member.token,body:{}}),'List family');
  assert.equal(members.length,2);
  const items=[{productId:'custom:family-qa',name:'Shared QA milk',unit:null,quantity:2,completed:true}];
  assert.equal(ok(await cart(owner,family,0,items),'Save family Cart'),true);
  assert.equal(ok(await cart(member,family,0,[]),'Reject stale Cart'),false);
  assert.deepEqual(ok(await request('/rest/v1/family_carts?select=items',{token:member.token}),'Read member Cart')[0].items,items);
  assert.equal(ok(await request('/rest/v1/family_carts?select=items',{token:outsider.token}),'Outsider Cart isolation').length,0);
  assert.equal((await cart(outsider,family,1,[])).response.ok,false);
  const food=ok(await request('/rest/v1/freezer_items',{method:'POST',token:owner.token,body:{user_id:owner.id,family_id:family,name:'Shared QA food',quantity:1}}),'Add shared food')[0];
  ok(await request('/rest/v1/freezer_items',{method:'POST',token:owner.token,body:{user_id:owner.id,name:'Private QA food',quantity:1}}),'Add private food');
  const foodRows=ok(await request('/rest/v1/freezer_items?select=id,name',{token:member.token}),'Read shared food');
  assert.equal(foodRows.length,1);assert.equal(foodRows[0].id,food.id);
  ok(await request(`/rest/v1/freezer_items?id=eq.${food.id}`,{method:'PATCH',token:member.token,body:{quantity:3}}),'Edit another member food');
  assert.equal(ok(await request('/rest/v1/freezer_items?select=id',{token:outsider.token}),'Outsider food isolation').length,0);
  const revoked=ok(await action(owner,'invite'),'Create revocable invite').token;ok(await action(owner,'revoke'),'Revoke invite');
  assert.equal((await action(outsider,'join',revoked)).response.ok,false);
  ok(await action(owner,'remove',member.id),'Remove member');
  assert.equal(ok(await request('/rest/v1/freezer_items?select=id',{token:member.token}),'Removed member denied').length,0);
  assert.equal((await cart(member,family,1,[])).response.ok,false);
  console.log('PASS: real account sign-in, invitation creation/acceptance/reuse/revocation, shared Cart and Freezer, stale-write rejection, outsider isolation and removed-member access.');
} finally {
  const failures=[];
  for(const user of [...users].reverse()) { const result=await request(`/auth/v1/admin/users/${user.id}`,{method:'DELETE'});if(!result.response.ok) failures.push(user.id); }
  assert.equal(failures.length,0,'Disposable account cleanup failed; inspect test-run accounts in admin.');
  console.log('Disposable accounts and their family test data removed.');
}
