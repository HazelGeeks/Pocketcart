import type { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2";
import {
  chunkExpoReceiptIds,
  chunkExpoPushMessages,
  classifyExpoPushReceipts,
  classifyExpoPushTickets,
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from "./pushTickets.ts";

type AdminClient = ReturnType<typeof createClient>;

export type PushAlertRecord = {
  id: string;
  user_id: string;
  title: string;
  body: string;
};

export type PushTokenRecord = {
  id: string;
  user_id: string;
  token: string;
};

type PushDeliveryTicketRow = {
  id: string;
  expo_ticket_id: string;
  token: string;
  created_at: string;
};

export type PushDeliveryResult = {
  attempted: number;
  sent: number;
  failed: number;
  alerts: number;
  receiptsQueued: number;
  tickets: ExpoPushTicket[];
};

export type ReceiptSyncResult = {
  checked: number;
  delivered: number;
  failed: number;
  expired: number;
  pending: number;
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function pushMessages(
  alerts: PushAlertRecord[],
  tokens: PushTokenRecord[],
): ExpoPushMessage[] {
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokens) {
    const userTokens = tokensByUser.get(row.user_id) ?? [];
    userTokens.push(row.token);
    tokensByUser.set(row.user_id, userTokens);
  }

  return alerts.flatMap((alert) =>
    (tokensByUser.get(alert.user_id) ?? []).map((token) => ({
      to: token,
      sound: "default",
      title: alert.title,
      body: alert.body,
      data: {
        alertId: alert.id,
        route: "alerts",
      },
    })),
  );
}

async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const tickets: ExpoPushTicket[] = [];
  for (const batch of chunkExpoPushMessages(messages)) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(batch),
      });
      const payload = await response.json().catch(() => ({})) as {
        data?: ExpoPushTicket[];
        errors?: Array<{ code?: string; message?: string }>;
      };
      if (!response.ok) {
        const requestError = payload.errors?.[0];
        const message = requestError?.message ?? `Expo push failed with ${response.status}.`;
        tickets.push(...batch.map(() => ({
          status: "error",
          message,
          details: requestError?.code ? { error: requestError.code } : undefined,
        })));
        continue;
      }
      tickets.push(...(Array.isArray(payload.data) ? payload.data : []));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Expo push request failed.";
      tickets.push(...batch.map(() => ({ status: "error", message })));
    }
  }
  return tickets;
}

async function storeDeliveryTickets(
  adminClient: AdminClient,
  alerts: PushAlertRecord[],
  tokens: PushTokenRecord[],
  messages: ExpoPushMessage[],
  tickets: ExpoPushTicket[],
): Promise<number> {
  const alertUserById = new Map(alerts.map((alert) => [alert.id, alert.user_id]));
  const tokenByUserAndValue = new Map(
    tokens.map((row) => [`${row.user_id}:${row.token}`, row]),
  );
  const rows = tickets.flatMap((ticket, index) => {
    const message = messages[index];
    const alertId = message?.data?.alertId?.trim();
    const expoTicketId = ticket.status === "ok" ? ticket.id?.trim() : null;
    const userId = alertId ? alertUserById.get(alertId) : null;
    const tokenRow = userId && message
      ? tokenByUserAndValue.get(`${userId}:${message.to}`)
      : null;
    if (!alertId || !expoTicketId || !userId || !message) return [];
    return [{
      alert_id: alertId,
      user_id: userId,
      push_token_id: tokenRow?.id ?? null,
      token: message.to,
      expo_ticket_id: expoTicketId,
      status: "pending",
    }];
  });

  if (rows.length === 0) return 0;
  const { error } = await adminClient
    .from("push_delivery_tickets")
    .upsert(rows, {
      onConflict: "expo_ticket_id",
      ignoreDuplicates: true,
    });
  if (error) {
    throw new Error(
      error.message.includes("push_delivery_tickets")
        ? "Push delivery receipt table is missing. Apply the push_delivery_tickets migration."
        : error.message,
    );
  }
  return rows.length;
}

export async function deliverPushAlerts(
  adminClient: AdminClient,
  alerts: PushAlertRecord[],
  tokens: PushTokenRecord[],
): Promise<PushDeliveryResult> {
  const messages = pushMessages(alerts, tokens);
  const tickets = await sendExpoPush(messages);
  const summary = classifyExpoPushTickets(messages, tickets);
  const receiptsQueued = await storeDeliveryTickets(
    adminClient,
    alerts,
    tokens,
    messages,
    tickets,
  );
  const failuresByToken = new Map(
    summary.failures.map((failure) => [failure.token, failure]),
  );
  const invalidTokens = new Set(summary.invalidTokens);

  for (const [token, failure] of failuresByToken) {
    const { error } = await adminClient
      .from("user_push_tokens")
      .update({
        last_error: failure.message,
        ...(invalidTokens.has(token) ? { enabled: false } : {}),
      })
      .eq("token", token);
    if (error) throw new Error(error.message);
  }

  const healthyTokens = summary.successfulTokens.filter(
    (token) => !failuresByToken.has(token),
  );
  if (healthyTokens.length > 0) {
    const { error } = await adminClient
      .from("user_push_tokens")
      .update({ last_error: null })
      .in("token", healthyTokens);
    if (error) throw new Error(error.message);
  }

  if (summary.successfulAlertIds.length > 0) {
    const { error } = await adminClient
      .from("sale_alerts")
      .update({ push_sent_at: new Date().toISOString() })
      .in("id", summary.successfulAlertIds);
    if (error) throw new Error(error.message);
  }

  return {
    attempted: summary.attempted,
    sent: summary.sent,
    failed: summary.failures.length,
    alerts: summary.successfulAlertIds.length,
    receiptsQueued,
    tickets,
  };
}

async function fetchExpoPushReceipts(
  ticketIds: string[],
): Promise<Record<string, ExpoPushReceipt>> {
  const receipts: Record<string, ExpoPushReceipt> = {};
  for (const batch of chunkExpoReceiptIds(ticketIds)) {
    const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({ ids: batch }),
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: Record<string, ExpoPushReceipt>;
      errors?: Array<{ message?: string }>;
    };
    if (!response.ok) {
      throw new Error(
        payload.errors?.[0]?.message ?? `Expo receipt request failed with ${response.status}.`,
      );
    }
    Object.assign(receipts, payload.data ?? {});
  }
  return receipts;
}

export async function reconcilePushReceipts(
  adminClient: AdminClient,
): Promise<ReceiptSyncResult> {
  const nowMs = Date.now();
  const readyBefore = new Date(nowMs - 15 * 60 * 1000).toISOString();
  const expiredBeforeMs = nowMs - 24 * 60 * 60 * 1000;
  const { data, error } = await adminClient
    .from("push_delivery_tickets")
    .select("id, expo_ticket_id, token, created_at")
    .eq("status", "pending")
    .lte("created_at", readyBefore)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(
      error.message.includes("push_delivery_tickets")
        ? "Push delivery receipt table is missing. Apply the push_delivery_tickets migration."
        : error.message,
    );
  }

  const rows = (data ?? []) as PushDeliveryTicketRow[];
  const expiredRows = rows.filter((row) => {
    const createdMs = new Date(row.created_at).getTime();
    return Number.isFinite(createdMs) && createdMs <= expiredBeforeMs;
  });
  const expiredIds = new Set(expiredRows.map((row) => row.id));
  const eligibleRows = rows.filter((row) => !expiredIds.has(row.id));
  const checkedAt = new Date(nowMs).toISOString();

  if (expiredRows.length > 0) {
    const { error: expireError } = await adminClient
      .from("push_delivery_tickets")
      .update({
        status: "expired",
        error_code: "ReceiptExpired",
        error_message: "Expo push receipt was not available within 24 hours.",
        checked_at: checkedAt,
      })
      .in("id", expiredRows.map((row) => row.id));
    if (expireError) throw new Error(expireError.message);

    const { error: tokenError } = await adminClient
      .from("user_push_tokens")
      .update({ last_error: "Expo push receipt was not available within 24 hours." })
      .in("token", uniqueStrings(expiredRows.map((row) => row.token)));
    if (tokenError) throw new Error(tokenError.message);
  }

  if (eligibleRows.length === 0) {
    return {
      checked: expiredRows.length,
      delivered: 0,
      failed: 0,
      expired: expiredRows.length,
      pending: 0,
    };
  }

  const eligibleTicketIds = eligibleRows.map((row) => row.expo_ticket_id);
  const receipts = await fetchExpoPushReceipts(eligibleTicketIds);
  const summary = classifyExpoPushReceipts(eligibleTicketIds, receipts);

  if (summary.deliveredTicketIds.length > 0) {
    const { error: deliveredError } = await adminClient
      .from("push_delivery_tickets")
      .update({
        status: "delivered",
        error_code: null,
        error_message: null,
        checked_at: checkedAt,
      })
      .in("expo_ticket_id", summary.deliveredTicketIds);
    if (deliveredError) throw new Error(deliveredError.message);
  }

  const rowByTicketId = new Map(
    eligibleRows.map((row) => [row.expo_ticket_id, row]),
  );
  const failedTokens = new Set<string>();
  for (const failure of summary.failures) {
    const ticketRow = rowByTicketId.get(failure.ticketId);
    if (!ticketRow) continue;
    failedTokens.add(ticketRow.token);
    const { error: ticketError } = await adminClient
      .from("push_delivery_tickets")
      .update({
        status: "failed",
        error_code: failure.code,
        error_message: failure.message,
        checked_at: checkedAt,
      })
      .eq("id", ticketRow.id);
    if (ticketError) throw new Error(ticketError.message);

    const { error: tokenError } = await adminClient
      .from("user_push_tokens")
      .update({
        last_error: failure.message,
        ...(failure.code === "DeviceNotRegistered" ? { enabled: false } : {}),
      })
      .eq("token", ticketRow.token);
    if (tokenError) throw new Error(tokenError.message);
  }

  const deliveredTokens = uniqueStrings(
    summary.deliveredTicketIds
      .map((ticketId) => rowByTicketId.get(ticketId)?.token)
      .filter((token): token is string =>
        typeof token === "string" && !failedTokens.has(token)),
  );
  if (deliveredTokens.length > 0) {
    const { error: tokenError } = await adminClient
      .from("user_push_tokens")
      .update({ last_error: null })
      .in("token", deliveredTokens);
    if (tokenError) throw new Error(tokenError.message);
  }

  return {
    checked: expiredRows.length + eligibleRows.length - summary.pendingTicketIds.length,
    delivered: summary.deliveredTicketIds.length,
    failed: summary.failures.length,
    expired: expiredRows.length,
    pending: summary.pendingTicketIds.length,
  };
}
