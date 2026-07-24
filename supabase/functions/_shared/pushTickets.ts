export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: string;
  data?: {
    alertId?: string;
    route?: string;
  };
};

export type ExpoPushTicket = {
  status?: string;
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushFailure = {
  alertId: string | null;
  token: string;
  code: string | null;
  message: string;
};

export type ExpoPushTicketSummary = {
  attempted: number;
  sent: number;
  successfulAlertIds: string[];
  successfulTokens: string[];
  failures: ExpoPushFailure[];
  invalidTokens: string[];
};

export type ExpoPushReceipt = {
  status?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushReceiptFailure = {
  ticketId: string;
  code: string | null;
  message: string;
};

export type ExpoPushReceiptSummary = {
  deliveredTicketIds: string[];
  failures: ExpoPushReceiptFailure[];
  pendingTicketIds: string[];
};

export function chunkExpoPushMessages(
  messages: ExpoPushMessage[],
  batchSize = 100,
): ExpoPushMessage[][] {
  const safeBatchSize = Math.max(1, Math.min(100, Math.floor(batchSize)));
  const batches: ExpoPushMessage[][] = [];
  for (let index = 0; index < messages.length; index += safeBatchSize) {
    batches.push(messages.slice(index, index + safeBatchSize));
  }
  return batches;
}

export function chunkExpoReceiptIds(
  ticketIds: string[],
  batchSize = 1000,
): string[][] {
  const safeBatchSize = Math.max(1, Math.min(1000, Math.floor(batchSize)));
  const batches: string[][] = [];
  for (let index = 0; index < ticketIds.length; index += safeBatchSize) {
    batches.push(ticketIds.slice(index, index + safeBatchSize));
  }
  return batches;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function failureMessage(ticket: ExpoPushTicket | undefined): {
  code: string | null;
  message: string;
} {
  if (!ticket) {
    return {
      code: null,
      message: "Expo did not return a push ticket.",
    };
  }

  const code = ticket.details?.error?.trim() || null;
  const message = ticket.message?.trim() || "Expo rejected the push message.";
  return {
    code,
    message: code ? `${code}: ${message}` : message,
  };
}

export function classifyExpoPushTickets(
  messages: ExpoPushMessage[],
  tickets: ExpoPushTicket[],
): ExpoPushTicketSummary {
  const successfulAlertIds: string[] = [];
  const successfulTokens: string[] = [];
  const failures: ExpoPushFailure[] = [];

  messages.forEach((message, index) => {
    const ticket = tickets[index];
    const alertId = message.data?.alertId?.trim() || null;

    if (ticket?.status === "ok" && ticket.id?.trim()) {
      if (alertId) successfulAlertIds.push(alertId);
      successfulTokens.push(message.to);
      return;
    }

    const failure = ticket?.status === "ok"
      ? { code: null, message: "Expo did not return a push receipt ticket id." }
      : failureMessage(ticket);
    failures.push({
      alertId,
      token: message.to,
      code: failure.code,
      message: failure.message,
    });
  });

  return {
    attempted: messages.length,
    sent: messages.length - failures.length,
    successfulAlertIds: uniqueStrings(successfulAlertIds),
    successfulTokens: uniqueStrings(successfulTokens),
    failures,
    invalidTokens: uniqueStrings(
      failures
        .filter((failure) => failure.code === "DeviceNotRegistered")
        .map((failure) => failure.token),
    ),
  };
}

export function classifyExpoPushReceipts(
  ticketIds: string[],
  receipts: Record<string, ExpoPushReceipt>,
): ExpoPushReceiptSummary {
  const deliveredTicketIds: string[] = [];
  const failures: ExpoPushReceiptFailure[] = [];
  const pendingTicketIds: string[] = [];

  for (const ticketId of ticketIds) {
    const receipt = receipts[ticketId];
    if (!receipt) {
      pendingTicketIds.push(ticketId);
      continue;
    }
    if (receipt.status === "ok") {
      deliveredTicketIds.push(ticketId);
      continue;
    }

    const failure = failureMessage(receipt);
    failures.push({
      ticketId,
      code: failure.code,
      message: failure.message,
    });
  }

  return {
    deliveredTicketIds,
    failures,
    pendingTicketIds,
  };
}
