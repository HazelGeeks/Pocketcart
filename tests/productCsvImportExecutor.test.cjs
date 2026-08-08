const test = require("node:test");
const assert = require("node:assert/strict");

const {
  executeProductCsvImport,
} = require("../.tmp-tests/utils/productCsvImportExecutor.js");
const {
  productCsvImportReportToCsv,
} = require("../.tmp-tests/utils/productCsvImportReport.js");

function row(rowNumber, productAction, overrides = {}) {
  return {
    rowNumber,
    productAction,
    productKey: "eggs|12 ct|dairy",
    candidateProductIds: [],
    input: {
      koreanName: "달걀",
      englishName: "Eggs",
      category: "Dairy",
      unit: "12 ct",
      thumbnailUrl: "",
    },
    reviewPayload: {},
    price: { status: "missing", normalizedPrice: "", storeIds: [] },
    ...overrides,
  };
}

test("confirmed import creates one planned product, reuses it, queues reviews, and reports every row", async () => {
  const calls = { products: 0, reviews: 0, prices: [], audits: 0 };
  const rows = [
    row(2, "create", {
      price: {
        status: "ready",
        normalizedPrice: "6.99",
        observedAt: "2026-08-01T07:00:00.000Z",
        periodEnd: "2026-08-08T06:59:59.999Z",
        storeIds: ["store-1"],
      },
    }),
    row(3, "reuse_planned", {
      price: {
        status: "ready",
        normalizedPrice: "7.49",
        observedAt: "2026-08-08T07:00:00.000Z",
        periodEnd: "2026-08-15T06:59:59.999Z",
        storeIds: ["store-1"],
      },
    }),
    row(4, "review", { reviewReason: "ambiguous_product_match" }),
    row(5, "invalid", { message: "Missing name" }),
  ];
  const preview = {
    fileName: "products.csv",
    rows,
    summary: {
      totalRows: 4,
      productsToCreate: 1,
      existingMatches: 0,
      rowsForReview: 1,
      invalidRows: 1,
      priceEntriesToImport: 2,
      pricesMissing: 2,
      pricesSkipped: 0,
    },
  };
  const report = await executeProductCsvImport({
    preview,
    mutations: {
      createProduct: { mutateAsync: async () => {
        calls.products += 1;
        return { id: "created-1", english_name: "Eggs", korean_name: "달걀" };
      } },
      createReview: { mutateAsync: async () => { calls.reviews += 1; return null; } },
      createPrice: { mutateAsync: async (params) => { calls.prices.push(params); return null; } },
      createAuditLog: { mutateAsync: async () => { calls.audits += 1; return null; } },
    },
  });

  assert.equal(calls.products, 1);
  assert.equal(calls.reviews, 1);
  assert.equal(calls.prices.length, 2);
  assert.ok(calls.prices.every((price) => price.productId === "created-1"));
  assert.equal(calls.audits, 1);
  assert.equal(report.importedPrices, 2);
  assert.equal(report.rows.length, 4);
  assert.match(productCsvImportReportToCsv(report), /Held for review/);
});
