const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findMatchingProduct,
  gtinValidationMessage,
  isValidGtin,
  normalizeGtin,
  productIdentityKey,
  resolveProductMatch,
} = require("../.tmp-tests/utils/productIdentity.js");

test("productIdentityKey normalizes the English-first name, unit, and category", () => {
  assert.equal(
    productIdentityKey({ koreanName: "딸기", englishName: "  Fresh   Strawberry ", unit: " 1LB ", category: " Produce " }),
    productIdentityKey({ koreanName: "딸기", englishName: "fresh strawberry", unit: "1lb", category: "produce" }),
  );
});

test("findMatchingProduct matches same product identity but keeps different units separate", () => {
  const products = [
    { id: "strawberry-1lb", korean_name: "딸기", english_name: "Strawberry", unit: "1lb", category: "Produce" },
    { id: "strawberry-2lb", korean_name: "딸기", english_name: "Strawberry", unit: "2lb", category: "Produce" },
  ];

  assert.equal(
    findMatchingProduct(products, { koreanName: "딸기", englishName: " strawberry ", unit: "1LB", category: "produce" }).id,
    "strawberry-1lb",
  );
  assert.equal(
    findMatchingProduct(products, { koreanName: "딸기", englishName: "Strawberry", unit: "500g", category: "Produce" }),
    null,
  );
});

test("resolveProductMatch gives product_id priority over changing CSV text", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "기존 이름",
      english_name: "Original Name",
      brand: "Brand A",
      gtin: null,
      unit: "500 g",
      category: "Pantry",
    },
  ];

  const result = resolveProductMatch(products, {
    productId: "PRODUCT-1",
    koreanName: "업데이트 이름",
    englishName: "Updated Name",
    brand: "Brand B",
    unit: "0.5 kg",
    category: "Specials",
  });

  assert.equal(result.status, "matched");
  assert.equal(result.method, "product_id");
  assert.equal(result.product.id, "product-1");
});

test("resolveProductMatch normalizes UPC and GTIN punctuation", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "탄산수",
      english_name: "Sparkling Water",
      brand: "Clear",
      gtin: "0 12345-67890 5",
      unit: "12 pack",
      category: "Beverages",
    },
  ];

  assert.equal(normalizeGtin("0 12345-67890 5"), "012345678905");
  const result = resolveProductMatch(products, {
    koreanName: "완전히 다른 전단 이름",
    gtin: "012345678905",
    unit: "12 pack",
    category: "Drinks",
  });
  assert.equal(result.status, "matched");
  assert.equal(result.method, "gtin");
});

test("GTIN validation rejects unsupported lengths and bad check digits", () => {
  assert.equal(isValidGtin("0 12345-67890 5"), true);
  assert.equal(gtinValidationMessage("123"), "GTIN must contain 8, 12, 13, or 14 digits.");
  assert.equal(gtinValidationMessage("012345678904"), "GTIN check digit is invalid.");
  assert.equal(gtinValidationMessage("ABC-012345678905"), "GTIN can contain only digits, spaces, and hyphens.");
});

test("resolveProductMatch does not trust a malformed stored barcode", () => {
  const result = resolveProductMatch([
    {
      id: "product-1",
      korean_name: "저장 상품",
      brand: "Brand",
      gtin: "OCR-012345678905",
      unit: "1 ea",
      category: "Pantry",
    },
  ], {
    koreanName: "다른 상품",
    gtin: "012345678905",
    unit: "2 ea",
    category: "Other",
  });

  assert.equal(result.status, "not_found");
  assert.equal(result.reason, "gtin_not_found");
});

test("resolveProductMatch accepts one canonical name and unit match across category changes", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "코카콜라 오리지널",
      english_name: "Coca-Cola Original",
      brand: "Coca-Cola",
      gtin: null,
      unit: "2 L",
      category: "Beverages",
    },
  ];

  const result = resolveProductMatch(products, {
    koreanName: "코카콜라 오리지널",
    englishName: "Coca Cola Original",
    brand: "Coca Cola",
    unit: "2L",
    category: "Soft Drinks",
  });
  assert.equal(result.status, "matched");
  assert.equal(result.method, "canonical_identity");
});

test("canonical identity keeps accented and CJK product names", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "크렘 프레슈",
      english_name: "Fresh Cream",
      brand: "Québec Lait",
      gtin: null,
      unit: "250 mL",
      category: "Dairy",
    },
    {
      id: "product-2",
      korean_name: "上海青",
      english_name: "Bok Choy",
      brand: null,
      gtin: null,
      unit: "1 lb",
      category: "Produce",
    },
  ];

  assert.equal(
    resolveProductMatch(products, {
      koreanName: "크렘 프레슈",
      englishName: "Crème-fraîche",
      brand: "Québec Lait",
      unit: "250ml",
      category: "Special",
    }).status,
    "matched",
  );
  assert.equal(
    resolveProductMatch(products, {
      koreanName: "上海青",
      unit: "1lb",
      category: "Vegetables",
    }).status,
    "matched",
  );
});

test("resolveProductMatch refuses ambiguous text candidates", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "사과 주스",
      english_name: "Apple Juice",
      brand: null,
      gtin: null,
      unit: "1 L",
      category: "Juice",
    },
    {
      id: "product-2",
      korean_name: "사과 주스",
      english_name: "Apple Juice",
      brand: null,
      gtin: null,
      unit: "1L",
      category: "Drinks",
    },
  ];

  const result = resolveProductMatch(products, {
    koreanName: "사과 주스",
    englishName: "Apple Juice",
    unit: "1L",
    category: "Specials",
  });
  assert.equal(result.status, "ambiguous");
  assert.equal(result.candidateCount, 2);
  assert.deepEqual(result.candidateIds, ["product-1", "product-2"]);
});

test("resolveProductMatch sends a small same-unit name variation to review", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "딸기 요거트",
      english_name: "Strawberry Yogurt",
      brand: "Dairy Best",
      gtin: null,
      unit: "650 g",
      category: "Dairy",
    },
  ];

  const result = resolveProductMatch(products, {
    koreanName: "",
    englishName: "Strawbery Yogurt",
    brand: "Dairy Best",
    unit: "650g",
    category: "Weekly Sale",
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.method, "near_identity");
  assert.deepEqual(result.candidateIds, ["product-1"]);
});

test("resolveProductMatch does not flag a near name when the unit differs", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "딸기 요거트",
      english_name: "Strawberry Yogurt",
      brand: null,
      gtin: null,
      unit: "650 g",
      category: "Dairy",
    },
  ];

  const result = resolveProductMatch(products, {
    koreanName: "딸기 요거트",
    englishName: "Strawbery Yogurt",
    unit: "1 kg",
    category: "Weekly Sale",
  });

  assert.equal(result.status, "not_found");
});

test("resolveProductMatch does not merge two known, different brands", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "사과 주스",
      english_name: "Apple Juice",
      brand: "Brand A",
      gtin: null,
      unit: "1L",
      category: "Juice",
    },
  ];

  const result = resolveProductMatch(products, {
    koreanName: "사과 주스",
    englishName: "Apple Juice",
    brand: "Brand B",
    unit: "1L",
    category: "Juice",
  });
  assert.equal(result.status, "not_found");
  assert.equal(result.reason, "no_match");
});

test("resolveProductMatch does not fall back when an explicit product_id is stale", () => {
  const products = [
    {
      id: "product-1",
      korean_name: "우유",
      english_name: "Milk",
      brand: null,
      gtin: null,
      unit: "2L",
      category: "Dairy",
    },
  ];

  const result = resolveProductMatch(products, {
    productId: "missing-id",
    koreanName: "우유",
    englishName: "Milk",
    unit: "2L",
    category: "Dairy",
  });
  assert.equal(result.status, "not_found");
  assert.equal(result.reason, "product_id_not_found");
});
