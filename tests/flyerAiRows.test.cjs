const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeFlyerAiRows,
} = require("../.tmp-tests/utils/flyerAiRows.js");

test("normalizeFlyerAiRows ignores legacy image metadata for text-only extraction", () => {
  const [row] = normalizeFlyerAiRows([
    {
      martName: "H Mart",
      regionBranch: "Downtown",
      saleStartDate: "2026-07-01",
      saleEndDate: "2026-07-07",
      englishName: "Strawberry",
      koreanName: "딸기",
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

  assert.equal(row.imageSelected, false);
  assert.equal(row.englishName, "Strawberry");
  assert.equal(row.koreanName, "딸기");
  assert.equal(row.imageStatus, "none");
  assert.equal(row.cropCandidate, null);
  assert.equal(row.thumbnailUrl, "");
  assert.equal(row.imagePreviewUrl, "");
});

test("normalizeFlyerAiRows keeps rows without crop candidates", () => {
  const [row] = normalizeFlyerAiRows([
    {
      englishName: "Milk",
      koreanName: "우유",
      price: "3.99",
      imageBox: null,
    },
  ]);

  assert.equal(row.imageSelected, false);
  assert.equal(row.imageStatus, "none");
  assert.equal(row.cropCandidate, null);
});
