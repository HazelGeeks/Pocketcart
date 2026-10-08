const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getStoreBrandLogoKey,
  getStoreLogoBackground,
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

test("map logos recognize newly registered chains and branch-name variants", () => {
  for (const brand of ["Safeway", "SAFEWAY", "Safeway Canada", "Safe Way"]) {
    assert.equal(getStoreBrandLogoKey({ brand, name: "Burnaby" }), "safeway");
  }
  for (const brand of ["Real Canadian Superstore", "real canadian superstore", "Superstore"]) {
    assert.equal(getStoreBrandLogoKey({ brand, name: "Metrotown" }), "realCanadianSuperstore");
  }
  assert.equal(getStoreBrandLogoKey({ brand: null, name: "Safeway - Robson" }), "safeway");
  assert.equal(getStoreBrandLogoKey({ brand: null, name: "Real Canadian Superstore - Grandview" }), "realCanadianSuperstore");
  assert.equal(getStoreLogoBackground({ brand: "Safeway", name: "Burnaby" }), "#FFFFFF");
  assert.equal(getStoreLogoBackground({ brand: "Real Canadian Superstore", name: "Metrotown" }), "#005AA8");
  assert.equal(getStoreBrandLogoKey({ brand: "Atlantic Superstore", name: "Halifax" }), null);
});
