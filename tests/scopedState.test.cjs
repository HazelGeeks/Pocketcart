const test = require("node:test");
const assert = require("node:assert/strict");
const { hookHarness } = require("./helpers/hookHarness.cjs");
const { sourceModule } = require("./helpers/sourceModule.cjs");

test("scoped state preserves local edits, resets context, and rejects old completions", async () => {
  const harness = hookHarness(react => {
    const useScopedState = sourceModule("src/hooks/useScopedState.ts", { react }).default;
    return scope => useScopedState(scope, 1);
  });
  let [value, setPage] = await harness.render("account-a:filter-a");
  assert.equal(value, 1);
  setPage(4);
  let result = await harness.render("account-a:filter-a");
  assert.equal(result[0], 4);
  assert.equal(result[1], setPage);
  result[1](previous => previous + 1);
  assert.equal((await harness.render("account-a:filter-a"))[0], 5);
  assert.equal((await harness.render("account-a:filter-b"))[0], 1);
  setPage(99);
  assert.equal((await harness.render("account-a:filter-b"))[0], 1);
  assert.equal((await harness.render("account-a:filter-a"))[0], 1);
  // Returning to the same key must not revive work from its previous visit.
  setPage(88);
  assert.equal((await harness.render("account-a:filter-a"))[0], 1);
  harness.unmount();
});

test("alert product ignores old tab requests and late unmounted responses", async () => {
  const pending = [];
  const opened = [];
  const messages = [];
  const open = product => opened.push(product.id);
  const toast = message => messages.push(message);
  const harness = hookHarness(react => {
    const hook = sourceModule("src/hooks/useNativeAlertProduct.ts", {
      react,
      "../services/marketData": { listProducts: () => new Promise(resolve => pending.push(resolve)) },
    }).default;
    return tab => hook(tab, open, toast);
  });
  const first = await harness.render("alerts");
  const oldRequest = first("milk");
  const second = await harness.render("home");
  pending.shift()({ data: [{ id: "milk" }] });
  await oldRequest;
  await first("stale-callback");
  assert.equal(pending.length, 0);
  assert.deepEqual(opened, []);
  const good = second("apple");
  pending.shift()({ data: [{ id: "apple" }] });
  await good;
  assert.deepEqual(opened, ["apple"]);
  const late = second("late");
  harness.unmount();
  pending.shift()({ data: [{ id: "late" }] });
  await late;
  assert.deepEqual(opened, ["apple"]);
  assert.deepEqual(messages, []);
});

test("freezer reminders refresh on family changes and clean up prior listeners", async () => {
  let family = { ready: true, family: { id: "family-a" } };
  const refreshes = [];
  let removals = 0;
  const listener = () => ({ remove() { removals++; } });
  const open = () => {};
  const harness = hookHarness(react => {
    const hook = sourceModule("src/hooks/useFreezerReminders.ts", {
      react,
      "../contexts/FamilyContext": { useFamily: () => family },
      "react-native": { Platform: { OS: "ios" }, AppState: { addEventListener: listener } },
      "expo-notifications": { addNotificationResponseReceivedListener: listener,
        getLastNotificationResponseAsync: async () => null },
      "../services/freezerNotifications": { setFreezerReminderUser: async () => {},
        refreshFreezerReminders: async user => refreshes.push(user) },
    }).default;
    return () => hook("alice", open);
  });
  await harness.render();
  assert.deepEqual(refreshes, ["alice"]);
  family = { ready: true, family: { id: "family-a" } };
  await harness.render();
  assert.equal(refreshes.length, 1);
  family = { ready: true, family: { id: "family-b" } };
  await harness.render();
  assert.equal(refreshes.length, 2);
  assert.equal(removals, 2);
  harness.unmount();
  assert.equal(removals, 4);
});
