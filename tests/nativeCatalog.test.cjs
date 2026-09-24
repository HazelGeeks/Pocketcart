const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { hookHarness } = require("./helpers/hookHarness.cjs");
const product = { id: "milk", category: "Dairy" };
const emptyDetails = { data: { history: [], storePrices: [] }, error: null };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
function catalogHarness(service = {}) {
  const options = {
    profileId: "alice",
    activeTab: "home",
    favoriteStoreIds: [],
    horizontalPad: 16,
    width: 390,
    onOpenHome() {},
    showToast() {},
  };
  const filter = { ready: true, value: null, change() {} };
  const harness = hookHarness((react) => {
    const exports = {};
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync("src/hooks/useNativeCatalog.ts", "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      {
        exports,
        setTimeout,
        clearTimeout,
        require(name) {
          if (name === "react") return react;
          if (name.endsWith("useCatalogStoreFilter"))
            return { useCatalogStoreFilter: () => filter };
          if (name.endsWith("nativeAppData"))
            return { buildPriceChart: () => null, buildPreviousPriceRows: () => [] };
          if (name.endsWith("marketData"))
            return {
              listProducts: async () => ({ data: [product], error: null }),
              listProductPriceDetails: async () => emptyDetails,
              ...service,
            };
          throw Error(name);
        },
      },
    );
    return exports.default;
  });
  return { ...harness, options, render: () => harness.render(options) };
}
test("catalog request exceptions stop loading and allow recovery on the next visit", async (t) => {
  let fail = true;
  const h = catalogHarness({
    listProducts: async () => {
      if (fail) throw Error("Offline");
      return { data: [product], error: null };
    },
  });
  t.after(h.unmount);
  let state = await h.render();
  assert.equal(state.loading, false);
  assert.match(state.message, /couldn't be loaded/);
  h.options.activeTab = "cart";
  await h.render();
  fail = false;
  h.options.activeTab = "home";
  state = await h.render();
  assert.equal(state.message, null);
  assert.equal(state.filteredProducts[0].id, "milk");
});
test("late catalog failure cannot overwrite a newer account result", async (t) => {
  const old = deferred();
  let calls = 0;
  const h = catalogHarness({
    listProducts: () =>
      ++calls === 1 ? old.promise : Promise.resolve({ data: [product], error: null }),
  });
  t.after(h.unmount);
  await h.render();
  h.options.profileId = "bob";
  await h.render();
  old.reject(Error("Old account request failed"));
  const state = await h.render();
  assert.equal(state.message, null);
  assert.equal(state.loading, false);
  assert.equal(state.filteredProducts[0].id, "milk");
});
test("price failures clear previous prices and stop both spinners", async (t) => {
  let fail = false;
  const h = catalogHarness({
    listProductPriceDetails: async () => {
      if (fail) throw Error("Offline");
      return { data: { history: [], storePrices: [{ id: "old-store" }] }, error: null };
    },
  });
  t.after(h.unmount);
  let state = await h.render();
  state.openProduct(product);
  state = await h.render();
  assert.equal(state.storePrices.length, 1);
  fail = true;
  state.openProduct({ ...product, id: "bread" });
  state = await h.render();
  assert.equal(state.storePrices.length, 0);
  assert.equal(state.historyLoading, false);
  assert.equal(state.storePricesLoading, false);
  assert.match(state.historyMessage, /reopen this product/);
});
test("leaving product details ignores late success and failure responses", async (t) => {
  for (const fail of [false, true]) {
    const pending = deferred();
    const h = catalogHarness({ listProductPriceDetails: () => pending.promise });
    t.after(h.unmount);
    let state = await h.render();
    state.openProduct(product);
    await h.render();
    h.options.activeTab = "cart";
    await h.render();
    if (fail) pending.reject(Error("Late failure"));
    else pending.resolve({ data: { history: [], storePrices: [{ id: "stale" }] }, error: null });
    state = await h.render();
    assert.equal(state.historyMessage, null);
    assert.equal(state.storePrices.length, 0);
  }
});
