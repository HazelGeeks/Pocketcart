const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

exports.mapHookHarness = function mapHookHarness(service) {
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
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path);
    const mod = { exports: {} };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, {
      exports: mod.exports, setTimeout, clearTimeout, Error,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { Keyboard: { dismiss() {} } };
        if (name.endsWith('/marketData')) return { listStores: service.listStores };
        if (name.endsWith('/mapLocationSearch')) return { searchMapLocations: service.search };
        if (name === './useMapLocationSearch') return load('src/hooks/useMapLocationSearch.ts');
        if (name.endsWith('/shared')) return load('src/services/marketData/shared.ts');
        if (name.includes('productCategory')) return { canonicalProductCategory: (x) => x };
        if (name.includes('productNames')) return { productNameSearchText: () => '' };
        if (name.includes('nativeAppData')) return { DEFAULT_REGION: { latitude: 49, longitude: -123 } };
        if (name.includes('storeDistanceScope')) return require('../../.tmp-tests/utils/storeDistanceScope.js');
        throw Error(name);
      },
    });
    cache.set(path, mod.exports);
    return mod.exports;
  }
  const mod = load('src/hooks/useNativeStoreMap.ts');
  return {
    async render(options) {
      let result;
      for (let i = 0; i < 30; i++) {
        dirty = false; cursor = 0; effects = [];
        result = mod.default(options);
        effects.forEach((fn) => { fn(); });
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty && i >= 2) return result;
      }
      throw Error('Hook failed to settle');
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
};
