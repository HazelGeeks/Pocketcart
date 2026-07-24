const test = require("node:test");
const assert = require("node:assert/strict");

const {
  chunkExpoReceiptIds,
  chunkExpoPushMessages,
  classifyExpoPushReceipts,
  classifyExpoPushTickets,
} = require("../.tmp-tests/supabase/functions/_shared/pushTickets.js");

function message(alertId, token) {
  return {
    to: token,
    title: "Sale started",
    body: "Milk is on sale.",
    data: { alertId, route: "alerts" },
  };
}

test("Expo ticket classification marks only accepted messages as sent", () => {
  assert.deepEqual(
    classifyExpoPushTickets(
      [message("alert-1", "token-a"), message("alert-1", "token-b")],
      [{ status: "ok", id: "ticket-a" }, { status: "ok", id: "ticket-b" }],
    ),
    {
      attempted: 2,
      sent: 2,
      successfulAlertIds: ["alert-1"],
      successfulTokens: ["token-a", "token-b"],
      failures: [],
      invalidTokens: [],
    },
  );
});

test("one successful device marks the alert sent while disabling an unregistered token", () => {
  assert.deepEqual(
    classifyExpoPushTickets(
      [message("alert-1", "stale-token"), message("alert-1", "live-token")],
      [
        {
          status: "error",
          message: "The device is not registered.",
          details: { error: "DeviceNotRegistered" },
        },
        { status: "ok", id: "ticket-live" },
      ],
    ),
    {
      attempted: 2,
      sent: 1,
      successfulAlertIds: ["alert-1"],
      successfulTokens: ["live-token"],
      failures: [{
        alertId: "alert-1",
        token: "stale-token",
        code: "DeviceNotRegistered",
        message: "DeviceNotRegistered: The device is not registered.",
      }],
      invalidTokens: ["stale-token"],
    },
  );
});

test("failed or missing tickets leave alerts eligible for retry", () => {
  const result = classifyExpoPushTickets(
    [message("alert-1", "token-a"), message("alert-2", "token-b")],
    [{
      status: "error",
      message: "Push credentials are invalid.",
      details: { error: "InvalidCredentials" },
    }],
  );

  assert.equal(result.sent, 0);
  assert.deepEqual(result.successfulAlertIds, []);
  assert.deepEqual(result.invalidTokens, []);
  assert.deepEqual(result.failures, [
    {
      alertId: "alert-1",
      token: "token-a",
      code: "InvalidCredentials",
      message: "InvalidCredentials: Push credentials are invalid.",
    },
    {
      alertId: "alert-2",
      token: "token-b",
      code: null,
      message: "Expo did not return a push ticket.",
    },
  ]);
});

test("an accepted ticket without a receipt id is not recorded as sent", () => {
  const result = classifyExpoPushTickets(
    [message("alert-1", "token-a")],
    [{ status: "ok" }],
  );

  assert.equal(result.sent, 0);
  assert.deepEqual(result.successfulAlertIds, []);
  assert.equal(result.failures[0].message, "Expo did not return a push receipt ticket id.");
});

test("Expo messages are split into API-safe batches of at most 100", () => {
  const messages = Array.from({ length: 205 }, (_, index) =>
    message(`alert-${index}`, `token-${index}`));

  assert.deepEqual(
    chunkExpoPushMessages(messages).map((batch) => batch.length),
    [100, 100, 5],
  );
  assert.deepEqual(
    chunkExpoPushMessages(messages, 500).map((batch) => batch.length),
    [100, 100, 5],
  );
});

test("Expo receipt ids are split into batches of at most 1000", () => {
  const ticketIds = Array.from({ length: 2001 }, (_, index) => `ticket-${index}`);
  assert.deepEqual(
    chunkExpoReceiptIds(ticketIds).map((batch) => batch.length),
    [1000, 1000, 1],
  );
});

test("Expo receipts distinguish delivery, provider failure, and not-yet-ready", () => {
  assert.deepEqual(
    classifyExpoPushReceipts(
      ["ticket-ok", "ticket-error", "ticket-pending"],
      {
        "ticket-ok": { status: "ok" },
        "ticket-error": {
          status: "error",
          message: "The device is not registered.",
          details: { error: "DeviceNotRegistered" },
        },
      },
    ),
    {
      deliveredTicketIds: ["ticket-ok"],
      failures: [{
        ticketId: "ticket-error",
        code: "DeviceNotRegistered",
        message: "DeviceNotRegistered: The device is not registered.",
      }],
      pendingTicketIds: ["ticket-pending"],
    },
  );
});
