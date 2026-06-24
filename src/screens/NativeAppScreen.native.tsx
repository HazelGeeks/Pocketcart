import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  BackHandler,
  PanResponder,
  Platform,
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
  type AlertRow,
  type SummaryCard,
  type HomeRoute,
  type NativeTabId,
} from "./nativeAppData";
import {
  formatSignedPercent,
} from "../components/nativeApp/priceDisplay";
import {
  buildLocationSearchPlaceholder,
  requestAlertPermission,
  requestLocationPermissionAndPosition,
  type OnboardingLocationMode,
} from "../services/nativePermissions";
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

export default function NativeAppScreen() {
  const { pad, w } = useLayout();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView | null>(null);

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
  const [detailTargetPrice, setDetailTargetPrice] = React.useState("");

  const [watchlistItems, setWatchlistItems] = React.useState<WatchlistItem[]>([]);
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [watchRemovingId, setWatchRemovingId] = React.useState<string | null>(null);
  const [watchMessage, setWatchMessage] = React.useState<string | null>(null);

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

  const targetPriceByProduct = React.useMemo(() => {
    const map = new Map<string, number>();
    watchlistItems.forEach((item) => {
      if (!item.product_id || !item.target_price) return;
      const value = Number(item.target_price);
      if (Number.isFinite(value)) {
        map.set(item.product_id, value);
      }
    });
    return map;
  }, [watchlistItems]);

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
      `${store.name} ${store.area} ${store.price_note ?? ""}`
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

  const homeSummaryCards = React.useMemo<SummaryCard[]>(() => {
    const dropCount = filteredHomeProducts.reduce((count, product) => {
      return count + (product.price_delta !== null && product.price_delta < 0 ? 1 : 0);
    }, 0);

    const savingsPotential = filteredHomeProducts.reduce((sum, product) => {
      if (product.price_delta === null || product.price_delta >= 0) {
        return sum;
      }
      return sum + Math.abs(product.price_delta);
    }, 0);

    const belowTargetCount = filteredHomeProducts.reduce((count, product) => {
      const target = targetPriceByProduct.get(product.id);
      return (
        count + (target !== null && target !== undefined && product.current_price !== null && product.current_price <= target ? 1 : 0)
      );
    }, 0);

    return [
      { id: "watchlist", label: "Watching", value: String(watchlistItems.length) },
      { id: "drop", label: "Drops now", value: `${dropCount}` },
      {
        id: "saving",
        label: "Potential savings",
        value: `$${savingsPotential.toFixed(1)}`,
      },
      { id: "target", label: "Near target", value: `${belowTargetCount}` },
    ];
  }, [filteredHomeProducts, watchlistItems, targetPriceByProduct]);

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

  const alertRows = React.useMemo(() => {
    const rows: AlertRow[] = [];
    const nowLabel = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    watchlistItems.forEach((item) => {
      const product = item.product_id ? productById.get(item.product_id) : null;
      if (!product) return;
      const target = item.target_price ? Number(item.target_price) : null;
      const price = product.current_price;
      const previous = product.previous_price;
      if (target !== null && Number.isFinite(target) && price !== null && price <= target) {
        rows.push({
          id: `${item.id}-target`,
          title: "Target hit",
          body: `${item.name} is now ${money.format(price)} (target ${money.format(target)}).`,
          when: nowLabel,
        });
      } else if (
        product.price_delta_percent !== null &&
        product.price_delta_percent < 0
      ) {
        rows.push({
          id: `${item.id}-drop`,
          title: "Price dropped",
          body: `${item.name} is ${formatSignedPercent(product.price_delta_percent)} from last cycle.`,
          when: nowLabel,
        });
      } else if (previous !== null && target !== null && Number.isFinite(target) && price !== null) {
        rows.push({
          id: `${item.id}-progress`,
          title: "Tracking target",
          body: `${item.name}: ${money.format(price)} vs target ${money.format(target)}.`,
          when: nowLabel,
        });
      }
    });

    if (rows.length === 0) {
      rows.push({
        id: "watchlist-empty",
        title: "No active alerts",
        body:
          watchlistItems.length === 0
            ? "Save items from Home to start watching for drops."
            : "No active alerts right now. Check again after prices update.",
        when: nowLabel,
      });
    }

    return rows.slice(0, 6);
  }, [watchlistItems, productById]);

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

  const loadWatchlist = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setWatchlistItems([]);
      return;
    }

    setWatchLoading(true);
    const { data, error } = await listWatchlistItems();
    setWatchlistItems(data);
    setWatchLoading(false);
    if (error) {
      setWatchMessage(error);
    } else if (!keepMessage) {
      setWatchMessage(null);
    }
  }, []);

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
    if (!selectedHomeProductId) {
      setDetailTargetPrice("");
      return;
    }

    const existing = watchlistItems.find((item) => item.product_id === selectedHomeProductId);
    setDetailTargetPrice(existing?.target_price ?? "");
  }, [selectedHomeProductId, watchlistItems]);

  React.useEffect(() => {
    if (activeTab !== "watchlist") return;
    void loadWatchlist();
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
      const permission = await requestAlertPermission();
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
    async (product: MarketProduct, targetPrice?: string) => {
      const target = targetPrice?.trim() ?? "";
      if (!product) return;
      if (target) {
        const parsed = Number(target);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setHomeActionMessage("Target price must be a valid non-negative number.");
          return;
        }
      }

      setHomeAddSubmitting(true);
      const { error } = await addWatchlistItem({
        productId: product.id,
        storeId: product.best_store_id,
        name: product.name,
        store: product.best_store_name ?? "Unknown store",
        targetPrice: target || undefined,
      });
      setHomeAddSubmitting(false);

      if (error) {
        setHomeActionMessage(error);
        return;
      }

      setHomeActionMessage(null);
      await loadWatchlist(true);
      showToast("Added to watchlist.");
    },
    [loadWatchlist, showToast],
  );

  const handleAddSelectedToWatchlist = React.useCallback(async () => {
    if (!selectedHomeProduct) return;
    await handleAddProductToWatchlist(selectedHomeProduct, detailTargetPrice);
  }, [detailTargetPrice, handleAddProductToWatchlist, selectedHomeProduct]);

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
    setMoreMessage("Signed out.");
    showToast("Signed out.");
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
            summaryCards={homeSummaryCards}
            watchedProductIds={watchedProductIds}
            sortMode={homeSortMode}
            storeFilterName={homeStoreFilterName}
            onClearStoreFilter={clearHomeStoreFilter}
            selectedProduct={selectedHomeProduct}
            targetPriceByProduct={targetPriceByProduct}
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
              targetPrice={detailTargetPrice}
              addSubmitting={homeAddSubmitting}
              onBack={() => setHomeRoute("catalog")}
              onChangeTargetPrice={setDetailTargetPrice}
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
            <Text style={st.sectionSub}>Price alerts and watchlist highlights.</Text>
            {alertRows.map((row) => (
              <View key={row.id} style={st.rowCard}>
                <Text style={st.alertTitle}>{row.title}</Text>
                <Text style={st.itemMeta}>{row.body}</Text>
                <Text style={st.alertTime}>{row.when}</Text>
              </View>
            ))}
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
            onRefreshProfile={() => {
              void loadProfile();
            }}
            onChangeAuthMode={setAuthMode}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onSignUp={handleSignUp}
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
