const test = require("node:test");
const assert = require("node:assert/strict");
const { sourceModule } = require("./helpers/sourceModule.cjs");

test("concurrent public reads share a request, expired values reload and errors are retried", async () => {
  let now = 0,
    calls = 0,
    release;
  const { requestCache } = sourceModule(
    "src/utils/requestCache.ts",
    {},
    { Date: { now: () => now } },
  );
  const cache = requestCache(60, 2);
  const read = () => {
    calls++;
    return new Promise((r) => {
      release = r;
    });
  };
  const a = cache("product", read),
    b = cache("product", read);
  assert.equal(calls, 1);
  release("price");
  assert.equal(await a, "price");
  assert.equal(await b, "price");
  assert.equal(await cache("product", read), "price");
  now = 60;
  const refreshed = cache("product", read);
  release("new price");
  assert.equal(await refreshed, "new price");
  assert.equal(calls, 2);
  await assert.rejects(
    cache("failed", async () => {
      throw new Error("offline");
    }),
    /offline/,
  );
  assert.equal(await cache("failed", async () => "recovered"), "recovered");
});

test("cache honors sale boundaries, bounds memory and avoids caching failed service results", async () => {
  let now = 0,
    calls = 0;
  const { requestCache } = sourceModule(
    "src/utils/requestCache.ts",
    {},
    { Date: { now: () => now } },
  );
  const cache = requestCache(60, 2);
  const read = async () => ++calls;
  assert.equal(
    await cache(
      "sale",
      read,
      () => true,
      () => 10,
    ),
    1,
  );
  now = 10;
  assert.equal(await cache("sale", read), 2);
  await cache("second", read);
  await cache("third", read);
  assert.equal(await cache("sale", read), 5);
  const failed = async () => ({ error: "unavailable", attempt: ++calls });
  assert.notEqual(
    (await cache("error", failed, (v) => !v.error)).attempt,
    (await cache("error", failed, (v) => !v.error)).attempt,
  );
});
