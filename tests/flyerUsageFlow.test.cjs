const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const batch = require('../.tmp-tests/utils/flyerBatchImport.js');
const usageTools = require('../.tmp-tests/utils/flyerUsage.js');
const { createFlyerRow } = require('../.tmp-tests/state/adminStore.js');
const row = createFlyerRow({ englishName: 'Milk', mainCategory: 'Dairy', price: '3.99', unit: '1 L' });

test('quota errors retain their status and explicit zero new OpenAI usage', async () => {
  const service = load('src/services/flyerAiImport.ts', {
    '../utils/flyerAiRows': {normalizeFlyerAiRows: rows => rows},
    '../utils/flyerUsage': usageTools,
    './supabaseClient': {supabase:null,supabaseAnonKey:'test'},
  }, {
    process: {env: {EXPO_PUBLIC_FLYER_AI_ENDPOINT:'https://test.local/extract'}},
    fetch: async () => Response.json({error:'Daily limit reached',usage:null},{status:429}),
  });
  await assert.rejects(service.extractFlyerRowsWithAi(new File(['flyer'],'flyer.png')), error => {
    assert.equal(error.status,429); assert.equal(error.usage,null); return true;
  });
});
const usage = { model: 'gpt-6-luna', inputTokens: 1000, outputTokens: 200, totalTokens: 1200,
  cachedInputTokens: 400, cacheWriteInputTokens: 200, reasoningTokens: 50, estimatedCostUsd: 0.000169 };
function load(source, dependencies, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exported = {};
  new Function('require', 'exports', ...Object.keys(globals), code)(
    (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
      return dependencies[name];
    }, exported, ...Object.values(globals),
  );
  return exported;
}

function uploader(extract, ocrFails = false) {
  let input, notice, finish;
  const notices = [];
  const exported = load('src/hooks/useAdminFlyerImport.ts', {
    react: { useRef: (value) => ({ current: value }), useCallback: (fn) => fn },
    'react-native': { Platform: { OS: 'web' } },
    '../utils/flyerBatchImport': batch,
    '../utils/flyerUsage': usageTools,
    '../utils/flyerCategory': { flyerCategory: () => 'Dairy' },
    '../utils/flyerProductReview': {},
    '../utils/flyerCsv': {}, '../utils/adminCsvFiles': {},
    '../utils/adminScreenHelpers': { normalizeOcrText: (text) => text, parseFlyerTextToRows: () => [row] },
    '../services/flyerAiImport': { hasFlyerAiEndpoint: true, extractFlyerRowsWithAi: extract },
    'tesseract.js': { createWorker: async () => ({
      recognize: async () => { if (ocrFails) throw new Error('OCR failed'); return { data: { text: 'Milk $3.99' } }; },
      terminate: async () => {},
    }) },
  }, { globalThis: { document: { createElement: () => (input = { click: () => {} }) } } });
  const hook = exported.default({
    flyerRows: [], setFlyerRows: () => {},
    setFlyerProcessing: (processing) => { if (!processing) finish(); },
    setFlyerProgress: () => {}, setNotice: (value) => { notice = value; notices.push(value); },
    addFlyerRow: () => {}, removeSelectedFlyerRows: () => {}, clearFlyerImport: () => {},
  });
  return {
    notices,
    async upload() {
      const done = new Promise((resolve) => { finish = resolve; });
      hook.handlePickFlyerFile();
      input.files = [new File(['fixture'], 'flyer.png', { type: 'image/png' })];
      input.onchange();
      await done;
      return notice;
    },
  };
}

test('completion notice contains the current batch usage and replaces the previous batch', async () => {
  let call = 0;
  const runner = uploader(async () => ({ rows: [row], usage: call++ === 0 ? usage : undefined }));
  assert.match(await runner.upload(), /Added 1 text rows.*1,200 tokens.*USD \$0\.000169/);
  const next = await runner.upload();
  assert.match(next, /usage and estimated cost unavailable/);
  assert.doesNotMatch(next, /1,200|0\.000169/);
  assert.equal(runner.notices.filter((value) => value === null).length, 2);
});

for (const ocrFails of [false, true]) {
  test(`AI usage survives local OCR fallback (OCR failure: ${ocrFails})`, async () => {
    const runner = uploader(async () => ({ rows: [], usage }), ocrFails);
    const notice = await runner.upload();
    assert.match(notice, /1,200 tokens.*USD \$0\.000169/);
    assert.match(notice, ocrFails ? /OCR failed/ : /OCR fallback used/);
  });
}

test('client forwards normalized usage on successful and failed server responses', async () => {
  for (const status of [200, 502]) {
    const service = load('src/services/flyerAiImport.ts', {
      '../utils/flyerAiRows': { normalizeFlyerAiRows: (rows) => rows },
      '../utils/flyerUsage': usageTools,
      './supabaseClient': { supabase: null, supabaseAnonKey: 'test' },
    }, {
      process: { env: { EXPO_PUBLIC_FLYER_AI_ENDPOINT: 'https://test.local/extract' } },
      fetch: async () => Response.json({ rows: [], usage, error: status === 502 ? 'Bad output' : undefined }, { status }),
    });
    const file = new File(['fixture'], 'flyer.png');
    if (status === 200) assert.deepEqual((await service.extractFlyerRowsWithAi(file)).usage, usage);
    else await assert.rejects(service.extractFlyerRowsWithAi(file), (error) => {
      assert.deepEqual(error.usage, usage);
      return true;
    });
  }
});
