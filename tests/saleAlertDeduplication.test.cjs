const test = require("node:test");
const assert = require("node:assert/strict");

const {
  dedupeSaleAlertPayloads,
} = require("../.tmp-tests/supabase/functions/_shared/saleAlertDeduplication.js");

test("scheduled alert payloads are unique by user and alert key", () => {
  const payloads = dedupeSaleAlertPayloads([
    {
      user_id: "user-1",
      alert_key: "product-1|session-1|store-1",
      watchlist_item_id: "watch-1",
    },
    {
      user_id: "user-1",
      alert_key: "product-1|session-1|store-1",
      watchlist_item_id: "watch-2",
    },
    {
      user_id: "user-2",
      alert_key: "product-1|session-1|store-1",
      watchlist_item_id: "watch-3",
    },
  ]);

  assert.deepEqual(
    payloads.map((payload) => payload.watchlist_item_id),
    ["watch-1", "watch-3"],
  );
});
