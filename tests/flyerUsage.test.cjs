const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const client = require('../.tmp-tests/utils/flyerUsage.js');
const backend = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('supabase/functions/back-office-flyer/usage.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, backend);
const { flyerAiUsage } = backend.exports;
const raw = { input_tokens: 1000, output_tokens: 200,
  input_tokens_details: { cached_tokens: 400, cache_write_tokens: 200 },
  output_tokens_details: { reasoning_tokens: 50 } };

test('cached reads, cache writes and reasoning are priced without double counting', () => {
  const usage = flyerAiUsage(raw, 'gpt-6-luna');
  assert.equal(usage.totalTokens, 1200);
  assert.ok(Math.abs(usage.estimatedCostUsd - 0.000169) < 1e-12);
  assert.deepEqual(client.normalizeFlyerUsage(usage), JSON.parse(JSON.stringify(usage)));
});

test('long context and returned service tier select the correct per-request rates', () => {
  const normal = flyerAiUsage({ input_tokens: 272000, output_tokens: 200 }, 'gpt-6-luna');
  const long = flyerAiUsage({ input_tokens: 272001, output_tokens: 200 }, 'gpt-6-luna');
  assert.ok(Math.abs(normal.estimatedCostUsd - 0.0273) < 1e-12);
  assert.ok(Math.abs(long.estimatedCostUsd - 0.0545502) < 1e-12);
  assert.equal(flyerAiUsage(raw, 'gpt-6-luna', 'fast').estimatedCostUsd, 0.000169 * 2);
  assert.equal(flyerAiUsage(raw, 'gpt-6-luna', 'flex').estimatedCostUsd, 0.000169 / 2);
  assert.equal(flyerAiUsage(raw, 'gpt-6-luna', 'unknown').estimatedCostUsd, null);
});

test('invalid or missing usage is not shown as zero and unknown models are not priced', () => {
  assert.equal(flyerAiUsage(undefined, 'gpt-6-luna'), undefined);
  assert.equal(flyerAiUsage({ ...raw, input_tokens: -1 }, 'gpt-6-luna'), undefined);
  assert.equal(flyerAiUsage({ ...raw, input_tokens: 100 }, 'gpt-6-luna'), undefined);
  assert.equal(client.normalizeFlyerUsage(undefined), undefined);
  assert.equal(client.normalizeFlyerUsage(null), null);
  const unknown = flyerAiUsage(raw, 'other-model');
  assert.equal(unknown.estimatedCostUsd, null);
  assert.equal(client.normalizeFlyerUsage({ ...unknown, totalTokens: 999 }), undefined);
  assert.match(client.formatFlyerUsageSummary(client.summarizeFlyerUsage([unknown])), /Est\. cost unavailable/);
});

test('completion text shows precise small USD costs and partial-report coverage', () => {
  const usage = flyerAiUsage(raw, 'gpt-6-luna');
  const message = client.formatFlyerUsageSummary(client.summarizeFlyerUsage([usage, undefined, null]));
  assert.match(message, /1,200 tokens \(input 1,000 \/ output 200\)/);
  assert.match(message, /Est\. USD \$0\.000169/);
  assert.match(message, /Partial usage; 1 file/);
  assert.match(message, /Google Vision OCR excluded/);
  assert.match(client.formatFlyerUsageSummary(client.summarizeFlyerUsage([undefined])), /unavailable/);
  assert.match(client.formatFlyerUsageSummary(client.summarizeFlyerUsage([null])), /0 tokens.*USD \$0\.000000/);
});
