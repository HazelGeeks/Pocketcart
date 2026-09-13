const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function endpoint({ plus = false, authError = false, rpcError = null } = {}) {
  let handler; const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: authError ? null : { id: 'authenticated-user' } }, error: authError }) },
    rpc: async (name, args) => { calls.push({ name, args }); return { data: { id: 'saved' }, error: rpcError }; },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('supabase/functions/watchlist-access/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports: {}, Response, Deno: { env: { get: () => 'configured' }, serve: fn => { handler = fn; } },
    require: name => name.includes('supabase-js') ? { createClient: () => client } : name.includes('watchlistAccess') ? { verifiedWatchlistPlus: async () => plus } : {},
  });
  return { handler, calls };
}
const item = { productId: '20000000-0000-0000-0000-000000000001', name: 'Milk', store: 'Store' };
const request = body => new Request('https://local', { method: 'POST', headers: { Authorization: 'Bearer token' }, body: JSON.stringify(body) });
test('watchlist endpoint rejects unauthenticated callers and forged subscription/user fields', async () => {
  const h = endpoint();
  assert.equal((await h.handler(new Request('https://local', { method: 'POST' }))).status, 401);
  assert.equal((await h.handler(request({ action: 'add', item, userId: 'victim', isPlus: true }))).status, 200);
  assert.equal(h.calls[0].args.p_user_id, 'authenticated-user');
  assert.equal(h.calls[0].args.p_plus, false);
});
test('only server-verified subscribers receive unlimited registration', async () => {
  const h = endpoint({ plus: true }); await h.handler(request({ action: 'add', item }));
  assert.equal(h.calls[0].args.p_plus, true);
});
test('quota errors explain removal; invalid input never reaches the database', async () => {
  const h = endpoint({ rpcError: { message: 'WATCHLIST_LIMIT_REACHED' } });
  const result = await h.handler(request({ action: 'add', item }));
  assert.equal(result.status, 409); assert.match((await result.json()).error, /5 products.*Remove/);
  assert.equal((await h.handler(request({ action: 'add', item: { ...item, productId: 'bad' } }))).status, 400);
  assert.equal(h.calls.length, 1);
});
