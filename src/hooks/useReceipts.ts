import React from "react";
import { AppState } from "react-native";
import { listReceipts, receiptError } from "../services/receipts";
import type { Receipt } from "../utils/receipts";

export default function useReceipts(userId: string) {
  const [receipts, setReceipts] = React.useState<Receipt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [syncedAt, setSyncedAt] = React.useState<Date | null>(null);
  const version = React.useRef(0);
  const refresh = React.useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await listReceipts(userId);
      if (request === version.current) {
        setReceipts(rows);
        setSyncedAt(new Date());
      }
    } catch (e) {
      if (request === version.current) setError(receiptError(e));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [userId]);
  React.useEffect(() => {
    void refresh();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      version.current++;
      appState.remove();
    };
  }, [refresh]);
  return { receipts, loading, error, syncedAt, refresh };
}
