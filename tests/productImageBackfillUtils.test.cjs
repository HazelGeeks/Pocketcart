const test = require("node:test");
const assert = require("node:assert/strict");

const utilsPromise = import("../scripts/product-image-backfill-utils.mjs");

test("image backfill prefers an English catalog search name", async () => {
  const { preferredSearchName } = await utilsPromise;

  assert.equal(
    preferredSearchName({
      english_name: "Green Grapes",
      korean_name: "청포도",
      name: "legacy name",
    }),
    "Green Grapes",
  );
});

test("image backfill title matching tolerates plural catalog wording", async () => {
  const { titleScore } = await utilsPromise;

  assert.ok(titleScore("Green Grape Seedless", "Seedless Green Grapes") >= 0.92);
  assert.equal(titleScore("Green Grapes", "Red Apples"), 0);
});

test("image backfill requires the package size to match", async () => {
  const { packageMatches } = await utilsPromise;

  assert.equal(packageMatches("2 x 500 g", "Brand Rice 2 x 500 g"), true);
  assert.equal(packageMatches("500 g", "Brand Rice 1 kg"), false);
});

test("image backfill extracts official titles and unique catalog products", async () => {
  const { extractCatalogCandidates, extractOfficialTitle } = await utilsPromise;
  const html = [
    '<h2 data-testid="pdpInfoTitle-h2-testId">Green &amp; Seedless Grapes</h2>',
    '<a href="/product/green-seedless-grapes-id-123456">First</a>',
    '<a href="/product/green-seedless-grapes-id-123456">Duplicate</a>',
    '<a href="/product/red-seedless-grapes-id-654321">Second</a>',
  ].join("");

  assert.equal(extractOfficialTitle(html), "Green & Seedless Grapes");
  assert.deepEqual(
    extractCatalogCandidates(html).map((candidate) => candidate.productNumber),
    ["123456", "654321"],
  );
});
