const test = require("node:test");
const assert = require("node:assert/strict");
const {
  notificationFormIssue,
  notificationLoadError,
} = require("../.tmp-tests/utils/notificationForm.js");
test("notification form explains missing retailer and Flyer date", () => {
  assert.match(notificationFormIssue(false, ""), /retailer/);
  assert.match(notificationFormIssue(true, ""), /start date/);
});
test("test input validity does not depend on audience or history loading", () => {
  assert.equal(notificationFormIssue(true, "2026-01-01"), null);
});
test("notification form rejects invalid and future dates", () => {
  assert.match(notificationFormIssue(true, "2026-02-30"), /valid/);
  assert.match(notificationFormIssue(true, "9999-01-01"), /future/);
  assert.match(notificationFormIssue(true, "bad"), /valid/);
});
test("missing backend functions produce setup guidance rather than a loading state", () => {
  assert.match(
    notificationLoadError({ code: "PGRST202", message: "Missing function" }),
    /setup is incomplete/,
  );
  assert.equal(notificationLoadError(null), null);
  assert.equal(notificationLoadError({ message: "Permission denied" }), "Permission denied");
});
