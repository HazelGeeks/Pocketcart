// Minimal hook scheduler for deterministic state, effect cleanup, and async race tests.
exports.hookHarness = function hookHarness(createHook) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let dirty = false;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(value) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = value;
      return [
        slots[i],
        (v) => {
          const n = typeof v === "function" ? v(slots[i]) : v;
          if (!Object.is(n, slots[i])) {
            slots[i] = n;
            dirty = true;
          }
        },
      ];
    },
    useRef(value) {
      const i = cursor++;
      slots[i] ??= { current: value };
      return slots[i];
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: fn() };
      return slots[i].value;
    },
    useCallback(fn, deps) {
      return react.useMemo(() => fn, deps);
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const old = slots[i];
        slots[i] = { deps };
        effects.push(() => {
          old?.cleanup?.();
          slots[i].cleanup = fn();
        });
      }
    },
  };
  const renderHook = createHook(react);
  return {
    async render(options) {
      let result;
      for (let i = 0; i < 30; i++) {
        dirty = false;
        cursor = 0;
        effects = [];
        result = renderHook(options);
        effects.forEach((fn) => {
          fn();
        });
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty && i >= 2) return result;
      }
      throw Error("Hook failed to settle");
    },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
};
