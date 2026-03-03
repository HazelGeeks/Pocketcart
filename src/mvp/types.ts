export type Account = {
  id: string;
  email: string;
  password: string;
  createdAt: string;
};

export type TrackingItem = {
  id: string;
  userId: string;
  name: string;
  store: string;
  targetPrice: number;
  latestPrice: number;
  updatedAt: string;
};

export type PriceEntry = {
  id: string;
  userId: string;
  itemId: string;
  price: number;
  source: string;
  createdAt: string;
};

export type AppNotice = {
  id: string;
  userId: string;
  itemId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type UserPrefs = {
  alertsEnabled: boolean;
};

export type MvpState = {
  version: 1;
  accounts: Account[];
  sessionUserId: string | null;
  items: TrackingItem[];
  history: PriceEntry[];
  notifications: AppNotice[];
  preferencesByUser: Record<string, UserPrefs>;
};
