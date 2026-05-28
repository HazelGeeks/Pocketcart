const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPath,
  locationToRoute,
} = require("../.tmp-tests/routing/routeState.js");

test("locationToRoute resolves core routes", () => {
  assert.deepEqual(locationToRoute("/", ""), {
    route: "home",
    blogSlug: null,
  });
  assert.deepEqual(locationToRoute("/blog", ""), {
    route: "blog",
    blogSlug: null,
  });
  assert.deepEqual(locationToRoute("/privacy", ""), {
    route: "privacy",
    blogSlug: null,
  });
  assert.deepEqual(locationToRoute("/terms", ""), {
    route: "terms",
    blogSlug: null,
  });
  assert.deepEqual(locationToRoute("/delete-account", ""), {
    route: "delete-account",
    blogSlug: null,
  });
  assert.deepEqual(locationToRoute("/admin", ""), {
    route: "admin",
    blogSlug: null,
  });
});

test("locationToRoute resolves blog slug and fallback hash routing", () => {
  assert.deepEqual(locationToRoute("/blog/weekly-deals", ""), {
    route: "blog",
    blogSlug: "weekly-deals",
  });
  assert.deepEqual(locationToRoute("/unknown", "#/unknown"), {
    route: "home",
    blogSlug: null,
  });
});

test("buildPath creates expected URLs", () => {
  assert.equal(buildPath("home"), "/");
  assert.equal(buildPath("privacy"), "/privacy");
  assert.equal(buildPath("delete-account"), "/delete-account");
  assert.equal(buildPath("admin"), "/admin");
  assert.equal(buildPath("blog", "price drops"), "/blog/price%20drops");
});
