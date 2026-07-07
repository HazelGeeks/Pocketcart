const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeFlyerAiRows,
} = require("../.tmp-tests/utils/flyerAiRows.js");

test("normalizeFlyerAiRows preserves crop metadata from imageBox", () => {
  const [row] = normalizeFlyerAiRows([
    {
      martName: "H Mart",
      regionBranch: "Downtown",
      saleStartDate: "2026-07-01",
      saleEndDate: "2026-07-07",
      name: "딸기",
      englishName: "Strawberry",
      mainCategory: "Produce",
      brand: "",
      price: "4.99",
      unit: "lb",
      memo: "",
      pageIndex: 2,
      sourceLabel: "Page 3",
      imageBox: {
        x: 12,
        y: 20,
        width: 30,
        height: 18,
        confidence: 86,
      },
    },
  ]);

  assert.equal(row.imageSelected, true);
  assert.equal(row.imageStatus, "candidate");
  assert.deepEqual(row.cropCandidate, {
    pageIndex: 2,
    x: 0.12,
    y: 0.2,
    width: 0.3,
    height: 0.18,
    confidence: 0.86,
    sourceLabel: "Page 3",
  });
});

test("normalizeFlyerAiRows keeps rows without crop candidates", () => {
  const [row] = normalizeFlyerAiRows([
    {
      name: "Milk",
      price: "3.99",
      imageBox: null,
    },
  ]);

  assert.equal(row.imageSelected, false);
  assert.equal(row.imageStatus, "none");
  assert.equal(row.cropCandidate, null);
});
