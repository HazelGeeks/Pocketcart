const test = require("node:test");
const assert = require("node:assert/strict");

const {
  adminDirectoryUserFromRow,
  filterAdminDirectoryUsers,
  shoppingFrequencyLabel,
  summarizeAdminDirectoryUsers,
} = require("../.tmp-tests/utils/adminUserDirectory.js");

function user(overrides = {}) {
  return {
    id: "user-1",
    email: "shopper@example.com",
    full_name: "Pocket Shopper",
    created_at: "2026-07-20T12:00:00.000Z",
    last_sign_in_at: null,
    email_confirmed_at: null,
    is_admin: false,
    preferences_completed: false,
    shopping_frequency: null,
    interested_categories: [],
    favorite_stores: [],
    watchlist_count: 0,
    shopping_list_count: 0,
    sale_alert_count: 0,
    active_push_token_count: 0,
    ...overrides,
  };
}

test("adminDirectoryUserFromRow normalizes RPC values safely", () => {
  const result = adminDirectoryUserFromRow({
    id: " user-1 ",
    email: " shopper@example.com ",
    created_at: "2026-07-20T12:00:00.000Z",
    is_admin: true,
    preferences_completed: true,
    interested_categories: [" Produce ", null, ""],
    favorite_stores: ["Safeway"],
    watchlist_count: "4",
    shopping_list_count: -2,
    sale_alert_count: "invalid",
    active_push_token_count: 1.9,
  });

  assert.equal(result.id, "user-1");
  assert.equal(result.email, "shopper@example.com");
  assert.deepEqual(result.interested_categories, ["Produce"]);
  assert.equal(result.watchlist_count, 4);
  assert.equal(result.shopping_list_count, 0);
  assert.equal(result.sale_alert_count, 0);
  assert.equal(result.active_push_token_count, 1);
});

test("adminDirectoryUserFromRow rejects rows without identity or creation date", () => {
  assert.equal(adminDirectoryUserFromRow({ created_at: "2026-07-20" }), null);
  assert.equal(adminDirectoryUserFromRow({ id: "user-1" }), null);
});

test("filterAdminDirectoryUsers combines search, role, and profile filters", () => {
  const users = [
    user({
      id: "admin-1",
      email: "admin@example.com",
      is_admin: true,
      preferences_completed: true,
      favorite_stores: ["T&T"],
    }),
    user({
      id: "customer-1",
      email: "customer@example.com",
      interested_categories: ["Bakery"],
    }),
  ];

  assert.deepEqual(
    filterAdminDirectoryUsers(users, "t&t", "admin", "complete").map(
      (item) => item.id,
    ),
    ["admin-1"],
  );
  assert.deepEqual(
    filterAdminDirectoryUsers(users, "bakery", "customer", "incomplete").map(
      (item) => item.id,
    ),
    ["customer-1"],
  );
});

test("directory summary counts accounts, roles, profiles, and push-enabled users", () => {
  const summary = summarizeAdminDirectoryUsers([
    user({ is_admin: true, preferences_completed: true, active_push_token_count: 2 }),
    user({ id: "user-2", active_push_token_count: 1 }),
    user({ id: "user-3" }),
  ]);

  assert.deepEqual(summary, {
    total: 3,
    admins: 1,
    completedProfiles: 1,
    pushEnabled: 2,
  });
  assert.equal(shoppingFrequencyLabel("multiple_weekly"), "Several times a week");
  assert.equal(shoppingFrequencyLabel(null), "Not provided");
});
