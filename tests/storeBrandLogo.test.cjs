const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getStoreBrandLogoKey,
} = require("../.tmp-tests/utils/storeBrandLogo.js");

test("store brand logo matching recognizes supported grocery brands", () => {
  assert.equal(
    getStoreBrandLogoKey({ brand: "T&T Supermarket", name: "Coquitlam" }),
    "tAndT",
  );
  assert.equal(
    getStoreBrandLogoKey({ brand: "H-Mart", name: "Downtown" }),
    "hMart",
  );
  assert.equal(
    getStoreBrandLogoKey({ brand: "Hannam Supermarket", name: "Burnaby" }),
    "hannamMart",
  );
  assert.equal(
    getStoreBrandLogoKey({ brand: "PriceSmart Foods", name: "Richmond" }),
    "priceSmart",
  );
  assert.equal(
    getStoreBrandLogoKey({ brand: "Market Ribbon", name: "Vancouver" }),
    "marketRibbon",
  );
});

test("store brand logo matching accepts T&T naming variants", () => {
  ["T&T", "T & T Supermarket", "TNT Supermarket"].forEach((brand) => {
    assert.equal(
      getStoreBrandLogoKey({ brand, name: "Vancouver" }),
      "tAndT",
    );
  });
});

test("store brand logo matching leaves unsupported stores on the fallback marker", () => {
  assert.equal(
    getStoreBrandLogoKey({ brand: "Independent Grocer", name: "Main Street" }),
    null,
  );
});
