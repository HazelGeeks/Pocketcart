import React from "react";
import {
  BackHandler,
  Linking,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import MapView, { type Region } from "react-native-maps";
import { HomeCatalogPanel } from "../components/nativeApp/HomeCatalogPanel";
import { AccountAuthPanel } from "../components/nativeApp/AccountAuthPanel";
import {
  EditProfilePanel,
  EmailVerificationPanel,
  ResetPasswordPanel,
} from "../components/nativeApp/AccountFlowPanels";
import { NativeAppOnboarding } from "../components/nativeApp/NativeAppOnboarding";
import { PersonalizationPanel } from "../components/nativeApp/PersonalizationPanel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NativeBottomTabs,
  NativeContextHeader,
} from "../components/nativeApp/NativeShell";
import { ProductDetailPanel } from "../components/nativeApp/ProductDetailPanel";
import { SaleAlertsPanel } from "../components/nativeApp/SaleAlertsPanel";
import { ShoppingListPanel } from "../components/nativeApp/ShoppingListPanel";
import { StoreMapPanel } from "../components/nativeApp/StoreMapPanel";
import { WatchlistPanel } from "../components/nativeApp/WatchlistPanel";
import useLayout from "../hooks/useLayout";
import useNativeOnboarding, {
  type NativeOnboardingState,
} from "../hooks/useNativeOnboarding";
import useShoppingList from "../hooks/useShoppingList";
import useProfilePreferences from "../hooks/useProfilePreferences";
import type { ProfilePreferences } from "../services/profilePreferences";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  signInWithApple,
  signInWithGoogle,
} from "../services/nativeSocialAuth";
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
  requestPasswordReset,
  signInUser,
  signOutUser,
  signUpUser,
  updatePassword,
  updateUserProfile,
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
  type HomeRoute,
  type NativeTabId,
} from "./nativeAppData";
import { requestLocationPermissionAndPosition } from "../services/nativePermissions";
import {
  configurePushNotificationHandler,
  registerPushTokenForCurrentUser,
  sendSaleAlertPushNotifications,
} from "../services/pushNotifications";
import { st } from "./nativeAppStyles";
import { buildShoppingRecommendation } from "../utils/shoppingOptimizer";
import { settleLatestListResults } from "../utils/asyncRequestResults";
import {
  classifyAuthCallbackType,
  isAuthCallbackUrl,
} from "../utils/authCallback";

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
  const [accountRoute, setAccountRoute] = React.useState<
    "settings" | "auth" | "verify" | "personalize" | "editProfile" | "resetPassword"
  >("settings");
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
  const [shoppingPrices, setShoppingPrices] = React.useState<MarketStorePrice[]>([]);
  const [shoppingPricesLoading, setShoppingPricesLoading] = React.useState(false);
  const [shoppingMessage, setShoppingMessage] = React.useState<string | null>(null);
  const shoppingRequestIdRef = React.useRef(0);

  const [mapQuery, setMapQuery] = React.useState("");
  const [mapStores, setMapStores] = React.useState<MarketStore[]>([]);
  const [focusedStoreId, setFocusedStoreId] = React.useState("");
  const [mapFocusMode, setMapFocusMode] = React.useState<"store" | "user">("store");
  const [mapLoading, setMapLoading] = React.useState(false);
  const [mapMessage, setMapMessage] = React.useState<string | null>(null);
  const [pendingStoreIdFromHome, setPendingStoreIdFromHome] = React.useState<string | null>(
    null,
  );
  const [homeStoreFilterId, setHomeStoreFilterId] = React.useState<string | null>(null);
  const [homeStoreFilterName, setHomeStoreFilterName] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [socialAuthLoading, setSocialAuthLoading] = React.useState<
    "apple" | "google" | null
  >(null);
  const [moreMessage, setMoreMessage] = React.useState<string | null>(null);
  const [authMode, setAuthMode] = React.useState<"signIn" | "signUp">("signIn");
  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signUpName, setSignUpName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [deleteConfirming, setDeleteConfirming] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [preferencesSaving, setPreferencesSaving] = React.useState(false);
  const [pendingEmailVerification, setPendingEmailVerification] = React.useState(false);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const {
    alertsEnabled: onboardingAlertsEnabled,
    message: onboardingMessage,
    persist: persistOnboardingState,
    postalCode: onboardingPostalCode,
    setAlertsEnabled: setOnboardingAlertsEnabled,
    setMessage: setOnboardingMessage,
    setPostalCode: setOnboardingPostalCode,
    setStep: setOnboardingStep,
    setVisible: setOnboardingVisible,
    state: onboardingState,
    step: onboardingStep,
    visible: onboardingVisible,
  } = useNativeOnboarding();
  const [onboardingRequesting, setOnboardingRequesting] = React.useState(false);
  const {
    addProduct: addShoppingProduct,
    changeQuantity: changeShoppingQuantity,
    clear: clearShoppingList,
    items: shoppingItems,
    loaded: shoppingListLoaded,
    removeProduct: removeShoppingProduct,
  } = useShoppingList();
  const {
    loaded: profilePreferencesLoaded,
    preferences: profilePreferences,
    save: savePreferences,
    saveDraft: savePreferencesDraft,
  } = useProfilePreferences(
    profile?.id ?? null,
    profile?.email ?? (pendingEmailVerification ? signUpEmail : null),
  );

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

  const locationSettingsLabel = React.useMemo(() => {
    if (onboardingState.locationMode === "share") {
      if (onboardingState.locationLatitude && onboardingState.locationLongitude) {
        return `Current location (${onboardingState.locationLatitude.toFixed(3)}, ${onboardingState.locationLongitude.toFixed(3)})`;
      }
      return "Current location";
    }
    if (onboardingState.locationMode === "postal" && onboardingState.postalCode) {
      return `Postal code ${onboardingState.postalCode}`;
    }
    return "Not set";
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
    onboardingState.postalCode,
  ]);

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

  const shoppingProductIds = React.useMemo(
    () => new Set(shoppingItems.map((item) => item.productId)),
    [shoppingItems],
  );
  const shoppingProductKey = React.useMemo(
    () => [...shoppingProductIds].sort().join("|"),
    [shoppingProductIds],
  );
  const shoppingRecommendation = React.useMemo(
    () => buildShoppingRecommendation(
      shoppingItems,
      shoppingPrices.map((price) => ({
        productId: price.product_id,
        storeId: price.store_id,
        storeName: price.store_name,
        storeArea: price.store_area,
        price: price.price,
      })),
    ),
    [shoppingItems, shoppingPrices],
  );

  const filteredStores = React.useMemo(() => {
    const q = mapQuery.trim().toLowerCase();
    if (!q) return mapStores;
    return mapStores.filter((store) =>
      `${store.brand ?? ""} ${store.name} ${store.area} ${store.price_note ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [mapQuery, mapStores]);

  const personalizationStoreOptions = React.useMemo(() => {
    const names = mapStores
      .map((store) => (store.brand ?? store.name).trim())
      .filter(Boolean);
    const uniqueNames = [...new Set(names)].slice(0, 10);
    return uniqueNames.length > 0
      ? uniqueNames
      : ["Costco", "Walmart", "No Frills", "Save-On-Foods", "T&T", "H Mart"];
  }, [mapStores]);

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

  const userMapLocation = React.useMemo(() => {
    if (
      onboardingState.locationMode !== "share" ||
      onboardingState.locationLatitude === null ||
      onboardingState.locationLongitude === null
    ) {
      return null;
    }

    return {
      latitude: onboardingState.locationLatitude,
      longitude: onboardingState.locationLongitude,
    };
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
  ]);

  const mapRegion = React.useMemo<Region>(() => {
    if (mapFocusMode === "user" && userMapLocation) {
      return {
        ...userMapLocation,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (!activeStore) {
      if (userMapLocation) {
        return {
          ...userMapLocation,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
      }
      return DEFAULT_REGION;
    }
    return {
      latitude: activeStore.latitude,
      longitude: activeStore.longitude,
      latitudeDelta: 0.045,
      longitudeDelta: 0.045,
    };
  }, [activeStore, mapFocusMode, userMapLocation]);

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

  React.useEffect(() => {
    if (
      onboardingState.locationMode === "share" &&
      onboardingState.locationLatitude !== null &&
      onboardingState.locationLongitude !== null
    ) {
      setMapFocusMode("user");
    }
  }, [
    onboardingState.locationLatitude,
    onboardingState.locationLongitude,
    onboardingState.locationMode,
  ]);

  React.useEffect(() => {
    configurePushNotificationHandler();
  }, []);

  React.useEffect(() => {
    if (!profile || !onboardingState.alertsEnabled) return;
    void registerPushTokenForCurrentUser();
  }, [onboardingState.alertsEnabled, profile]);

  React.useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (activeTab === "more" && accountRoute !== "settings") {
          setAccountRoute("settings");
          setMoreMessage(null);
          return true;
        }
        if (homeRoute === "detail") {
          setHomeRoute("catalog");
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }

    return;
  }, [accountRoute, activeTab, homeRoute]);

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

  const loadShoppingPrices = React.useCallback(async () => {
    const productIds = shoppingProductKey ? shoppingProductKey.split("|") : [];
    const requestId = shoppingRequestIdRef.current + 1;
    shoppingRequestIdRef.current = requestId;

    if (productIds.length === 0) {
      setShoppingPrices([]);
      setShoppingMessage(null);
      setShoppingPricesLoading(false);
      return;
    }

    setShoppingPricesLoading(true);
    const results = await Promise.all(
      productIds.map((productId) => listLatestStorePricesForProduct(productId)),
    );
    const settled = settleLatestListResults(
      requestId,
      shoppingRequestIdRef.current,
      results,
    );
    if (!settled) return;

    setShoppingPrices(settled.data);
    setShoppingMessage(settled.message);
    setShoppingPricesLoading(false);
  }, [shoppingProductKey]);

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
        : onboardingState.locationMode === "postal"
          ? onboardingState.postalCode ?? ""
          : "";

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

      if (!isAuthCallbackUrl(url)) return;

      handledAuthCallbackUrlsRef.current.add(url);
      setMoreLoading(true);
      const { data, error } = await completeAuthSessionFromUrl(url);
      setMoreLoading(false);

      if (!data.handled) return;

      setActiveTab("more");
      setAuthMode("signIn");

      if (error) {
        setAccountRoute("settings");
        setMoreMessage(error);
        showToast("Unable to complete sign in.");
        return;
      }

      setProfile(data.profile);
      setPendingEmailVerification(false);
      const callbackKind = classifyAuthCallbackType(data.type);
      if (callbackKind === "passwordRecovery") {
        setAccountRoute("resetPassword");
        setMoreMessage(null);
        showToast("Choose a new password.");
        return;
      }
      setAccountRoute("settings");
      const verifiedEmail = callbackKind === "emailVerification";
      setMoreMessage(
        verifiedEmail ? "Email verified. You're signed in." : "Signed in successfully.",
      );
      showToast(verifiedEmail ? "Email verified." : "Signed in.");
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
    if (!shoppingListLoaded || activeTab !== "watchlist") return;
    void loadShoppingPrices();
  }, [activeTab, loadShoppingPrices, shoppingListLoaded]);

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
    if (!activeStore || mapFocusMode !== "store") return;
    mapRef.current?.animateToRegion(mapRegion, 220);
  }, [activeStore, mapFocusMode, mapRegion]);

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

  const handleLocationShare = React.useCallback(async (
    source: "onboarding" | "settings" | "map" = "onboarding",
  ) => {
    setOnboardingRequesting(true);
    if (source === "settings") {
      setMoreLoading(true);
    }

    try {
      const permission = await requestLocationPermissionAndPosition();
      if (!permission.granted) {
        const message = permission.message ?? "Location access not available.";
        if (source === "map") {
          setMapMessage(message);
        } else {
          setHomeActionMessage(message);
        }
      } else {
        setHomeActionMessage(null);
        if (source === "map") {
          setMapMessage(null);
        }
      }

      const nextState: NativeOnboardingState = {
        ...onboardingState,
        locationCompleted: true,
        locationMode: "share",
        postalCode: permission.granted ? null : onboardingState.postalCode,
        locationLatitude: permission.latitude ?? null,
        locationLongitude: permission.longitude ?? null,
        alertsCompleted:
          source === "onboarding" ? false : onboardingState.alertsCompleted,
        alertsEnabled: onboardingState.alertsEnabled,
      };
      setOnboardingMessage(permission.message ?? null);
      if (source === "settings") {
        setMoreMessage(permission.message ?? null);
      }
      if (permission.granted) {
        setMapQuery("");
        if (
          source === "map" &&
          permission.latitude !== undefined &&
          permission.longitude !== undefined
        ) {
          setMapFocusMode("user");
          setFocusedStoreId("");
          mapRef.current?.animateToRegion(
            {
              latitude: permission.latitude,
              longitude: permission.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            },
            260,
          );
        }
      }

      await persistOnboardingState(nextState);
      if (source === "onboarding") {
        setOnboardingStep("alerts");
      }
      showToast(
        permission.granted
          ? source === "map"
            ? "Map centered on your location."
            : "Using live location mode."
          : "Location not granted. Continue with alerts.",
      );
    } catch {
      const message = "Location permission could not be checked.";
      setHomeActionMessage(message);
      if (source === "settings") {
        setMoreMessage(message);
      } else if (source === "map") {
        setMapMessage(message);
      } else {
        setOnboardingMessage(message);
      }
      showToast(message);
    } finally {
      setOnboardingRequesting(false);
      if (source === "settings") {
        setMoreLoading(false);
      }
    }
  }, [onboardingState, persistOnboardingState, showToast]);

  const handleLocationPostal = React.useCallback(async (source: "onboarding" | "settings" = "onboarding") => {
    const normalized = onboardingPostalCode.trim();
    if (!normalized) {
      const message = "Please enter postal code.";
      setHomeActionMessage(message);
      if (source === "settings") {
        setMoreMessage(message);
      }
      return;
    }

    const nextState: NativeOnboardingState = {
      ...onboardingState,
      locationCompleted: true,
      locationMode: "postal",
      postalCode: normalized,
      locationLatitude: null,
      locationLongitude: null,
      alertsCompleted:
        source === "onboarding" ? false : onboardingState.alertsCompleted,
      alertsEnabled: onboardingState.alertsEnabled,
    };
    setOnboardingMessage(null);
    if (source === "settings") {
      setMoreMessage(`Saved postal code ${normalized}.`);
    }
    await persistOnboardingState(nextState);
    setMapQuery(normalized);
    if (source === "onboarding") {
      setOnboardingStep("alerts");
    }
    showToast(`Saved postal code ${normalized}.`);
  }, [onboardingPostalCode, onboardingState, persistOnboardingState, showToast]);

  const handleEnableAlerts = React.useCallback(async (source: "onboarding" | "settings" = "onboarding") => {
    setOnboardingRequesting(true);
    if (source === "settings") {
      setMoreLoading(true);
    }

    try {
      const permission = await registerPushTokenForCurrentUser();

      if (source === "settings") {
        setMoreMessage(permission.message ?? null);
      } else {
        setOnboardingMessage(permission.message ?? null);
      }

      if (!permission.granted) {
        showToast(permission.message ?? "Alert permission not enabled.");
      }

      setOnboardingAlertsEnabled(permission.granted);
      const nextState: NativeOnboardingState = {
        ...onboardingState,
        alertsCompleted: true,
        alertsEnabled: permission.granted,
      };
      await persistOnboardingState(nextState);
      if (source === "onboarding") {
        setOnboardingVisible(false);
      }
      showToast(permission.granted ? "Alerts enabled." : "Alerts disabled.");
    } catch {
      const message = "Notification permission could not be checked.";
      if (source === "settings") {
        setMoreMessage(message);
      } else {
        setOnboardingMessage(message);
      }
      showToast(message);
    } finally {
      setOnboardingRequesting(false);
      if (source === "settings") {
        setMoreLoading(false);
      }
    }
  }, [onboardingState, persistOnboardingState, showToast]);

  const handleDisableAlerts = React.useCallback(async () => {
    const nextState: NativeOnboardingState = {
      ...onboardingState,
      alertsCompleted: true,
      alertsEnabled: false,
    };
    setMoreMessage("In-app alert prompts are off. You can also change OS notification access in Settings.");
    await persistOnboardingState(nextState);
    showToast("Alerts disabled.");
  }, [onboardingState, persistOnboardingState, showToast]);

  const handleSkipLocation = React.useCallback(async () => {
    const nextState: NativeOnboardingState = {
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
      await handleEnableAlerts("onboarding");
      return;
    }

    const skippedState: NativeOnboardingState = {
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
    handleEnableAlerts,
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
    setPendingEmailVerification(data.awaitingVerification);
    showToast(data.awaitingVerification ? "Account created. Verify your email." : "Account created.");
    setSignUpPassword("");
    await loadProfile(true);
    setAccountRoute(data.awaitingVerification ? "verify" : "personalize");
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
    setPendingEmailVerification(false);
    setMoreMessage(null);
    setSignInPassword("");
    setAccountRoute("settings");
    showToast("Signed in.");
    await loadWatchlist(true);
  }, [loadWatchlist, showToast, signInEmail, signInPassword]);

  const handleSocialSignIn = React.useCallback(async (
    provider: "apple" | "google",
  ) => {
    setMoreMessage(null);
    setSocialAuthLoading(provider);
    const result = provider === "apple"
      ? await signInWithApple()
      : await signInWithGoogle();
    setSocialAuthLoading(null);

    if (result.data.cancelled) return;
    if (!result.data.profile) {
      setMoreMessage(result.error ?? `Unable to sign in with ${provider}.`);
      return;
    }

    setProfile(result.data.profile);
    setPendingEmailVerification(false);
    setMoreMessage(result.error
      ? `Signed in, but some profile details could not sync: ${result.error}`
      : null);
    setAccountRoute(result.data.isNewUser ? "personalize" : "settings");
    showToast(`Signed in with ${provider === "apple" ? "Apple" : "Google"}.`);
    await loadWatchlist(true);
  }, [loadWatchlist, showToast]);

  const handleForgotPassword = React.useCallback(async (emailValue: string) => {
    const email = emailValue.trim();
    if (!email) {
      setMoreMessage("Enter your email first, then tap Forgot password.");
      return;
    }
    setMoreLoading(true);
    const { error } = await requestPasswordReset(email);
    setMoreLoading(false);
    setMoreMessage(error ?? "Password reset email sent. Open the link on this device.");
  }, []);

  const handleUpdateProfile = React.useCallback(async (nameValue: string, emailValue: string) => {
    const name = nameValue.trim();
    const email = emailValue.trim();
    if (!name || !email) {
      setMoreMessage("Name and email are required.");
      return;
    }
    setMoreLoading(true);
    const { data, error } = await updateUserProfile({ name, email });
    setMoreLoading(false);
    if (error) {
      setMoreMessage(error);
      return;
    }
    if (data.profile) setProfile(data.profile);
    setAccountRoute("settings");
    setMoreMessage(data.emailChangeRequested
      ? "Profile updated. Check your email to confirm the new address."
      : "Profile updated.");
    showToast("Profile updated.");
  }, [showToast]);

  const handleUpdatePassword = React.useCallback(async (password: string) => {
    if (password.length < 8) {
      setMoreMessage("Password must be at least 8 characters.");
      return;
    }
    setMoreLoading(true);
    const { error } = await updatePassword(password);
    setMoreLoading(false);
    if (error) {
      setMoreMessage(error);
      return;
    }
    setAccountRoute("settings");
    setMoreMessage("Password updated successfully.");
    showToast("Password updated.");
  }, [showToast]);

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
          setAuthMode("signIn");
          setAccountRoute("auth");
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

  const handleAddProductToShoppingList = React.useCallback(
    (product: MarketProduct) => {
      const alreadyAdded = shoppingProductIds.has(product.id);
      addShoppingProduct(product);
      showToast(alreadyAdded ? "Shopping list quantity increased." : "Added to shopping list.");
    },
    [addShoppingProduct, shoppingProductIds, showToast],
  );

  const handleAddShoppingProductFromHome = React.useCallback(
    (productId: string) => {
      const product = filteredHomeProducts.find((item) => item.id === productId);
      if (product) handleAddProductToShoppingList(product);
    },
    [filteredHomeProducts, handleAddProductToShoppingList],
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
    setPendingEmailVerification(false);
    setAccountRoute("settings");
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
    setPendingEmailVerification(false);
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
      setMapFocusMode("store");
      setActiveTab("map");
      setMapQuery(storeName ?? "");
      setOnboardingVisible(false);
    },
    [],
  );

  const focusStore = React.useCallback(
    (store: MarketStore) => {
      setMapFocusMode("store");
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

  const handleSelectTab = React.useCallback(
    (tabId: NativeTabId) => {
      if (tabId === "map" && userMapLocation) {
        setMapFocusMode("user");
      }
      if (tabId === "more") {
        setAccountRoute("settings");
        if (!pendingEmailVerification) setMoreMessage(null);
      }
      setActiveTab(tabId);
    },
    [pendingEmailVerification, userMapLocation],
  );

  const handleCloseAccountSubpage = React.useCallback(() => {
    setAccountRoute("settings");
    if (accountRoute === "auth") setMoreMessage(null);
  }, [accountRoute]);

  const handleSavePersonalization = React.useCallback(async (next: ProfilePreferences) => {
    setPreferencesSaving(true);
    const error = await savePreferences(next);
    setPreferencesSaving(false);
    setAccountRoute("settings");
    setMoreMessage(
      pendingEmailVerification
        ? "Preferences saved. Check your email to verify your account."
        : error
          ? "Preferences were saved on this device. Account sync will retry later."
          : "Shopping profile updated.",
    );
    showToast("Shopping profile updated.");
  }, [pendingEmailVerification, savePreferences, showToast]);

  const handleSkipPersonalization = React.useCallback(() => {
    void handleSavePersonalization({
      ...profilePreferences,
      completed: true,
    });
  }, [handleSavePersonalization, profilePreferences]);

  const handlePersonalizationDraft = React.useCallback((next: ProfilePreferences) => {
    savePreferencesDraft(next);
  }, [savePreferencesDraft]);

  const headerContent = (() => {
    if (activeTab === "home") {
      return homeRoute === "detail"
        ? { title: "Product Details", status: selectedHomeProduct?.category ?? "Price history" }
        : { title: "Discover", status: "Live prices" };
    }
    if (activeTab === "watchlist") {
      return {
        title: "Shopping List",
        status: `${shoppingItems.length} ${shoppingItems.length === 1 ? "item" : "items"}`,
      };
    }
    if (activeTab === "map") {
      return {
        title: "Nearby Stores",
        status: `${filteredStores.length} ${filteredStores.length === 1 ? "store" : "stores"}`,
      };
    }
    if (activeTab === "alerts") {
      return {
        title: "Price Alerts",
        status: unreadAlertCount > 0 ? `${unreadAlertCount} new` : "Up to date",
      };
    }
    if (accountRoute === "auth") {
      return authMode === "signIn"
        ? { title: "Sign In", status: "Account" }
        : { title: "Create Account", status: "Account" };
    }
    if (accountRoute === "verify") {
      return { title: "Verify Email", status: "Email sent" };
    }
    if (accountRoute === "personalize") {
      return { title: "Shopping Profile", status: "Optional" };
    }
    if (accountRoute === "editProfile") {
      return { title: "Edit Profile", status: "Account" };
    }
    if (accountRoute === "resetPassword") {
      return { title: "New Password", status: "Secure" };
    }
    return {
      title: "Account & Settings",
      status: profile ? "Signed in" : "Guest",
    };
  })();

  return (
    <View style={st.root}>
      <NativeContextHeader
        title={headerContent.title}
        status={headerContent.status}
        topInset={insets.top}
        pad={pad}
        onBack={activeTab === "more" && accountRoute !== "settings" ? handleCloseAccountSubpage : undefined}
      />
      <ScrollView
        style={st.scroll}
        contentContainerStyle={[
          st.scrollContent,
          {
            paddingHorizontal: pad,
            paddingBottom: activeTab === "more" && accountRoute !== "settings"
              ? 24 + Math.max(insets.bottom, 10)
              : 112 + Math.max(insets.bottom, 10),
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
            shoppingProductIds={shoppingProductIds}
            unreadAlertCount={unreadAlertCount}
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
            onAddToShoppingList={handleAddShoppingProductFromHome}
            onOpenAlerts={() => {
              setHomeRoute("catalog");
              setActiveTab("alerts");
            }}
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
              isInShoppingList={Boolean(selectedHomeProduct && shoppingProductIds.has(selectedHomeProduct.id))}
              onBack={() => setHomeRoute("catalog")}
              onAddToWatchlist={handleAddSelectedToWatchlist}
              onAddToShoppingList={() => {
                if (selectedHomeProduct) handleAddProductToShoppingList(selectedHomeProduct);
              }}
              onOpenStoreOnMap={handleOpenStoreOnMap}
            />
          </View>
        ) : null}

        {activeTab === "watchlist" ? (
          <ShoppingListPanel
            items={shoppingItems}
            loading={shoppingPricesLoading}
            message={shoppingMessage}
            recommendation={shoppingRecommendation}
            onChangeQuantity={changeShoppingQuantity}
            onClear={clearShoppingList}
            onRefresh={() => {
              void loadShoppingPrices();
            }}
            onRemove={removeShoppingProduct}
            onOpenStore={handleOpenStoreOnMap}
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
            userLocation={userMapLocation}
            locatingUser={onboardingRequesting}
            onChangeQuery={setMapQuery}
            onFocusStoreId={(storeId) => {
              setMapFocusMode("store");
              setFocusedStoreId(storeId);
            }}
            onFocusStore={focusStore}
            onUseCurrentLocation={() => {
              void handleLocationShare("map");
            }}
            onViewStoreInHome={handleSetHomeStoreFilter}
          />
        ) : null}

        {activeTab === "alerts" ? (
          <View style={st.listPageStack}>
            <SaleAlertsPanel
              alerts={saleAlerts}
              loading={alertsLoading}
              markingRead={alertsMarkingRead}
              message={alertsMessage}
              unreadCount={unreadAlertCount}
              onCheck={() => {
                void loadWatchlist(true);
              }}
              onMarkRead={() => {
                void handleMarkAlertsRead();
              }}
            />
            <View style={st.listSectionDivider} />
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
          </View>
        ) : null}

        {activeTab === "more" && accountRoute === "settings" ? (
          <MorePanel
            profile={profile}
            loading={moreLoading}
            message={moreMessage}
            locationLabel={locationSettingsLabel}
            alertsEnabled={onboardingState.alertsEnabled}
            settingsPostalCode={onboardingPostalCode}
            onChangeSettingsPostalCode={setOnboardingPostalCode}
            onShareLocation={() => {
              void handleLocationShare("settings");
            }}
            onSetPostalLocation={() => {
              void handleLocationPostal("settings");
            }}
            onEnableAlerts={() => {
              void handleEnableAlerts("settings");
            }}
            onDisableAlerts={() => {
              void handleDisableAlerts();
            }}
            onOpenAppSettings={() => {
              void Linking.openSettings();
            }}
            preferences={profilePreferences}
            deleteConfirming={deleteConfirming}
            deletingAccount={deletingAccount}
            onOpenSignIn={() => {
              setAuthMode("signIn");
              setMoreMessage(null);
              setAccountRoute("auth");
            }}
            onOpenSignUp={() => {
              setAuthMode("signUp");
              setMoreMessage(null);
              setAccountRoute("auth");
            }}
            onEditPreferences={() => setAccountRoute("personalize")}
            onEditProfile={() => {
              setMoreMessage(null);
              setAccountRoute("editProfile");
            }}
            onSignOut={handleSignOut}
            onStartDeleteAccount={() => setDeleteConfirming(true)}
            onCancelDeleteAccount={() => setDeleteConfirming(false)}
            onConfirmDeleteAccount={() => {
              void handleDeleteAccount();
            }}
          />
        ) : null}

        {activeTab === "more" && accountRoute === "auth" ? (
          <AccountAuthPanel
            mode={authMode}
            loading={moreLoading}
            socialLoading={socialAuthLoading}
            message={moreMessage}
            signInEmail={signInEmail}
            signInPassword={signInPassword}
            signUpName={signUpName}
            signUpEmail={signUpEmail}
            signUpPassword={signUpPassword}
            onChangeMode={(mode) => {
              setAuthMode(mode);
              setMoreMessage(null);
            }}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onSignInWithApple={() => {
              void handleSocialSignIn("apple");
            }}
            onSignInWithGoogle={() => {
              void handleSocialSignIn("google");
            }}
            onForgotPassword={(email) => {
              void handleForgotPassword(email);
            }}
            onChangeSignInEmail={setSignInEmail}
            onChangeSignInPassword={setSignInPassword}
            onChangeSignUpName={setSignUpName}
            onChangeSignUpEmail={setSignUpEmail}
            onChangeSignUpPassword={setSignUpPassword}
          />
        ) : null}

        {activeTab === "more" && accountRoute === "verify" ? (
          <EmailVerificationPanel
            email={signUpEmail}
            onContinue={() => setAccountRoute("personalize")}
            onLater={() => setAccountRoute("settings")}
          />
        ) : null}

        {activeTab === "more" && accountRoute === "personalize" && !profilePreferencesLoaded ? (
          <View style={st.authCard}>
            <Text style={st.authDescription}>Loading your shopping profile...</Text>
          </View>
        ) : null}

        {activeTab === "more" && accountRoute === "personalize" && profilePreferencesLoaded ? (
          <PersonalizationPanel
            initialPreferences={profilePreferences}
            storeOptions={personalizationStoreOptions}
            saving={preferencesSaving}
            onSave={(next) => {
              void handleSavePersonalization(next);
            }}
            onDraftChange={handlePersonalizationDraft}
            onSkip={handleSkipPersonalization}
          />
        ) : null}

        {activeTab === "more" && accountRoute === "editProfile" && profile ? (
          <EditProfilePanel
            profile={profile}
            loading={moreLoading}
            message={moreMessage}
            onSave={(name, email) => {
              void handleUpdateProfile(name, email);
            }}
          />
        ) : null}

        {activeTab === "more" && accountRoute === "resetPassword" ? (
          <ResetPasswordPanel
            loading={moreLoading}
            message={moreMessage}
            onSave={(password) => {
              void handleUpdatePassword(password);
            }}
          />
        ) : null}
      </ScrollView>

      {activeTab !== "more" || accountRoute === "settings" ? (
        <NativeBottomTabs
          activeTab={activeTab}
          bottomInset={insets.bottom}
          pad={pad}
          unreadAlertCount={unreadAlertCount}
          onSelectTab={handleSelectTab}
        />
      ) : null}

      <NativeAppOnboarding
        visible={onboardingVisible}
        step={onboardingStep}
        locationPostalCode={onboardingPostalCode}
        alertsEnabled={onboardingAlertsEnabled}
        requesting={onboardingRequesting}
        message={onboardingMessage}
        onChangePostalCode={setOnboardingPostalCode}
        onShareLocation={() => {
          void handleLocationShare("onboarding");
        }}
        onSetPostalLocation={() => {
          void handleLocationPostal("onboarding");
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
              bottom: activeTab === "more" && accountRoute !== "settings"
                ? 18 + Math.max(insets.bottom, 10)
                : 94 + Math.max(insets.bottom, 10),
            },
          ]}
        >
          <Text style={st.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
