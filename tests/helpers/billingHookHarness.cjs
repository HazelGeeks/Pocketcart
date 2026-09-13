const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

exports.billingHookHarness = function billingHookHarness(service) {
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
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/hooks/useBilling.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, { exports: mod.exports, require(name) {
    if (name === 'react') return react;
    if (name === 'react-native') return {AppState:{addEventListener:()=>({remove(){}})}};
    if (name.includes('billingClient')) return service;
    throw Error(name);
  } });
  return {
    async render(options) {
      let result;
      for (let i = 0; i < 30; i++) {
        dirty = false; cursor = 0; effects = [];
        result = mod.exports.default(options);
        effects.forEach((fn) => { fn(); });
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty && i >= 2) return result;
      }
      throw Error('Hook failed to settle');
    },
    unmount() { for (const slot of slots) slot?.cleanup?.(); },
  };
};
