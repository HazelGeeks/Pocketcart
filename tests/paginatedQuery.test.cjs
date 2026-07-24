const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collectPagedRows,
} = require("../.tmp-tests/utils/paginatedQuery.js");

test("paginated query collects every page beyond the server row cap", async () => {
  const source = Array.from({ length: 2_505 }, (_, id) => ({ id }));
  const ranges = [];
  const result = await collectPagedRows(async (from, to) => {
    ranges.push([from, to]);
    return { data: source.slice(from, to + 1), error: null };
  }, 1000);

  assert.equal(result.error, null);
  assert.equal(result.data.length, 2_505);
  assert.deepEqual(result.data.at(-1), { id: 2_504 });
  assert.deepEqual(ranges, [[0, 999], [1000, 1999], [2000, 2999]]);
});

test("paginated query stops and discards partial data on an error", async () => {
  const result = await collectPagedRows(async (from) => {
    if (from === 0) return { data: [{ id: 1 }], error: null };
    return { data: null, error: "page failed" };
  }, 1);

  assert.deepEqual(result, { data: [], error: "page failed" });
});
