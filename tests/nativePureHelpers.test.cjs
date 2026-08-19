const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addShoppingListProduct,
  changeShoppingListQuantity,
  mergeShoppingListItems,
  mergeShoppingListItemSources,
  normalizeShoppingListItems,
  removeShoppingListProduct,
} = require("../.tmp-tests/utils/shoppingListState.js");
const {
  persistShoppingListMigration,
} = require("../.tmp-tests/utils/shoppingListStorage.js");
const {
  shouldHandleHomeDetailBack,
} = require("../.tmp-tests/utils/nativeBackNavigation.js");
const {
  normalizeProfilePreferences,
  profilePreferencesFromRow,
} = require("../.tmp-tests/utils/profilePreferenceNormalization.js");
const {
  isNewlyCreatedUser,
} = require("../.tmp-tests/utils/socialAuth.js");
const {
  normalizeStoredOnboardingState,
} = require("../.tmp-tests/utils/nativeOnboardingState.js");
const {
  settleLatestListResults,
} = require("../.tmp-tests/utils/asyncRequestResults.js");
const {
  isPushRegistrationReady,
} = require("../.tmp-tests/utils/pushRegistrationState.js");

test("shopping-list normalization rejects non-lists and malformed rows", () => {
  assert.deepEqual(normalizeShoppingListItems(null), []);
  assert.deepEqual(normalizeShoppingListItems({ productId: "milk" }), []);
  assert.deepEqual(normalizeShoppingListItems([
    null,
    { productId: "milk" },
    { name: "Milk" },
  ]), []);
});

test("shopping-list normalization preserves valid rows and clamps quantities", () => {
  assert.deepEqual(normalizeShoppingListItems([
    { productId: "milk", name: "Milk", unit: "1 L", quantity: 2.6 },
    { productId: "bread", name: "Bread", unit: 42, quantity: -3 },
    { productId: "eggs", name: "Eggs", quantity: 120 },
    { productId: "rice", name: "Rice", quantity: "4" },
  ]), [
    { productId: "milk", name: "Milk", unit: "1 L", quantity: 3 },
    { productId: "bread", name: "Bread", unit: null, quantity: 1 },
    { productId: "eggs", name: "Eggs", unit: null, quantity: 99 },
    { productId: "rice", name: "Rice", unit: null, quantity: 4 },
  ]);
});

test("shopping-list operations add, increment, cap, decrement, and remove items", () => {
  const milk = { id: "milk", name: "Milk", unit: "1 L" };
  const initial = addShoppingListProduct([], milk);
  assert.deepEqual(initial, [{ productId: "milk", name: "Milk", unit: "1 L", quantity: 1 }]);

  assert.equal(addShoppingListProduct(initial, milk)[0].quantity, 2);
  assert.equal(addShoppingListProduct([{ ...initial[0], quantity: 99 }], milk)[0].quantity, 99);
  assert.equal(changeShoppingListQuantity(initial, "milk", 4)[0].quantity, 5);
  assert.deepEqual(changeShoppingListQuantity(initial, "milk", -1), []);
  assert.deepEqual(removeShoppingListProduct(initial, "milk"), []);
});

test("shopping-list operations leave unrelated items intact", () => {
  const items = [
    { productId: "milk", name: "Milk", unit: null, quantity: 2 },
    { productId: "bread", name: "Bread", unit: null, quantity: 1 },
  ];

  assert.deepEqual(changeShoppingListQuantity(items, "missing", 1), items);
  assert.deepEqual(removeShoppingListProduct(items, "missing"), items);
});

test("shopping-list merge keeps remote items and guest quantities", () => {
  assert.deepEqual(mergeShoppingListItems(
    [
      { productId: "milk", name: "Fresh Milk", unit: "1 L", quantity: 3 },
      { productId: "eggs", name: "Eggs", unit: "12 pack", quantity: 1 },
    ],
    [
      { productId: "milk", name: "Milk", unit: null, quantity: 1 },
      { productId: "bread", name: "Bread", unit: null, quantity: 2 },
    ],
  ), [
    { productId: "milk", name: "Fresh Milk", unit: "1 L", quantity: 3 },
    { productId: "bread", name: "Bread", unit: null, quantity: 2 },
    { productId: "eggs", name: "Eggs", unit: "12 pack", quantity: 1 },
  ]);
});

test("shopping-list hydration keeps legacy, guest, in-memory, and account items", () => {
  const legacy = [{ productId: "legacy", name: "Legacy", unit: null, quantity: 1 }];
  const guest = [{ productId: "guest", name: "Guest", unit: "ea", quantity: 1 }];
  const inMemory = [{ productId: "guest", name: "Guest", unit: "ea", quantity: 3 }];
  const account = [{ productId: "account", name: "Account", unit: "lb", quantity: 1 }];

  assert.deepEqual(
    mergeShoppingListItemSources(legacy, guest, inMemory, account),
    [
      { productId: "account", name: "Account", unit: "lb", quantity: 1 },
      { productId: "guest", name: "Guest", unit: "ea", quantity: 3 },
      { productId: "legacy", name: "Legacy", unit: null, quantity: 1 },
    ],
  );
});

test("shopping-list migration writes v2 before removing v1", async () => {
  const operations = [];
  const items = [{ productId: "legacy", name: "Legacy", unit: null, quantity: 1 }];
  const storage = {
    async setItem(key, value) {
      operations.push(["set", key, value]);
    },
    async removeItem(key) {
      operations.push(["remove", key]);
    },
  };

  await persistShoppingListMigration(
    storage,
    "pc-shopping-list-v2.guest",
    "pc-shopping-list-v1",
    items,
  );

  assert.deepEqual(operations, [
    ["set", "pc-shopping-list-v2.guest", JSON.stringify(items)],
    ["remove", "pc-shopping-list-v1"],
  ]);
});

test("shopping-list migration retains v1 when the v2 write fails", async () => {
  let removed = false;
  const storage = {
    async setItem() {
      throw new Error("storage full");
    },
    async removeItem() {
      removed = true;
    },
  };

  await assert.rejects(
    persistShoppingListMigration(
      storage,
      "pc-shopping-list-v2.guest",
      "pc-shopping-list-v1",
      [],
    ),
    /storage full/,
  );
  assert.equal(removed, false);
});

test("cleared migrated shopping lists persist empty before v1 is removed", async () => {
  const legacyItem = { productId: "legacy", name: "Legacy", unit: null, quantity: 1 };
  const values = new Map([["pc-shopping-list-v1", JSON.stringify([legacyItem])]]);
  const storage = {
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };

  await persistShoppingListMigration(
    storage,
    "pc-shopping-list-v2.guest",
    "pc-shopping-list-v1",
    [],
  );

  assert.equal(values.get("pc-shopping-list-v2.guest"), "[]");
  assert.equal(values.has("pc-shopping-list-v1"), false);

  const remounted = mergeShoppingListItems(
    normalizeShoppingListItems(JSON.parse(values.get("pc-shopping-list-v2.guest"))),
    values.has("pc-shopping-list-v1") ? [legacyItem] : [],
  );
  assert.deepEqual(remounted, []);
});

test("home detail back handling is limited to the active home tab", () => {
  assert.equal(shouldHandleHomeDetailBack("home", "detail"), true);
  assert.equal(shouldHandleHomeDetailBack("shopping", "detail"), false);
  assert.equal(shouldHandleHomeDetailBack("more", "detail"), false);
  assert.equal(shouldHandleHomeDetailBack("home", "catalog"), false);
});

test("profile-preference normalization keeps only supported values", () => {
  assert.deepEqual(normalizeProfilePreferences({
    interestedCategories: ["Dairy", 3, "Bakery"],
    shoppingFrequency: "weekly",
    favoriteStores: ["Costco", null, "T&T"],
    completed: true,
  }), {
    interestedCategories: ["Dairy", "Bakery"],
    shoppingFrequency: "weekly",
    favoriteStores: ["Costco", "T&T"],
    completed: true,
  });

  assert.deepEqual(normalizeProfilePreferences({
    shoppingFrequency: "daily",
    completed: "yes",
  }), {
    interestedCategories: [],
    shoppingFrequency: null,
    favoriteStores: [],
    completed: false,
  });
});

test("profile-preference normalization supplies an empty safe default", () => {
  assert.deepEqual(normalizeProfilePreferences(undefined), {
    interestedCategories: [],
    shoppingFrequency: null,
    favoriteStores: [],
    completed: false,
  });
});

test("profile preference rows map database fields and completion status", () => {
  assert.deepEqual(profilePreferencesFromRow({
    interested_categories: ["Dairy", "Frozen"],
    shopping_frequency: "biweekly",
    favorite_stores: ["Costco"],
    completed_at: "2026-07-14T12:00:00.000Z",
  }), {
    interestedCategories: ["Dairy", "Frozen"],
    shoppingFrequency: "biweekly",
    favoriteStores: ["Costco"],
    completed: true,
  });
});

test("profile preference rows safely reject malformed database values", () => {
  assert.deepEqual(profilePreferencesFromRow({
    interested_categories: "Dairy",
    shopping_frequency: "daily",
    favorite_stores: ["Costco", 42],
    completed_at: "",
  }), {
    interestedCategories: [],
    shoppingFrequency: null,
    favoriteStores: ["Costco"],
    completed: false,
  });
});

test("social auth detects only sign-ins within the new-user window", () => {
  const createdAt = "2026-07-14T12:00:00.000Z";

  assert.equal(isNewlyCreatedUser(createdAt, "2026-07-14T12:00:09.999Z"), true);
  assert.equal(isNewlyCreatedUser(createdAt, "2026-07-14T11:59:50.001Z"), true);
  assert.equal(isNewlyCreatedUser(createdAt, "2026-07-14T12:00:10.000Z"), false);
  assert.equal(isNewlyCreatedUser(createdAt), false);
  assert.equal(isNewlyCreatedUser("invalid", createdAt), false);
});

test("onboarding normalization restores valid persisted choices", () => {
  assert.deepEqual(normalizeStoredOnboardingState({
    locationCompleted: true,
    locationMode: "share",
    postalCode: "V5K 0A1",
    locationLatitude: 49.28,
    locationLongitude: -123.12,
    alertsCompleted: true,
    alertsEnabled: true,
  }), {
    locationCompleted: true,
    locationMode: "share",
    postalCode: "V5K 0A1",
    locationLatitude: 49.28,
    locationLongitude: -123.12,
    alertsCompleted: true,
    alertsEnabled: true,
  });
});

test("onboarding normalization rejects corrupt modes and coordinates", () => {
  assert.deepEqual(normalizeStoredOnboardingState({
    locationMode: "nearby",
    postalCode: 12345,
    locationLatitude: Number.NaN,
    locationLongitude: "-123",
  }), {
    locationCompleted: false,
    locationMode: "skip",
    postalCode: null,
    locationLatitude: null,
    locationLongitude: null,
    alertsCompleted: false,
    alertsEnabled: false,
  });
});

test("latest list result settlement ignores stale async responses", () => {
  const stale = settleLatestListResults(3, 4, [
    { data: [{ id: "old" }], error: null },
  ]);

  assert.equal(stale, null);
});

test("latest list result settlement merges data and deduplicates useful errors", () => {
  const settled = settleLatestListResults(4, 4, [
    { data: [{ id: "a" }], error: "Network unavailable" },
    { data: [{ id: "b" }, { id: "c" }], error: " Network unavailable " },
    { data: [], error: "Price service timed out" },
    { data: [{ id: "d" }], error: null },
  ]);

  assert.deepEqual(settled, {
    data: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    message: "Network unavailable Price service timed out",
  });
});

test("latest list result settlement clears an old error after a clean response", () => {
  assert.deepEqual(settleLatestListResults(5, 5, [
    { data: [{ id: "fresh" }], error: null },
  ]), {
    data: [{ id: "fresh" }],
    message: null,
  });
});

test("push alerts require permission, a persisted registration, and a token", () => {
  assert.equal(isPushRegistrationReady({
    granted: true,
    registered: false,
    token: null,
  }), false);
  assert.equal(isPushRegistrationReady({
    granted: true,
    registered: false,
    token: "ExponentPushToken[unlinked]",
  }), false);
  assert.equal(isPushRegistrationReady({
    granted: false,
    registered: true,
    token: "ExponentPushToken[denied]",
  }), false);
  assert.equal(isPushRegistrationReady({
    granted: true,
    registered: true,
    token: "ExponentPushToken[ready]",
  }), true);
});
