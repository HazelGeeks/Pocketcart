import React from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Account,
  AppNotice,
  MvpState,
  PriceEntry,
  TrackingItem,
} from "./types";

const STORAGE_KEY = "pocketcart_mvp_state_v1";
const ACTION_DELAY_MS = 140;

export type BusyAction =
  | "bootstrap"
  | "auth"
  | "item"
  | "history"
  | "notifications"
  | "session";

export type MvpErrorCode =
  | "email_required"
  | "password_required"
  | "password_too_short"
  | "account_exists"
  | "invalid_credentials"
  | "auth_required"
  | "name_required"
  | "store_required"
  | "target_invalid"
  | "price_invalid"
  | "item_missing"
  | "busy"
  | "unknown";

export type MvpResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: MvpErrorCode };

export type AddItemInput = {
  name: string;
  store: string;
  targetPrice: string;
  latestPrice: string;
  source: string;
};

export type RecordPriceInput = {
  itemId: string;
  price: string;
  source: string;
};

type MvpStore = {
  booting: boolean;
  busyAction: BusyAction | null;
  user: Account | null;
  items: TrackingItem[];
  historyByItem: Record<string, PriceEntry[]>;
  notifications: AppNotice[];
  unreadCount: number;
  alertsEnabled: boolean;
  signUp: (email: string, password: string) => Promise<MvpResult>;
  signIn: (email: string, password: string) => Promise<MvpResult>;
  signOut: () => Promise<MvpResult>;
  deleteAccount: () => Promise<MvpResult>;
  addItem: (input: AddItemInput) => Promise<MvpResult>;
  recordPrice: (input: RecordPriceInput) => Promise<MvpResult>;
  deleteItem: (itemId: string) => Promise<MvpResult>;
  markNotificationsRead: () => Promise<MvpResult>;
  setAlertsEnabled: (next: boolean) => Promise<MvpResult>;
};

function createEmptyState(): MvpState {
  return {
    version: 1,
    accounts: [],
    sessionUserId: null,
    items: [],
    history: [],
    notifications: [],
    preferencesByUser: {},
  };
}

function normalizeState(raw: unknown): MvpState {
  if (!raw || typeof raw !== "object") {
    return createEmptyState();
  }
  const data = raw as Partial<MvpState>;
  const state: MvpState = {
    version: 1,
    accounts: Array.isArray(data.accounts) ? data.accounts : [],
    sessionUserId:
      typeof data.sessionUserId === "string" ? data.sessionUserId : null,
    items: Array.isArray(data.items) ? data.items : [],
    history: Array.isArray(data.history) ? data.history : [],
    notifications: Array.isArray(data.notifications)
      ? data.notifications
      : [],
    preferencesByUser:
      data.preferencesByUser &&
      typeof data.preferencesByUser === "object"
        ? data.preferencesByUser
        : {},
  };
  if (
    state.sessionUserId &&
    !state.accounts.some((a) => a.id === state.sessionUserId)
  ) {
    state.sessionUserId = null;
  }
  return state;
}

async function readStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return AsyncStorage.getItem(STORAGE_KEY);
}

async function writeStorage(value: string): Promise<void> {
  if (Platform.OS === "web") {
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
}

async function loadState(): Promise<MvpState> {
  try {
    const raw = await readStorage();
    if (!raw) return createEmptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return createEmptyState();
  }
}

async function persistState(state: MvpState): Promise<void> {
  await writeStorage(JSON.stringify(state));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

function parsePositiveNumber(raw: string): number | null {
  const clean = raw.trim().replace(/,/g, ".");
  if (!clean) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

function sortByNewest<T extends { createdAt?: string; updatedAt?: string }>(
  rows: T[],
): T[] {
  return rows.slice().sort((a, b) => {
    const left = a.updatedAt ?? a.createdAt ?? "";
    const right = b.updatedAt ?? b.createdAt ?? "";
    return right.localeCompare(left);
  });
}

function buildPriceDropNotice(
  userId: string,
  item: TrackingItem,
  nextPrice: number,
): AppNotice {
  return {
    id: createId("note"),
    userId,
    itemId: item.id,
    title: `${item.name} reached your target`,
    body: `Latest price ${nextPrice.toFixed(2)} at ${item.store}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function ensureUserPrefs(state: MvpState, userId: string): MvpState {
  if (state.preferencesByUser[userId]) return state;
  return {
    ...state,
    preferencesByUser: {
      ...state.preferencesByUser,
      [userId]: { alertsEnabled: true },
    },
  };
}

export default function useMvpStore(): MvpStore {
  const [state, setState] = React.useState<MvpState>(createEmptyState);
  const [booting, setBooting] = React.useState(true);
  const [busyAction, setBusyAction] =
    React.useState<BusyAction | null>("bootstrap");
  const lockRef = React.useRef(false);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    let active = true;
    const run = async () => {
      const loaded = await loadState();
      if (!active) return;
      stateRef.current = loaded;
      setState(loaded);
      setBusyAction(null);
      setBooting(false);
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  const commit = React.useCallback(
    async (updater: (prev: MvpState) => MvpState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      await persistState(next);
      return next;
    },
    [],
  );

  const runAction = React.useCallback(
    async <T,>(
      action: BusyAction,
      work: () => Promise<MvpResult<T>> | MvpResult<T>,
    ): Promise<MvpResult<T>> => {
      if (lockRef.current) return { ok: false, error: "busy" };
      lockRef.current = true;
      setBusyAction(action);
      try {
        await wait(ACTION_DELAY_MS);
        const result = await work();
        return result;
      } catch {
        return { ok: false, error: "unknown" };
      } finally {
        setBusyAction(null);
        lockRef.current = false;
      }
    },
    [],
  );

  const user = React.useMemo(() => {
    if (!state.sessionUserId) return null;
    return (
      state.accounts.find((acc) => acc.id === state.sessionUserId) ?? null
    );
  }, [state.accounts, state.sessionUserId]);

  const items = React.useMemo(() => {
    if (!user) return [];
    const userItems = state.items.filter((item) => item.userId === user.id);
    return sortByNewest(userItems);
  }, [state.items, user]);

  const historyByItem = React.useMemo(() => {
    if (!user) return {};
    const grouped: Record<string, PriceEntry[]> = {};
    state.history
      .filter((entry) => entry.userId === user.id)
      .forEach((entry) => {
        if (!grouped[entry.itemId]) grouped[entry.itemId] = [];
        grouped[entry.itemId].push(entry);
      });
    Object.keys(grouped).forEach((itemId) => {
      grouped[itemId] = sortByNewest(grouped[itemId]);
    });
    return grouped;
  }, [state.history, user]);

  const notifications = React.useMemo(() => {
    if (!user) return [];
    const rows = state.notifications.filter(
      (note) => note.userId === user.id,
    );
    return sortByNewest(rows);
  }, [state.notifications, user]);

  const unreadCount = React.useMemo(
    () => notifications.filter((note) => !note.read).length,
    [notifications],
  );

  const alertsEnabled = React.useMemo(() => {
    if (!user) return true;
    return state.preferencesByUser[user.id]?.alertsEnabled ?? true;
  }, [state.preferencesByUser, user]);

  const signUp = React.useCallback(
    async (email: string, password: string): Promise<MvpResult> =>
      runAction("auth", async () => {
        const normalizedEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();
        if (!normalizedEmail) {
          return { ok: false, error: "email_required" };
        }
        if (!cleanPassword) {
          return { ok: false, error: "password_required" };
        }
        if (cleanPassword.length < 4) {
          return { ok: false, error: "password_too_short" };
        }
        const exists = stateRef.current.accounts.some(
          (account) => account.email.toLowerCase() === normalizedEmail,
        );
        if (exists) return { ok: false, error: "account_exists" };

        const userId = createId("usr");
        const createdAt = new Date().toISOString();
        await commit((prev) => ({
          ...prev,
          accounts: [
            ...prev.accounts,
            {
              id: userId,
              email: normalizedEmail,
              password: cleanPassword,
              createdAt,
            },
          ],
          sessionUserId: userId,
          preferencesByUser: {
            ...prev.preferencesByUser,
            [userId]: { alertsEnabled: true },
          },
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  const signIn = React.useCallback(
    async (email: string, password: string): Promise<MvpResult> =>
      runAction("auth", async () => {
        const normalizedEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();
        if (!normalizedEmail) {
          return { ok: false, error: "email_required" };
        }
        if (!cleanPassword) {
          return { ok: false, error: "password_required" };
        }
        const account = stateRef.current.accounts.find(
          (row) => row.email.toLowerCase() === normalizedEmail,
        );
        if (!account || account.password !== cleanPassword) {
          return { ok: false, error: "invalid_credentials" };
        }
        await commit((prev) => {
          const next = {
            ...prev,
            sessionUserId: account.id,
          };
          return ensureUserPrefs(next, account.id);
        });
        return { ok: true };
      }),
    [commit, runAction],
  );

  const signOut = React.useCallback(
    async (): Promise<MvpResult> =>
      runAction("session", async () => {
        await commit((prev) => ({
          ...prev,
          sessionUserId: null,
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  const deleteAccount = React.useCallback(
    async (): Promise<MvpResult> =>
      runAction("session", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        await commit((prev) => ({
          ...prev,
          accounts: prev.accounts.filter((acc) => acc.id !== userId),
          sessionUserId: null,
          items: prev.items.filter((item) => item.userId !== userId),
          history: prev.history.filter((entry) => entry.userId !== userId),
          notifications: prev.notifications.filter(
            (note) => note.userId !== userId,
          ),
          preferencesByUser: Object.fromEntries(
            Object.entries(prev.preferencesByUser).filter(
              ([key]) => key !== userId,
            ),
          ),
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  const addItem = React.useCallback(
    async (input: AddItemInput): Promise<MvpResult> =>
      runAction("item", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        const name = input.name.trim();
        const store = input.store.trim();
        const source = input.source.trim();
        const targetPrice = parsePositiveNumber(input.targetPrice);
        const latestPrice = parsePositiveNumber(input.latestPrice);
        if (!name) return { ok: false, error: "name_required" };
        if (!store) return { ok: false, error: "store_required" };
        if (!targetPrice) return { ok: false, error: "target_invalid" };
        if (!latestPrice) return { ok: false, error: "price_invalid" };

        await commit((prev) => {
          const now = new Date().toISOString();
          const item: TrackingItem = {
            id: createId("item"),
            userId,
            name,
            store,
            targetPrice,
            latestPrice,
            updatedAt: now,
          };
          const row: PriceEntry = {
            id: createId("hist"),
            userId,
            itemId: item.id,
            price: latestPrice,
            source: source || store,
            createdAt: now,
          };

          const prefs = prev.preferencesByUser[userId] ?? {
            alertsEnabled: true,
          };
          const shouldNotify =
            prefs.alertsEnabled && latestPrice <= targetPrice;
          const nextNotes = shouldNotify
            ? [
                ...prev.notifications,
                buildPriceDropNotice(userId, item, latestPrice),
              ]
            : prev.notifications;

          return {
            ...prev,
            items: [...prev.items, item],
            history: [...prev.history, row],
            notifications: nextNotes,
            preferencesByUser: {
              ...prev.preferencesByUser,
              [userId]: prefs,
            },
          };
        });

        return { ok: true };
      }),
    [commit, runAction],
  );

  const recordPrice = React.useCallback(
    async (input: RecordPriceInput): Promise<MvpResult> =>
      runAction("history", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        const price = parsePositiveNumber(input.price);
        if (!price) return { ok: false, error: "price_invalid" };

        const source = input.source.trim();
        const item = stateRef.current.items.find(
          (row) => row.id === input.itemId && row.userId === userId,
        );
        if (!item) return { ok: false, error: "item_missing" };

        await commit((prev) => {
          const now = new Date().toISOString();
          const row: PriceEntry = {
            id: createId("hist"),
            userId,
            itemId: item.id,
            price,
            source: source || item.store,
            createdAt: now,
          };
          const nextItems = prev.items.map((entry) =>
            entry.id === item.id
              ? { ...entry, latestPrice: price, updatedAt: now }
              : entry,
          );
          const prefs = prev.preferencesByUser[userId] ?? {
            alertsEnabled: true,
          };
          const shouldNotify =
            prefs.alertsEnabled && price <= item.targetPrice;
          const nextNotes = shouldNotify
            ? [
                ...prev.notifications,
                buildPriceDropNotice(userId, item, price),
              ]
            : prev.notifications;
          return {
            ...prev,
            items: nextItems,
            history: [...prev.history, row],
            notifications: nextNotes,
            preferencesByUser: {
              ...prev.preferencesByUser,
              [userId]: prefs,
            },
          };
        });
        return { ok: true };
      }),
    [commit, runAction],
  );

  const deleteItem = React.useCallback(
    async (itemId: string): Promise<MvpResult> =>
      runAction("item", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        const exists = stateRef.current.items.some(
          (item) => item.id === itemId && item.userId === userId,
        );
        if (!exists) return { ok: false, error: "item_missing" };

        await commit((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== itemId),
          history: prev.history.filter((row) => row.itemId !== itemId),
          notifications: prev.notifications.filter(
            (note) => note.itemId !== itemId,
          ),
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  const markNotificationsRead = React.useCallback(
    async (): Promise<MvpResult> =>
      runAction("notifications", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        await commit((prev) => ({
          ...prev,
          notifications: prev.notifications.map((note) =>
            note.userId === userId ? { ...note, read: true } : note,
          ),
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  const setAlertsEnabled = React.useCallback(
    async (next: boolean): Promise<MvpResult> =>
      runAction("notifications", async () => {
        const userId = stateRef.current.sessionUserId;
        if (!userId) return { ok: false, error: "auth_required" };
        await commit((prev) => ({
          ...prev,
          preferencesByUser: {
            ...prev.preferencesByUser,
            [userId]: { alertsEnabled: next },
          },
        }));
        return { ok: true };
      }),
    [commit, runAction],
  );

  return {
    booting,
    busyAction,
    user,
    items,
    historyByItem,
    notifications,
    unreadCount,
    alertsEnabled,
    signUp,
    signIn,
    signOut,
    deleteAccount,
    addItem,
    recordPrice,
    deleteItem,
    markNotificationsRead,
    setAlertsEnabled,
  };
}
