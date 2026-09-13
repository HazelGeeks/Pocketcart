const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

exports.shoppingHookHarness = function shoppingHookHarness(storage, sync = {}) {
  const slots = []; let cursor = 0; let effects = []; let dirty = false;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(value) {
      const i = cursor++; if (!(i in slots)) slots[i] = value;
      return [slots[i], (v) => {
        const n = typeof v === 'function' ? v(slots[i]) : v;
        if (!Object.is(n, slots[i])) { slots[i] = n; dirty = true; }
      }];
    },
    useRef(value) { const i = cursor++; slots[i] ??= { current: value }; return slots[i]; },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useCallback(fn, deps) { return this.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const old = slots[i]; slots[i] = { deps };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  let nextId = 0;
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/hooks/useShoppingList.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, {
    exports: mod.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'expo-crypto') return { randomUUID: () => `test-${++nextId}` };
      if (name.includes('async-storage')) return storage;
      if (name.includes('services/shoppingList')) return {
        listSyncedShoppingListItems: sync.read ?? (async () => ({ data: [], error: null })),
        replaceSyncedShoppingListItems: sync.write ?? (async () => null),
      };
      if (name.includes('productNames')) return { productDisplayName: (p) => p.english_name };
      if (name.includes('shoppingFreezer')) return require('../../.tmp-tests/utils/shoppingFreezer.js');
      if (name.includes('shoppingListState')) return require('../../.tmp-tests/utils/shoppingListState.js');
      if (name.includes('shoppingListStorage')) return require('../../.tmp-tests/utils/shoppingListStorage.js');
      throw Error(name);
    },
  });
  return {
    async render(profileId = null) {
      let result;
      for (let i = 0; i < 30; i++) {
        dirty = false; cursor = 0; effects = [];
        result = mod.exports.default(profileId);
        effects.forEach((fn) => { fn(); });
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty && i >= 2) return result;
      }
      throw Error('Hook failed to settle');
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
};
