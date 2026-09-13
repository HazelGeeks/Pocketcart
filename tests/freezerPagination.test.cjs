const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
test('Freezer loads beyond the API page limit and discards partial results on failure', async () => {
  const rows = Array.from({ length: 1001 }, (_, id) => ({ id: String(id) }));
  let failSecond = false; const ranges = [];
  const query = { select() { return this; }, eq() { return this; }, is() { return this; }, order() { return this; },
    range: async (from, to) => { ranges.push([from, to]); return failSecond && from > 0 ? { data: null, error: { message: 'offline' } } : { data: rows.slice(from, to + 1), error: null }; } };
  const client = { auth: { getUser: async () => ({ data: { user: { id: 'u' } }, error: null }) }, from: () => query };
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/myFreezer.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: mod.exports, require: name => name === './family' ? {loadFamily: async () => null} : name.includes('supabaseClient') ? { hasSupabaseEnv: true, supabase: client } : name.includes('paginatedQuery') ? require('../.tmp-tests/utils/paginatedQuery.js') : require('../.tmp-tests/utils/freezerItem.js'),
  });
  assert.equal((await mod.exports.listMyFreezerItems('u')).data.length, 1001);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  failSecond = true;
  const failed = await mod.exports.listMyFreezerItems('u');
  assert.equal(failed.error, 'offline'); assert.equal(failed.data.length, 0);
});
