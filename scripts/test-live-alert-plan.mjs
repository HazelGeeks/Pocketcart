import assert from 'node:assert/strict';
const project = process.env.SUPABASE_PROJECT_ID;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (project !== 'jmxbvqrvxshlybeomagw' || !key) throw new Error('Missing credentials or incorrect project.');
const base = `https://${project}.supabase.co`;
let userId;
async function request(path, { method = 'GET', token = key, body } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  return { response, data };
}
function ok(result, label) { assert.ok(result.response.ok, `${label}: HTTP ${result.response.status}`); return result.data; }
try {
  const email = `pocketcart-alert-${crypto.randomUUID()}@example.com`;
  const password = `Pc!${crypto.randomUUID()}A9`;
  userId = ok(await request('/auth/v1/admin/users', { method: 'POST', body: { email, password, email_confirm: true } }), 'Create disposable user').id;
  const session = ok(await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }), 'Sign in');
  const token = session.access_token;
  const products = ok(await request('/rest/v1/products?select=id&order=id&limit=7'), 'Read product ids');
  assert.ok(products.length >= 7, 'Need seven catalog products for alert check');
  const add = index => request('/functions/v1/watchlist-access', { method: 'POST', token, body: { action: 'add', isPlus: true, userId: 'forged', item: { productId: products[index].id, name: 'Free alert test product', store: 'Test' } } });
  for (let i = 0; i < 7; i++) ok(await add(i), `Add product ${i + 1}`);
  ok(await add(0), 'Update existing product');
  const status = ok(await request('/functions/v1/watchlist-access', { method: 'POST', token, body: { action: 'status' } }), 'Read alert plan');
  assert.equal(status.isPlus, false); assert.equal(status.activeIds.length, 7); assert.equal(status.items.length, 7);
  const forged = await request('/rest/v1/rpc/save_watchlist_with_plan', { method: 'POST', token, body: { p_user_id: userId, p_product_id: products[5].id, p_store_id: null, p_name: 'Forged', p_store: 'Test', p_target_price: null, p_plus: true } });
  assert.equal(forged.response.ok, false, 'Client must not execute service-only RPC');
  ok(await request(`/rest/v1/watchlist_items?id=eq.${status.activeIds[0]}`, { method: 'DELETE', token }), 'Remove alert');
  const concurrent = await Promise.all([add(5), add(6)]);
  assert.equal(concurrent.filter(r => r.response.ok).length, 2, 'Both concurrent updates succeed without a quota');
  for (let i = 0; i < 7; i++) ok(await request('/rest/v1/freezer_items', { method: 'POST', token, body: { user_id: userId, name: `Freezer test ${i}`, storage_area: 'fridge', quantity: 1 } }), 'Free Freezer storage');
  const freezer = ok(await request(`/rest/v1/freezer_items?user_id=eq.${userId}&select=id`, { token }), 'Read Freezer');
  assert.equal(freezer.length, 7);
  console.log('PASS: free alerts beyond five, duplicate update, service-only RPC protection, concurrent updates, removal and seven free Freezer entries.');
} finally {
  if (userId) ok(await request(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' }), 'Delete disposable user and cascade test data');
}
