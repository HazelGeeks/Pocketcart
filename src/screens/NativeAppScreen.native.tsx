import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  BackHandler,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";
import { HomeCatalogPanel } from "../components/nativeApp/HomeCatalogPanel";
import { NativeAppOnboarding } from "../components/nativeApp/NativeAppOnboarding";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeBottomTabs, NativeTopBar } from "../components/nativeApp/NativeShell";
import { ProductDetailPanel } from "../components/nativeApp/ProductDetailPanel";
import { StoreMapPanel } from "../components/nativeApp/StoreMapPanel";
import { WatchlistPanel } from "../components/nativeApp/WatchlistPanel";
import useLayout from "../hooks/useLayout";
import { hasSupabaseEnv } from "../services/supabaseClient";
import { MorePanel } from "../components/nativeApp/MorePanel";
import {
  addWatchlistItem,
  listWatchlistItems,
  removeWatchlistItem,
  type WatchlistItem,
} from "../services/watchlist";
import {
  markSaleAlertsRead,
  syncSaleAlertsForWatchlist,
  type SaleAlert,
} from "../services/saleAlerts";
import {
  completeAuthSessionFromUrl,
  deleteCurrentUserAccount,
  getCurrentUserProfile,
  signInUser,
  signOutUser,
  signUpUser,
  type UserProfile,
} from "../services/userProfile";
import {
  listProductCategories,
  listProductPriceHistory,
  listLatestStorePricesForProduct,
  listProducts,
  listStores,
  type MarketPricePoint,
  type MarketProduct,
  type MarketStorePrice,
  type MarketStore,
} from "../services/marketData";
import {
  buildPreviousPriceRows,
  buildPriceChart,
  DEFAULT_REGION,
  money,
  type HomeRoute,
  type NativeTabId,
} from "./nativeAppData";
import {
  formatSignedPercent,
} from "../components/nativeApp/priceDisplay";
import {
  buildLocationSearchPlaceholder,
  requestLocationPermissionAndPosition,
  type OnboardingLocationMode,
} from "../services/nativePermissions";
import {
  configurePushNotificationHandler,
  registerPushTokenForCurrentUser,
  sendSaleAlertPushNotifications,
} from "../services/pushNotifications";
import { st } from "./nativeAppStyles";

type OnboardingState = {
  locationCompleted: boolean;
  locationMode: OnboardingLocationMode;
  postalCode: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
  alertsCompleted: boolean;
  alertsEnabled: boolean;
};

const ONBOARDING_STORAGE_KEY = "pc-native-onboarding-v1";

const INITIAL_ONBOARDING_STATE: OnboardingState = {
  locationCompleted: false,
  locationMode: "skip",
  postalCode: null,
  locationLatitude: null,
  locationLongitude: null,
  alertsCompleted: false,
  alertsEnabled: false,
};

function isSignInRequiredMessage(message: string | null | undefined): boolean {
  return message?.trim().toLowerCase() === "please sign in first.";
}

export default function NativeAppScreen() {
  const { pad, w } = useLayout();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView | null>(null);
  const handledAuthCallbackUrlsRef = React.useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = React.useState<NativeTabId>("home");
  const [homeRoute, setHomeRoute] = React.useState<HomeRoute>("catalog");
  const [homeSortMode, setHomeSortMode] = React.useState<
    "deals" | "lowestPrice" | "biggestDrop"
  >("deals");

  const [homeQuery, setHomeQuery] = React.useState("");
  const [homeCategory, setHomeCategory] = React.useState("All");
  const [homeProducts, setHomeProducts] = React.useState<MarketProduct[]>([]);
  const [homeCategories, setHomeCategories] = React.useState<string[]>([]);
  const [homeLoading, setHomeLoading] = React.useState(false);
  const [homeMessage, setHomeMessage] = React.useState<string | null>(null);
  const [selectedHomeProductId, setSelectedHomeProductId] = React.useState("");
  const [homePriceHistory, setHomePriceHistory] = React.useState<MarketPricePoint[]>(
    [],
  );
  const [homeStorePrices, setHomeStorePrices] = React.useState<MarketStorePrice[]>([]);
  const [homeHistoryLoading, setHomeHistoryLoading] = React.useState(false);
  const [homeStorePricesLoading, setHomeStorePricesLoading] = React.useState(false);
  const [homeHistoryMessage, setHomeHistoryMessage] = React.useState<string | null>(
    null,
  );
  const [homeActionMessage, setHomeActionMessage] = React.useState<string | null>(null);
  const [homeAddSubmitting, setHomeAddSubmitting] = React.useState(false);

  const [watchlistItems, setWatchlistItems] = React.useState<WatchlistItem[]>([]);
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [watchRemovingId, setWatchRemovingId] = React.useState<string | null>(null);
  const [watchMessage, setWatchMessage] = React.useState<string | null>(null);
  const [saleAlerts, setSaleAlerts] = React.useState<SaleAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = React.useState(false);
  const [alertsMessage, setAlertsMessage] = React.useState<string | null>(null);
  const [alertsMarkingRead, setAlertsMarkingRead] = React.useState(false);

  const [mapQuery, setMapQuery] = React.useState("");
  const [mapStores, setMapStores] = React.useState<MarketStore[]>([]);
  const [focusedStoreId, setFocusedStoreId] = React.useState("");
  const [mapLoading, setMapLoading] = React.useState(false);
  const [mapMessage, setMapMessage] = React.useState<string | null>(null);
  const [pendingStoreIdFromHome, setPendingStoreIdFromHome] = React.useState<string | null>(
    null,
  );
  const [homeStoreFilterId, setHomeStoreFilterId] = React.useState<string | null>(null);
  const [homeStoreFilterName, setHomeStoreFilterName] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [moreMessage, setMoreMessage] = React.useState<string | null>(null);
  const [authMode, setAuthMode] = React.useState<"signIn" | "signUp">("signIn");
  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signUpName, setSignUpName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const [onboardingState, setOnboardingState] = React.useState(INITIAL_ONBOARDING_STATE);
  const [onboardingVisible, setOnboardingVisible] = React.useState(false);
  const [onboardingStep, setOnboardingStep] = React.useState<"location" | "alerts">(
    "location",
  );
  const [onboardingPostalCode, setOnboardingPostalCode] = React.useState("");
  const [onboardingAlertsEnabled, setOnboardingAlertsEnabled] = React.useState(false);
  const [onboardingMessage, setOnboardingMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const filteredHomeProducts = React.useMemo(() => {
    if (!homeStoreFilterId) return homeProducts;
    return homeProducts.filter((product) => product.best_store_id === homeStoreFilterId);
  }, [homeStoreFilterId, homeProducts]);

  const selectedHomeProduct = React.useMemo(
    () =>
      filteredHomeProducts.find((product) => product.id === selectedHomeProductId) ??
      filteredHomeProducts[0] ??
      null,
    [filteredHomeProducts, selectedHomeProductId],
  );

  const handleSetHomeStoreFilter = React.useCallback(
    (storeId: string, storeName: string) => {
      setHomeStoreFilterId(storeId);
      setHomeStoreFilterName(storeName);
      setHomeRoute("catalog");
      setActiveTab("home");
      setSelectedHomeProductId("");
      showToast(`Showing deals at ${storeName}.`);
    },
    [showToast],
  );

  const clearHomeStoreFilter = React.useCallback(() => {
    setHomeStoreFilterId(null);
    setHomeStoreFilterName(null);
  }, []);

  const productById = React.useMemo(() => {
    const map = new Map<string, MarketProduct>();
    homeProducts.forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [homeProducts]);

  const watchedProductIds = React.useMemo(() => {
    const productIds = new Set<string>();
    for (const item of watchlistItems) {
      if (item.product_id) {
        productIds.add(item.product_id);
      }
    }
    return productIds;
  }, [watchlistItems]);

  const filteredStores = React.useMemo(() => {
    const q = mapQuery.trim().toLowerCase();
    if (!q) return mapStores;
    return mapStores.filter((store) =>
      `${store.brand ?? ""} ${store.name} ${store.area} ${store.price_note ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [mapQuery, mapStores]);

  const homeChart = React.useMemo(() => {
    if (!selectedHomeProduct || homePriceHistory.length === 0) return null;
    return buildPriceChart(homePriceHistory, w, pad);
  }, [homePriceHistory, pad, selectedHomeProduct, w]);

  const previousPriceRows = React.useMemo(
    () => buildPreviousPriceRows(homeChart),
    [homeChart],
  );

  const activeStore = React.useMemo(
    () => filteredStores.find((store) => store.id === focusedStoreId) ?? filteredStores[0],
    [filteredStores, focusedStoreId],
  );

  const mapRegion = React.useMemo<Region>(() => {
    if (!activeStore) return DEFAULT_REGION;
    return {
      latitude: activeStore.latitude,
      longitude: activeStore.longitude,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    };
  }, [activeStore]);

  const unreadAlertCount = React.useMemo(
    () => saleAlerts.filter((alert) => alert.read_at === null).length,
    [saleAlerts],
  );

  const detailBackPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => {
          if (Platform.OS === "web") return false;
          if (homeRoute !== "detail") return false;
          if (activeTab !== "home") return false;
          return true;
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (
            gestureState.dx > 72 &&
            gestureState.vx > 0.25 &&
            Math.abs(gestureState.vy) < 1
          ) {
            setHomeRoute("catalog");
          }
        },
      }),
    [activeTab, homeRoute],
  );

  const persistOnboardingState = React.useCallback(
    async (nextState: OnboardingState) => {
      setOnboardingState(nextState);
      setOnboardingAlertsEnabled(nextState.alertsEnabled);
      setOnboardingPostalCode(nextState.postalCode ?? "");
      setOnboardingMessage(null);
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState)).catch(
        () => {},
      );
    },
    [],
  );

  const loadOnboardingState = React.useCallback(async () => {
    const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      setOnboardingVisible(true);
      setOnboardingStep("location");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<OnboardingState>;
      const normalized: OnboardingState = {
        locationCompleted: Boolean(parsed.locationCompleted),
        locationMode: parsed.locationMode ?? "skip",
        postalCode: parsed.postalCode ?? null,
        locationLatitude: parsed.locationLatitude ?? null,
        locationLongitude: parsed.locationLongitude ?? null,
        alertsCompleted: Boolean(parsed.alertsCompleted),
        alertsEnabled: Boolean(parsed.alertsEnabled),
      };
      setOnboardingState(normalized);
      setOnboardingPostalCode(normalized.postalCode ?? "");
      setOnboardingAlertsEnabled(normalized.alertsEnabled);
      if (!normalized.locationCompleted) {
        setOnboardingVisible(true);
        setOnboardingStep("location");
      } else if (!normalized.alertsCompleted) {
        setOnboardingVisible(true);
        setOnboardingStep("alerts");
      } else {
        setOnboardingVisible(false);
      }
    } catch {
      setOnboardingVisible(true);
      setOnboardingStep("location");
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY).catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    void loadOnboardingState();
  }, [loadOnboardingState]);

  React.useEffect(() => {
    configurePushNotificationHandler();
  }, []);

  React.useEffect(() => {
    if (!profile || !onboardingState.alertsEnabled) return;
    void registerPushTokenForCurrentUser();
  }, [onboardingState.alertsEnabled, profile]);

  React.useEffect(() => {
    if (homeRoute !== "detail") {
      return;
    }

    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        setHomeRoute("catalog");
        return true;
      });
      return () => subscription.remove();
    }

    return;
  }, [homeRoute]);

  const loadHomeProducts = React.useCallback(async () => {
    setHomeLoading(true);
    const { data, error } = await listProducts({
      search: homeQuery,
      category: homeCategory === "All" ? undefined : homeCategory,
    });
    setHomeProducts(data);
    setHomeLoading(false);

    if (error) {
      setHomeMessage(error);
    } else {
      setHomeMessage(null);
    }
  }, [homeCategory, homeQuery]);

  const loadHomeCategories = React.useCallback(async () => {
    const { data, error } = await listProductCategories();
    setHomeCategories(data);
    if (error) {
      setHomeMessage(error);
    }
  }, []);

  const loadHomePriceHistory = React.useCallback(async (productId: string) => {
    if (!productId) {
      setHomePriceHistory([]);
      return;
    }

    setHomeHistoryLoading(true);
    const { data, error } = await listProductPriceHistory(productId);
    setHomePriceHistory(data);
    setHomeHistoryLoading(false);

    if (error) {
      setHomeHistoryMessage(error);
    } else {
      setHomeHistoryMessage(null);
    }
  }, []);

  const loadHomeStorePrices = React.useCallback(async (productId: string) => {
    if (!productId) {
      setHomeStorePrices([]);
      return;
    }

    setHomeStorePricesLoading(true);
    const { data, error } = await listLatestStorePricesForProduct(productId);
    setHomeStorePrices(data);
    setHomeStorePricesLoading(false);

    if (error) {
      setHomeHistoryMessage(error);
    }
  }, []);

  const notifyCreatedSaleAlerts = React.useCallback(
    (createdAlerts: SaleAlert[]) => {
      if (createdAlerts.length === 0) return;
      if (onboardingState.alertsEnabled) {
        void sendSaleAlertPushNotifications(createdAlerts);
        const notification = (globalThis as { Notification?: any }).Notification;
        if (
          Platform.OS === "web" &&
          notification &&
          notification.permission === "granted"
        ) {
          createdAlerts.slice(0, 3).forEach((alert) => {
            try {
              new notification(alert.title, { body: alert.body });
            } catch {
              // Browser notification availability varies by runtime.
            }
          });
        }
      }
      showToast(
        createdAlerts.length === 1
          ? "New sale alert."
          : `${createdAlerts.length} new sale alerts.`,
      );
    },
    [onboardingState.alertsEnabled, showToast],
  );

  const loadSaleAlerts = React.useCallback(
    async (items: WatchlistItem[], keepMessage = false) => {
      if (!hasSupabaseEnv) {
        setSaleAlerts([]);
        return;
      }

      setAlertsLoading(true);
      const { data, error } = await syncSaleAlertsForWatchlist(items);
      setSaleAlerts(data.alerts);
      setAlertsLoading(false);
      if (isSignInRequiredMessage(error)) {
        setAlertsMessage(null);
      } else if (error) {
        setAlertsMessage(error);
      } else if (!keepMessage) {
        setAlertsMessage(null);
      }
      notifyCreatedSaleAlerts(data.created);
    },
    [notifyCreatedSaleAlerts],
  );

  const loadWatchlist = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setWatchlistItems([]);
      setSaleAlerts([]);
      return;
    }

    setWatchLoading(true);
    const { data, error } = await listWatchlistItems();
    setWatchlistItems(data);
    setWatchLoading(false);
    if (isSignInRequiredMessage(error)) {
      setWatchMessage(null);
    } else if (error) {
      setWatchMessage(error);
    } else if (!keepMessage) {
      setWatchMessage(null);
    }
    if (!error) {
      await loadSaleAlerts(data, true);
    }
  }, [loadSaleAlerts]);

  const loadMapStores = React.useCallback(async () => {
    const searchText =
      mapQuery.trim().length > 0
        ? mapQuery.trim()
        : buildLocationSearchPlaceholder({
            locationMode: onboardingState.locationMode,
            postalCode: onboardingState.postalCode,
            latitude: onboardingState.locationLatitude,
            longitude: onboardingState.locationLongitude,
          });

    setMapLoading(true);
    const { data, error } = await listStores({
      search: searchText,
      latitude: onboardingState.locationLatitude ?? undefined,
      longitude: onboardingState.locationLongitude ?? undefined,
    });
    setMapStores(data);
    setMapLoading(false);

    if (error) {
      setMapMessage(error);
    } else {
      setMapMessage(null);
    }

    if (data.length > 0 && !focusedStoreId) {
      setFocusedStoreId(data[0].id);
    }
  }, [mapQuery, onboardingState.locationLatitude, onboardingState.locationLongitude, onboardingState.locationMode, onboardingState.postalCode]);

  const loadProfile = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setProfile(null);
      return;
    }

    setMoreLoading(true);
    const { data, error } = await getCurrentUserProfile();
    setProfile(data);
    setMoreLoading(false);

    if (error) {
      setMoreMessage(error);
    } else if (!keepMessage) {
      setMoreMessage(null);
    }
  }, []);

  const handleAuthCallbackUrl = React.useCallback(
    async (url: string | null) => {
      if (!url) return;
      if (handledAuthCallbackUrlsRef.current.has(url)) return;

      const looksLikeAuthCallback =
        url.startsWith("pocketcart://auth/callback") ||
        url.startsWith("com.pocketcart.app://auth/callback") ||
        url.includes("access_token=") ||
        url.includes("error=");
      if (!looksLikeAuthCallback) return;

      handledAuthCallbackUrlsRef.current.add(url);
      setMoreLoading(true);
      const { data, error } = await completeAuthSessionFromUrl(url);
      setMoreLoading(false);

      if (!data.handled) return;

      setActiveTab("more");
      setAuthMode("signIn");

      if (error) {
        setMoreMessage(error);
        showToast("Unable to verify email.");
        return;
      }

      setProfile(data.profile);
      setMoreMessage("Email verified. You're signed in.");
      showToast("Email verified.");
      await loadWatchlist(true);
    },
    [loadWatchlist, showToast],
  );

  React.useEffect(() => {
    let isMounted = true;
    void Linking.getInitialURL().then((url) => {
      if (!isMounted) return;
      void handleAuthCallbackUrl(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleAuthCallbackUrl(url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [handleAuthCallbackUrl]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    setHomeRoute("catalog");
    void loadHomeCategories();
  }, [activeTab, loadHomeCategories]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    void loadHomeProducts();
  }, [activeTab, homeCategory, homeQuery, loadHomeProducts]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    void loadWatchlist(true);
  }, [activeTab, loadWatchlist]);

  React.useEffect(() => {
    if (filteredHomeProducts.length === 0) {
      setSelectedHomeProductId("");
      return;
    }

    const hasSelected = filteredHomeProducts.some(
      (product) => product.id === selectedHomeProductId,
    );
    if (!hasSelected) {
      setSelectedHomeProductId(filteredHomeProducts[0].id);
    }
  }, [filteredHomeProducts, selectedHomeProductId]);

  React.useEffect(() => {
    setHomeActionMessage(null);
  }, [homeRoute, selectedHomeProductId]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    if (homeRoute !== "detail") return;
    if (!selectedHomeProductId) return;
    void loadHomePriceHistory(selectedHomeProductId);
    void loadHomeStorePrices(selectedHomeProductId);
  }, [activeTab, homeRoute, loadHomePriceHistory, loadHomeStorePrices, selectedHomeProductId]);

  React.useEffect(() => {
    if (activeTab !== "watchlist") return;
    void loadWatchlist();
  }, [activeTab, loadWatchlist]);

  React.useEffect(() => {
    if (activeTab !== "alerts") return;
    void loadWatchlist(true);
  }, [activeTab, loadWatchlist]);

  React.useEffect(() => {
    if (activeTab !== "map") return;
    void loadMapStores();
  }, [activeTab, loadMapStores]);

  React.useEffect(() => {
    if (pendingStoreIdFromHome === null) {
      return;
    }

    const target = filteredStores.find((store) => store.id === pendingStoreIdFromHome);
    if (target) {
      setFocusedStoreId(target.id);
      mapRef.current?.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.022,
          longitudeDelta: 0.022,
        },
        220,
      );
      setPendingStoreIdFromHome(null);
      showToast(`Open ${target.name} on map.`);
      return;
    }
  }, [filteredStores, pendingStoreIdFromHome, showToast]);

  React.useEffect(() => {
    if (filteredStores.length === 0) {
      setFocusedStoreId("");
      return;
    }

    const hasFocused = filteredStores.some((store) => store.id === focusedStoreId);
    if (!hasFocused) {
      setFocusedStoreId(filteredStores[0].id);
    }
  }, [filteredStores, focusedStoreId]);

  React.useEffect(() => {
    if (!activeStore) return;
    mapRef.current?.animateToRegion(mapRegion, 220);
  }, [activeStore, mapRegion]);

  React.useEffect(() => {
    if (activeTab !== "more") return;
    void loadProfile();
  }, [activeTab, loadProfile]);

  React.useEffect(() => {
    if (onboardingState.locationMode !== "postal") {
      if (onboardingState.locationMode === "share" && mapQuery.includes(",")) {
        setMapQuery("");
      }
      return;
    }

    if (!onboardingState.postalCode) return;
    if (!mapQuery) {
      setMapQuery(onboardingState.postalCode);
    }
  }, [mapQuery, onboardingState.locationMode, onboardingState.postalCode]);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 2300);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleLocationShare = React.useCallback(async () => {
    const permission = await requestLocationPermissionAndPosition();
    if (!permission.granted) {
      setHomeActionMessage(permission.message ?? "Location access not available.");
    } else {
      setHomeActionMessage(null);
    }

    const nextState: OnboardingState = {
      ...onboardingState,
      locationCompleted: true,
      locationMode: "share",
      postalCode: permission.granted ? null : onboardingState.postalCode,
      locationLatitude: permission.latitude ?? null,
      locationLongitude: permission.longitude ?? null,
      alertsCompleted: false,
      alertsEnabled: onboardingState.alertsEnabled,
    };
    setOnboardingMessage(permission.message ?? null);
    if (permission.granted) {
      setMapQuery("");
    }

    await persistOnboardingState(nextState);
    setOnboardingStep("alerts");
    showToast(permission.granted ? "Using live location mode." : "Location not granted. Continue with alerts.");
  }, [onboardingState, persistOnboardingState, showToast]);

  const handleLocationPostal = React.useCallback(async () => {
    const normalized = onboardingPostalCode.trim();
    if (!normalized) {
      setHomeActionMessage("Please enter postal code.");
      return;
    }

    const nextState: OnboardingState = {
      ...onboardingState,
      locationCompleted: true,
      locationMode: "postal",
      postalCode: normalized,
      locationLatitude: null,
      locationLongitude: null,
      alertsCompleted: false,
      alertsEnabled: onboardingState.alertsEnabled,
    };
    setOnboardingMessage(null);
    await persistOnboardingState(nextState);
    setMapQuery(normalized);
    setOnboardingStep("alerts");
    showToast(`Saved postal code ${normalized}.`);
  }, [onboardingPostalCode, onboardingState, persistOnboardingState, showToast]);

  const handleSkipLocation = React.useCallback(async () => {
    const nextState: OnboardingState = {
      ...onboardingState,
      locationCompleted: true,
      locationMode: "skip",
      postalCode: null,
      locationLatitude: null,
      locationLongitude: null,
      alertsCompleted: false,
      alertsEnabled: onboardingState.alertsEnabled,
    };
    setOnboardingMessage(null);
    await persistOnboardingState(nextState);
    setOnboardingStep("alerts");
    showToast("Location setup skipped. You can set it later.");
  }, [onboardingState, persistOnboardingState, showToast]);

  const handleAlertsStep = React.useCallback(async () => {
    if (onboardingAlertsEnabled) {
      const permission = await registerPushTokenForCurrentUser();
      setOnboardingMessage(permission.message ?? null);

      if (!permission.granted) {
        showToast(permission.message ?? "Alert permission not enabled.");
      }

      setOnboardingAlertsEnabled(permission.granted);

      const nextState: OnboardingState = {
        ...onboardingState,
        alertsCompleted: true,
        alertsEnabled: permission.granted,
      };
      await persistOnboardingState(nextState);
      setOnboardingVisible(false);
      showToast(permission.granted ? "Alerts enabled." : "Alerts disabled.");
      return;
    }

    const skippedState: OnboardingState = {
      ...onboardingState,
      alertsCompleted: true,
      alertsEnabled: false,
    };
    await persistOnboardingState(skippedState);
    setOnboardingVisible(false);
    showToast("Alerts disabled.");
    return;
  }, [
    onboardingAlertsEnabled,
    onboardingState,
    persistOnboardingState,
    showToast,
  ]);

  const handleRemoveWatchlistItem = React.useCallback(
    async (itemId: string) => {
      setWatchRemovingId(itemId);
      const { error } = await removeWatchlistItem(itemId);
      setWatchRemovingId(null);

      if (error) {
        setWatchMessage(error);
        return;
      }

      setWatchMessage(null);
      await loadWatchlist(true);
      showToast("Removed from watchlist.");
    },
    [loadWatchlist, showToast],
  );

  const handleMarkAlertsRead = React.useCallback(async () => {
    setAlertsMarkingRead(true);
    const { error } = await markSaleAlertsRead();
    setAlertsMarkingRead(false);

    if (error) {
      setAlertsMessage(error);
      return;
    }

    setAlertsMessage(null);
    setSaleAlerts((current) =>
      current.map((alert) => ({
        ...alert,
        read_at: alert.read_at ?? new Date().toISOString(),
      })),
    );
    showToast("Alerts marked as read.");
  }, [showToast]);

  const handleSignUp = React.useCallback(async () => {
    const name = signUpName.trim();
    const email = signUpEmail.trim();
    const password = signUpPassword;

    if (!name) {
      setMoreMessage("Name is required.");
      return;
    }
    if (!email) {
      setMoreMessage("Email is required.");
      return;
    }
    if (password.length < 8) {
      setMoreMessage("Password must be at least 8 characters.");
      return;
    }

    setMoreLoading(true);
    const { data, error } = await signUpUser({ name, email, password });
    setMoreLoading(false);

    if (error) {
      setMoreMessage(error);
      return;
    }

    setMoreMessage(
      data.awaitingVerification
        ? "Account created. Check your email to verify your account."
        : "Account created successfully.",
    );
    showToast(data.awaitingVerification ? "Account created. Verify your email." : "Account created.");
    setSignUpPassword("");
    await loadProfile(true);
  }, [
    loadProfile,
    showToast,
    signUpEmail,
    signUpName,
    signUpPassword,
  ]);

  const handleSignIn = React.useCallback(async () => {
    const email = signInEmail.trim();
    const password = signInPassword;

    if (!email) {
      setMoreMessage("Email is required.");
      return;
    }
    if (!password) {
      setMoreMessage("Password is required.");
      return;
    }

    setMoreLoading(true);
    const { data, error } = await signInUser({ email, password });
    setMoreLoading(false);

    if (error) {
      setMoreMessage(error);
      return;
    }

    setProfile(data);
    setMoreMessage(null);
    setSignInPassword("");
    showToast("Signed in.");
    await loadWatchlist(true);
  }, [loadWatchlist, showToast, signInEmail, signInPassword]);

  const handleAddProductToWatchlist = React.useCallback(
    async (product: MarketProduct) => {
      if (!product) return;

      setHomeAddSubmitting(true);
      const { error } = await addWatchlistItem({
        productId: product.id,
        storeId: product.best_store_id,
        name: product.name,
        store: product.best_store_name ?? "Unknown store",
      });
      setHomeAddSubmitting(false);

      if (error) {
        if (isSignInRequiredMessage(error)) {
          setHomeActionMessage(null);
          setActiveTab("more");
          setHomeRoute("catalog");
          showToast("Sign in to enable sale alerts.");
          return;
        }
        setHomeActionMessage(error);
        return;
      }

      setHomeActionMessage(null);
      await loadWatchlist(true);
      showToast("Sale alert enabled.");
    },
    [loadWatchlist, showToast],
  );

  const handleAddSelectedToWatchlist = React.useCallback(async () => {
    if (!selectedHomeProduct) return;
    await handleAddProductToWatchlist(selectedHomeProduct);
  }, [handleAddProductToWatchlist, selectedHomeProduct]);

  const handleWatchProductFromHome = React.useCallback(
    (productId: string) => {
      const product = filteredHomeProducts.find((item) => item.id === productId);
      if (!product) return;
      void handleAddProductToWatchlist(product);
    },
    [filteredHomeProducts, handleAddProductToWatchlist],
  );

  const handleSignOut = React.useCallback(async () => {
    setMoreLoading(true);
    const { error } = await signOutUser();
    setMoreLoading(false);

    if (error) {
      setMoreMessage(error);
      return;
    }

    setProfile(null);
    setWatchlistItems([]);
    setDeleteConfirming(false);
    setMoreMessage("Signed out.");
    showToast("Signed out.");
  }, [showToast]);

  const handleDeleteAccount = React.useCallback(async () => {
    setDeletingAccount(true);
    const { error } = await deleteCurrentUserAccount();
    setDeletingAccount(false);

    if (error) {
      setMoreMessage(error);
      return;
    }

    setDeleteConfirming(false);
    setProfile(null);
    setWatchlistItems([]);
    setMoreMessage("Account deleted.");
    showToast("Account deleted.");
  }, [showToast]);

  const handleOpenStoreOnMap = React.useCallback(
    (storeId: string, storeName?: string) => {
      if (!storeId || storeId === "unlinked-store") {
        return;
      }
      setPendingStoreIdFromHome(storeId);
      setActiveTab("map");
      setMapQuery(storeName ?? "");
      setOnboardingVisible(false);
    },
    [],
  );

  const focusStore = React.useCallback(
    (store: MarketStore) => {
      setFocusedStoreId(store.id);
      mapRef.current?.animateToRegion(
        {
          latitude: store.latitude,
          longitude: store.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        220,
      );
    },
    [],
  );

  return (
    <View style={st.root}>
      <NativeTopBar topInset={insets.top} pad={pad} />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={[
          st.scrollContent,
          {
            paddingHorizontal: pad,
            paddingBottom: 92 + Math.max(insets.bottom, 10),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "home" && homeRoute === "catalog" ? (
          <HomeCatalogPanel
            query={homeQuery}
            category={homeCategory}
            categories={homeCategories}
            message={homeMessage}
            actionMessage={homeActionMessage}
            loading={homeLoading}
            products={filteredHomeProducts}
            watchedProductIds={watchedProductIds}
            sortMode={homeSortMode}
            storeFilterName={homeStoreFilterName}
            onClearStoreFilter={clearHomeStoreFilter}
            selectedProduct={selectedHomeProduct}
            onChangeQuery={setHomeQuery}
            onChangeCategory={setHomeCategory}
            onChangeSort={setHomeSortMode}
            onSelectProduct={(productId) => {
              setSelectedHomeProductId(productId);
              setHomeRoute("detail");
            }}
            onWatchProduct={(productId) => {
              void handleWatchProductFromHome(productId);
            }}
            onOpenStoreOnMap={handleOpenStoreOnMap}
          />
        ) : null}

        {activeTab === "home" && homeRoute === "detail" ? (
          <View {...detailBackPanResponder.panHandlers}>
            <ProductDetailPanel
              product={selectedHomeProduct}
              chart={homeChart}
              previousPriceRows={previousPriceRows}
              actionMessage={homeActionMessage}
              historyMessage={homeHistoryMessage}
              historyLoading={homeHistoryLoading}
              storePrices={homeStorePrices}
              storePricesLoading={homeStorePricesLoading}
              addSubmitting={homeAddSubmitting}
              onBack={() => setHomeRoute("catalog")}
              onAddToWatchlist={handleAddSelectedToWatchlist}
              onOpenStoreOnMap={handleOpenStoreOnMap}
            />
          </View>
        ) : null}

        {activeTab === "watchlist" ? (
          <WatchlistPanel
            hasSupabaseEnv={hasSupabaseEnv}
            items={watchlistItems}
            productById={productById}
            loading={watchLoading}
            removingId={watchRemovingId}
            message={watchMessage}
            onRemoveItem={(itemId) => {
              void handleRemoveWatchlistItem(itemId);
            }}
          />
        ) : null}

        {activeTab === "map" ? (
          <StoreMapPanel
            mapRef={mapRef}
            query={mapQuery}
            message={mapMessage}
            loading={mapLoading}
            stores={filteredStores}
            focusedStoreId={focusedStoreId}
            region={mapRegion}
            onChangeQuery={setMapQuery}
            onFocusStoreId={setFocusedStoreId}
            onFocusStore={focusStore}
            onViewStoreInHome={handleSetHomeStoreFilter}
          />
        ) : null}

        {activeTab === "alerts" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Alert</Text>
            <Text style={st.sectionSub}>
              {unreadAlertCount > 0
                ? `${unreadAlertCount} new sale ${unreadAlertCount === 1 ? "alert" : "alerts"}.`
                : "Price alerts and watchlist highlights."}
            </Text>
            <View style={st.detailActionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void loadWatchlist(true);
                }}
                style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
                disabled={alertsLoading}
              >
                <Text style={st.authBtnSecondaryText}>{alertsLoading ? "Checking..." : "Check alerts"}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void handleMarkAlertsRead();
                }}
                style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn, unreadAlertCount === 0 && st.removeBtnDisabled]}
                disabled={unreadAlertCount === 0 || alertsMarkingRead}
              >
                <Text style={st.authBtnSecondaryText}>{alertsMarkingRead ? "Saving..." : "Mark read"}</Text>
              </Pressable>
            </View>
            {alertsMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{alertsMessage}</Text>
              </View>
            ) : null}
            {alertsLoading && saleAlerts.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>Checking watchlist sales...</Text>
              </View>
            ) : saleAlerts.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.alertTitle}>No active alerts</Text>
                <Text style={st.itemMeta}>
                  Save items from Home and we will create an alert when a weekly sale is active.
                </Text>
              </View>
            ) : (
              saleAlerts.map((alert) => (
                <View key={alert.id} style={st.rowCard}>
                  <View style={st.watchTargetSummary}>
                    <Text style={st.alertTitle}>{alert.title}</Text>
                    {alert.read_at === null ? <Text style={[st.tag, st.targetBadge]}>New</Text> : null}
                  </View>
                  <Text style={st.itemMeta}>{alert.body}</Text>
                  <Text style={st.alertTime}>
                    {new Date(alert.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "more" ? (
          <MorePanel
            profile={profile}
            loading={moreLoading}
            message={moreMessage}
            authMode={authMode}
            signInEmail={signInEmail}
            signInPassword={signInPassword}
            signUpName={signUpName}
            signUpEmail={signUpEmail}
            signUpPassword={signUpPassword}
            deleteConfirming={deleteConfirming}
            deletingAccount={deletingAccount}
            onRefreshProfile={() => {
              void loadProfile();
            }}
            onChangeAuthMode={setAuthMode}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSignUp={handleSignUp}
            onStartDeleteAccount={() => setDeleteConfirming(true)}
            onCancelDeleteAccount={() => setDeleteConfirming(false)}
            onConfirmDeleteAccount={() => {
              void handleDeleteAccount();
            }}
            onChangeSignInEmail={setSignInEmail}
            onChangeSignInPassword={setSignInPassword}
            onChangeSignUpName={setSignUpName}
            onChangeSignUpEmail={setSignUpEmail}
            onChangeSignUpPassword={setSignUpPassword}
          />
        ) : null}
      </ScrollView>

      <NativeBottomTabs
        activeTab={activeTab}
        bottomInset={insets.bottom}
        pad={pad}
        onSelectTab={setActiveTab}
      />

      <NativeAppOnboarding
        visible={onboardingVisible}
        step={onboardingStep}
        locationPostalCode={onboardingPostalCode}
        alertsEnabled={onboardingAlertsEnabled}
        onChangePostalCode={setOnboardingPostalCode}
        onShareLocation={handleLocationShare}
        onSetPostalLocation={() => {
          void handleLocationPostal();
        }}
        onSkipLocation={handleSkipLocation}
        onSetAlerts={(enabled) => {
          setOnboardingAlertsEnabled(enabled);
        }}
        onFinish={() => {
          void handleAlertsStep();
        }}
      />

      {toastMessage ? (
        <View
          pointerEvents="none"
          style={[
            st.toastWrap,
            {
              left: pad,
              right: pad,
              bottom: 76 + Math.max(insets.bottom, 10),
            },
          ]}
        >
          <Text style={st.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
