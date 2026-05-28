import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useLayout from "../hooks/useLayout";
import { marketingPalette as C } from "../shared/design/palette";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  createProduct,
  createProductPrice,
  createStore,
  listProductCategories,
  listProductPriceHistory,
  listProducts,
  listStores,
  type MarketPricePoint,
  type MarketProduct,
  type MarketStore,
} from "../services/marketData";
import {
  getCurrentUserProfile,
  signOutUser,
  signUpUser,
  type UserProfile,
} from "../services/userProfile";
import {
  addWatchlistItem,
  listWatchlistItems,
  removeWatchlistItem,
  type WatchlistItem,
} from "../services/watchlist";

type NativeTabId = "home" | "watchlist" | "map" | "alerts" | "more";
type HomeRoute = "catalog" | "detail";

type SummaryCard = {
  id: string;
  label: string;
  value: string;
};

type AlertRow = {
  id: string;
  title: string;
  body: string;
  when: string;
};

const SUMMARY_CARDS: SummaryCard[] = [
  { id: "watch", label: "Watchlist", value: "0" },
  { id: "drop", label: "Price Drops Today", value: "2" },
  { id: "save", label: "Monthly Savings", value: "$94" },
];

const ALERT_ROWS: AlertRow[] = [
  {
    id: "a1",
    title: "Price hit your target",
    body: "Dish Soap is now $5.20 at Mart B.",
    when: "Today 09:42",
  },
  {
    id: "a2",
    title: "New lower price detected",
    body: "Baby Formula dropped by 8% at Market C.",
    when: "Yesterday 18:10",
  },
];

const DEFAULT_REGION: Region = {
  latitude: 37.5326,
  longitude: 126.991,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

const F = {
  regular: "Nunito_400Regular",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
} as const;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function shortWeekday(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function NativeAppScreen() {
  const { pad, w } = useLayout();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView | null>(null);

  const [activeTab, setActiveTab] = React.useState<NativeTabId>("home");

  const [homeRoute, setHomeRoute] = React.useState<HomeRoute>("catalog");
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
  const [homeHistoryLoading, setHomeHistoryLoading] = React.useState(false);
  const [homeHistoryMessage, setHomeHistoryMessage] = React.useState<string | null>(
    null,
  );
  const [homeActionMessage, setHomeActionMessage] = React.useState<string | null>(
    null,
  );
  const [homeAddSubmitting, setHomeAddSubmitting] = React.useState(false);

  const [watchlistItems, setWatchlistItems] = React.useState<WatchlistItem[]>([]);
  const [watchName, setWatchName] = React.useState("");
  const [watchStore, setWatchStore] = React.useState("");
  const [watchTargetPrice, setWatchTargetPrice] = React.useState("");
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [watchSubmitting, setWatchSubmitting] = React.useState(false);
  const [watchRemovingId, setWatchRemovingId] = React.useState<string | null>(null);
  const [watchMessage, setWatchMessage] = React.useState<string | null>(null);

  const [mapQuery, setMapQuery] = React.useState("");
  const [mapStores, setMapStores] = React.useState<MarketStore[]>([]);
  const [focusedStoreId, setFocusedStoreId] = React.useState("");
  const [mapLoading, setMapLoading] = React.useState(false);
  const [mapMessage, setMapMessage] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [moreMessage, setMoreMessage] = React.useState<string | null>(null);
  const [signUpName, setSignUpName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");

  const [adminProductName, setAdminProductName] = React.useState("");
  const [adminProductCategory, setAdminProductCategory] = React.useState("");
  const [adminProductThumb, setAdminProductThumb] = React.useState("");
  const [adminStoreName, setAdminStoreName] = React.useState("");
  const [adminStoreArea, setAdminStoreArea] = React.useState("");
  const [adminStoreLat, setAdminStoreLat] = React.useState("");
  const [adminStoreLng, setAdminStoreLng] = React.useState("");
  const [adminStoreNote, setAdminStoreNote] = React.useState("");
  const [adminPriceProductId, setAdminPriceProductId] = React.useState("");
  const [adminPriceStoreId, setAdminPriceStoreId] = React.useState("");
  const [adminPriceValue, setAdminPriceValue] = React.useState("");
  const [adminPriceObservedAt, setAdminPriceObservedAt] = React.useState("");
  const [adminSubmitting, setAdminSubmitting] = React.useState(false);
  const [adminMessage, setAdminMessage] = React.useState<string | null>(null);

  const tabs = React.useMemo(
    () => [
      { id: "home" as const, label: "Home" },
      { id: "watchlist" as const, label: "Watchlist" },
      { id: "map" as const, label: "Map" },
      { id: "alerts" as const, label: "Alert" },
      { id: "more" as const, label: "More" },
    ],
    [],
  );

  const summaryCards = React.useMemo(
    () =>
      SUMMARY_CARDS.map((card) =>
        card.id === "watch"
          ? { ...card, value: String(watchlistItems.length) }
          : card,
      ),
    [watchlistItems.length],
  );

  const selectedHomeProduct = React.useMemo(
    () => homeProducts.find((product) => product.id === selectedHomeProductId) ?? null,
    [homeProducts, selectedHomeProductId],
  );

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

    const source = homePriceHistory.slice(-7);
    const values = source.map((point) => point.price);
    const width = Math.max(240, Math.min(360, w - pad * 2 - 28));
    const height = 160;
    const padding = 14;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    const points = source.map((point, index) => {
      const x =
        source.length === 1
          ? width / 2
          : padding + (index / (source.length - 1)) * usableW;
      const y = padding + ((max - point.price) / range) * usableH;
      return {
        x,
        y,
        value: point.price,
        label: shortWeekday(point.observed_at),
        observed_at: point.observed_at,
      };
    });

    return {
      points,
      polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
      width,
      height,
      min,
      max,
      start: values[0],
      end: values[values.length - 1],
    };
  }, [homePriceHistory, pad, selectedHomeProduct, w]);

  const previousPriceRows = React.useMemo(() => {
    if (!homeChart || homeChart.points.length <= 1) return [];

    return homeChart.points
      .slice(0, -1)
      .map((point, index) => {
        const next = homeChart.points[index + 1];
        const diff = next.value - point.value;
        return {
          key: `${point.observed_at}-${index}`,
          label: point.label,
          price: point.value,
          diff,
        };
      })
      .reverse();
  }, [homeChart]);

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
    setMapLoading(true);
    const { data, error } = await listStores({ search: mapQuery });
    setMapStores(data);
    setMapLoading(false);

    if (error) {
      setMapMessage(error);
    } else {
      setMapMessage(null);
    }

    if (data.length > 0) {
      setFocusedStoreId((prev) => prev || data[0].id);
    }
  }, [mapQuery]);

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
  }, [activeTab, loadHomeProducts]);

  React.useEffect(() => {
    if (homeProducts.length === 0) {
      setSelectedHomeProductId("");
      return;
    }

    const hasSelected = homeProducts.some(
      (product) => product.id === selectedHomeProductId,
    );

    if (!hasSelected) {
      setSelectedHomeProductId(homeProducts[0].id);
    }
  }, [homeProducts, selectedHomeProductId]);

  React.useEffect(() => {
    setHomeActionMessage(null);
  }, [homeRoute, selectedHomeProductId]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    if (homeRoute !== "detail") return;
    if (!selectedHomeProductId) return;
    void loadHomePriceHistory(selectedHomeProductId);
  }, [activeTab, homeRoute, loadHomePriceHistory, selectedHomeProductId]);

  React.useEffect(() => {
    if (activeTab !== "watchlist") return;
    void loadWatchlist();
  }, [activeTab, loadWatchlist]);

  React.useEffect(() => {
    if (activeTab !== "map") return;
    void loadMapStores();
  }, [activeTab, loadMapStores]);

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

  const handleAddWatchlistItem = React.useCallback(async () => {
    const name = watchName.trim();
    const store = watchStore.trim();

    if (!name) {
      setWatchMessage("Item name is required.");
      return;
    }
    if (!store) {
      setWatchMessage("Store name is required.");
      return;
    }

    setWatchSubmitting(true);
    const { error } = await addWatchlistItem({
      name,
      store,
      targetPrice: watchTargetPrice,
    });
    setWatchSubmitting(false);

    if (error) {
      setWatchMessage(error);
      return;
    }

    setWatchName("");
    setWatchStore("");
    setWatchTargetPrice("");
    setWatchMessage("Added to your watchlist.");
    await loadWatchlist(true);
  }, [loadWatchlist, watchName, watchStore, watchTargetPrice]);

  const handleRemoveWatchlistItem = React.useCallback(
    async (itemId: string) => {
      setWatchRemovingId(itemId);
      const { error } = await removeWatchlistItem(itemId);
      setWatchRemovingId(null);

      if (error) {
        setWatchMessage(error);
        return;
      }

      setWatchMessage("Removed from your watchlist.");
      await loadWatchlist(true);
    },
    [loadWatchlist],
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
    setSignUpPassword("");
    await loadProfile(true);
  }, [loadProfile, signUpEmail, signUpName, signUpPassword]);

  const handleAddSelectedToWatchlist = React.useCallback(async () => {
    if (!selectedHomeProduct) return;

    setHomeAddSubmitting(true);
    const { error } = await addWatchlistItem({
      name: selectedHomeProduct.name,
      store: "Home Catalog",
      targetPrice:
        selectedHomeProduct.current_price !== null
          ? selectedHomeProduct.current_price.toFixed(2)
          : undefined,
    });
    setHomeAddSubmitting(false);

    if (error) {
      setHomeActionMessage(error);
      return;
    }

    setHomeActionMessage("Added to your watchlist.");
    await loadWatchlist(true);
  }, [loadWatchlist, selectedHomeProduct]);

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
  }, []);

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

  const handleCreateProduct = React.useCallback(async () => {
    const name = adminProductName.trim();
    const category = adminProductCategory.trim();

    if (!name || !category) {
      setAdminMessage("Product name and category are required.");
      return;
    }

    setAdminSubmitting(true);
    const { error } = await createProduct({
      name,
      category,
      thumbnailUrl: adminProductThumb,
    });
    setAdminSubmitting(false);

    if (error) {
      setAdminMessage(error);
      return;
    }

    setAdminMessage("Product created.");
    setAdminProductName("");
    setAdminProductCategory("");
    setAdminProductThumb("");
    await loadHomeCategories();
    await loadHomeProducts();
  }, [adminProductCategory, adminProductName, adminProductThumb, loadHomeCategories, loadHomeProducts]);

  const handleCreateStore = React.useCallback(async () => {
    const name = adminStoreName.trim();
    const area = adminStoreArea.trim();

    if (!name || !area || !adminStoreLat.trim() || !adminStoreLng.trim()) {
      setAdminMessage("Store name, area, latitude, and longitude are required.");
      return;
    }

    setAdminSubmitting(true);
    const { error } = await createStore({
      name,
      area,
      latitude: adminStoreLat,
      longitude: adminStoreLng,
      priceNote: adminStoreNote,
    });
    setAdminSubmitting(false);

    if (error) {
      setAdminMessage(error);
      return;
    }

    setAdminMessage("Store created.");
    setAdminStoreName("");
    setAdminStoreArea("");
    setAdminStoreLat("");
    setAdminStoreLng("");
    setAdminStoreNote("");
    await loadMapStores();
  }, [adminStoreArea, adminStoreLat, adminStoreLng, adminStoreName, adminStoreNote, loadMapStores]);

  const handleCreatePrice = React.useCallback(async () => {
    if (!adminPriceProductId.trim() || !adminPriceStoreId.trim()) {
      setAdminMessage("Product ID and Store ID are required.");
      return;
    }
    if (!adminPriceValue.trim()) {
      setAdminMessage("Price is required.");
      return;
    }

    setAdminSubmitting(true);
    const { error } = await createProductPrice({
      productId: adminPriceProductId,
      storeId: adminPriceStoreId,
      price: adminPriceValue,
      observedAt: adminPriceObservedAt,
    });
    setAdminSubmitting(false);

    if (error) {
      setAdminMessage(error);
      return;
    }

    setAdminMessage("Price entry created.");
    setAdminPriceValue("");
    setAdminPriceObservedAt("");
    if (selectedHomeProductId === adminPriceProductId) {
      await loadHomePriceHistory(selectedHomeProductId);
      await loadHomeProducts();
    }
  }, [
    adminPriceObservedAt,
    adminPriceProductId,
    adminPriceStoreId,
    adminPriceValue,
    loadHomePriceHistory,
    loadHomeProducts,
    selectedHomeProductId,
  ]);

  return (
    <View style={st.root}>
      <View
        style={[
          st.topBar,
          {
            paddingTop: Math.max(insets.top, 8) + 4,
            paddingBottom: 10,
            paddingHorizontal: pad,
          },
        ]}
      >
        <Text style={st.brand}>PocketCart</Text>
        <View style={st.alphaPill}>
          <Text style={st.alphaText}>Native Alpha</Text>
        </View>
      </View>

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
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Home</Text>
            <Text style={st.sectionSub}>
              Search and browse products, then open detail page for trend data.
            </Text>

            <View style={st.searchCard}>
              <TextInput
                value={homeQuery}
                onChangeText={setHomeQuery}
                placeholder="Search products"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={st.searchInput}
              />
            </View>

            <View style={st.categoryRow}>
              {["All", ...homeCategories].map((category) => {
                const active = homeCategory === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    onPress={() => setHomeCategory(category)}
                    style={[st.categoryChip, active && st.categoryChipActive]}
                  >
                    <Text style={[st.categoryChipText, active && st.categoryChipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={st.summaryPanel}>
              {summaryCards.map((card, index) => (
                <View
                  key={card.id}
                  style={[
                    st.summaryRow,
                    index < summaryCards.length - 1 && st.summaryRowDivider,
                  ]}
                >
                  <Text style={st.summaryLabel}>{card.label}</Text>
                  <Text style={st.summaryValue}>{card.value}</Text>
                </View>
              ))}
            </View>

            {homeMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{homeMessage}</Text>
              </View>
            ) : null}

            {homeLoading ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>Loading products...</Text>
              </View>
            ) : homeProducts.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>No products found for this filter.</Text>
              </View>
            ) : (
              homeProducts.map((product) => {
                const active = selectedHomeProduct?.id === product.id;
                return (
                  <Pressable
                    key={product.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedHomeProductId(product.id);
                      setHomeRoute("detail");
                    }}
                    style={[st.rowCard, active && st.rowCardActive]}
                  >
                    <View style={st.productRow}>
                      <View style={st.productMain}>
                        <Text style={st.itemName}>{product.name}</Text>
                        <Text style={st.itemMeta}>{product.category}</Text>
                        <Text style={st.storePrice}>
                          Current {product.current_price !== null ? money.format(product.current_price) : "-"}
                        </Text>
                      </View>
                      <View style={st.productThumb}>
                        {product.thumbnail_url ? (
                          <Image
                            source={{ uri: product.thumbnail_url }}
                            style={st.productThumbImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={st.productThumbPlaceholder}>
                            <Text style={st.productThumbPlaceholderText}>IMG</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        {activeTab === "home" && homeRoute === "detail" ? (
          <View style={st.sectionStack}>
            <View style={st.detailActionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHomeRoute("catalog")}
                style={[st.authBtn, st.authBtnSecondary, st.detailActionBtn]}
              >
                <Text style={st.authBtnSecondaryText}>Back to Product List</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleAddSelectedToWatchlist}
                style={[st.authBtn, st.authBtnPrimary, st.detailActionBtn]}
                disabled={homeAddSubmitting || !selectedHomeProduct}
              >
                <Text style={st.authBtnPrimaryText}>
                  {homeAddSubmitting ? "Adding..." : "Add to Watchlist"}
                </Text>
              </Pressable>
            </View>

            {selectedHomeProduct ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>{selectedHomeProduct.name}</Text>
                <Text style={st.sectionSub}>Price trend detail</Text>
                {homeActionMessage ? <Text style={st.itemMeta}>{homeActionMessage}</Text> : null}
                {homeHistoryMessage ? <Text style={st.itemMeta}>{homeHistoryMessage}</Text> : null}

                {homeHistoryLoading ? (
                  <Text style={st.itemMeta}>Loading price history...</Text>
                ) : !homeChart ? (
                  <Text style={st.itemMeta}>No price history yet for this product.</Text>
                ) : (
                  <>
                    <Text style={st.itemMeta}>
                      Lowest {money.format(homeChart.min)} / Highest {money.format(homeChart.max)}
                    </Text>

                    <View style={st.chartWrap}>
                      <Svg width={homeChart.width} height={homeChart.height}>
                        <Line
                          x1={14}
                          y1={homeChart.height - 14}
                          x2={homeChart.width - 14}
                          y2={homeChart.height - 14}
                          stroke={C.line}
                          strokeWidth={1}
                        />
                        <Line
                          x1={14}
                          y1={14}
                          x2={14}
                          y2={homeChart.height - 14}
                          stroke={C.line}
                          strokeWidth={1}
                        />
                        <Polyline
                          points={homeChart.polyline}
                          fill="none"
                          stroke={C.primary}
                          strokeWidth={3}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {homeChart.points.map((point, idx) => (
                          <Circle
                            key={`${point.observed_at}-${idx}`}
                            cx={point.x}
                            cy={point.y}
                            r={3.8}
                            fill={idx === homeChart.points.length - 1 ? C.primaryDeep : C.white}
                            stroke={C.primary}
                            strokeWidth={2}
                          />
                        ))}
                      </Svg>
                    </View>

                    <View style={st.chartMetaRow}>
                      <Text style={st.chartMetaText}>
                        {homeChart.points[0].label}: {money.format(homeChart.start)}
                      </Text>
                      <Text style={st.chartMetaText}>
                        {homeChart.points[homeChart.points.length - 1].label}: {money.format(homeChart.end)}
                      </Text>
                    </View>

                    <Text style={st.historyTitle}>Previous Prices</Text>
                    {previousPriceRows.length === 0 ? (
                      <Text style={st.itemMeta}>No previous prices available.</Text>
                    ) : (
                      previousPriceRows.map((row) => (
                        <View key={row.key} style={st.historyRow}>
                          <Text style={st.historyLabel}>{row.label}</Text>
                          <Text style={st.historyPrice}>{money.format(row.price)}</Text>
                          <Text
                            style={[
                              st.historyDiff,
                              row.diff > 0 ? st.historyDiffUp : st.historyDiffDown,
                            ]}
                          >
                            {row.diff > 0 ? "+" : ""}
                            {money.format(row.diff)}
                          </Text>
                        </View>
                      ))
                    )}
                  </>
                )}
              </View>
            ) : (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>Product not found. Go back and choose again.</Text>
              </View>
            )}
          </View>
        ) : null}

        {activeTab === "watchlist" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Watchlist</Text>
            <Text style={st.sectionSub}>Only items you add are shown here.</Text>

            {!hasSupabaseEnv ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Supabase configuration required</Text>
                <Text style={st.itemMeta}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </Text>
              </View>
            ) : (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Add Watchlist Item</Text>
                <TextInput
                  value={watchName}
                  onChangeText={setWatchName}
                  placeholder="Item name"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={watchStore}
                  onChangeText={setWatchStore}
                  placeholder="Store"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={watchTargetPrice}
                  onChangeText={setWatchTargetPrice}
                  placeholder="Target price (optional)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="decimal-pad"
                  style={st.formInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleAddWatchlistItem}
                  style={[st.authBtn, st.authBtnPrimary]}
                  disabled={watchSubmitting}
                >
                  <Text style={st.authBtnPrimaryText}>
                    {watchSubmitting ? "Adding..." : "Add Item"}
                  </Text>
                </Pressable>
              </View>
            )}

            {watchMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{watchMessage}</Text>
              </View>
            ) : null}

            {watchLoading ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>Loading watchlist...</Text>
              </View>
            ) : watchlistItems.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>No watchlist items yet. Add your first item above.</Text>
              </View>
            ) : (
              watchlistItems.map((item) => (
                <View key={item.id} style={st.rowCard}>
                  <View style={st.watchRowTop}>
                    <View style={st.watchRowMain}>
                      <Text style={st.itemName}>{item.name}</Text>
                      <Text style={st.itemMeta}>{item.store}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        void handleRemoveWatchlistItem(item.id);
                      }}
                      style={[st.removeBtn, watchRemovingId === item.id && st.removeBtnDisabled]}
                      disabled={watchRemovingId === item.id}
                    >
                      <Text style={st.removeBtnText}>
                        {watchRemovingId === item.id ? "Removing..." : "Remove"}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={st.tagRow}>
                    <Text style={st.tag}>Target {item.target_price?.trim() || "-"}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "map" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Map</Text>
            <Text style={st.sectionSub}>Search stores and jump directly to their location.</Text>

            <View style={st.searchCard}>
              <TextInput
                value={mapQuery}
                onChangeText={setMapQuery}
                placeholder="Search store or area"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={st.searchInput}
              />
            </View>

            {mapMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{mapMessage}</Text>
              </View>
            ) : null}

            <View style={st.mapCard}>
              <MapView
                ref={mapRef}
                initialRegion={mapRegion}
                style={st.mapView}
              >
                {filteredStores.map((store) => {
                  const active = store.id === focusedStoreId;
                  return (
                    <Marker
                      key={store.id}
                      coordinate={{
                        latitude: store.latitude,
                        longitude: store.longitude,
                      }}
                      title={store.name}
                      description={`${store.area} • ${store.price_note ?? ""}`}
                      pinColor={active ? C.primaryDeep : C.primary}
                      onPress={() => setFocusedStoreId(store.id)}
                    />
                  );
                })}
              </MapView>
            </View>

            <Text style={st.resultMeta}>Search results: {filteredStores.length}</Text>
            {mapLoading ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>Loading stores...</Text>
              </View>
            ) : filteredStores.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>No matches found. Try another store or area.</Text>
              </View>
            ) : (
              filteredStores.map((store) => {
                const active = store.id === focusedStoreId;
                return (
                  <Pressable
                    key={store.id}
                    accessibilityRole="button"
                    onPress={() => focusStore(store)}
                    style={[st.rowCard, active && st.rowCardActive]}
                  >
                    <Text style={st.itemName}>{store.name}</Text>
                    <Text style={st.itemMeta}>{store.area}</Text>
                    <Text style={st.storePrice}>{store.price_note ?? "Price note unavailable"}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        {activeTab === "alerts" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Alert</Text>
            <Text style={st.sectionSub}>Notification center placeholder.</Text>
            {ALERT_ROWS.map((row) => (
              <View key={row.id} style={st.rowCard}>
                <Text style={st.alertTitle}>{row.title}</Text>
                <Text style={st.itemMeta}>{row.body}</Text>
                <Text style={st.alertTime}>{row.when}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === "more" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>More</Text>
            <Text style={st.sectionSub}>Create account and manage your profile/data.</Text>

            {!hasSupabaseEnv ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Supabase configuration required</Text>
                <Text style={st.itemMeta}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </Text>
              </View>
            ) : profile ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Profile</Text>
                <Text style={st.itemMeta}>Name: {profile.full_name ?? "-"}</Text>
                <Text style={st.itemMeta}>Email: {profile.email || "-"}</Text>
                <Text style={st.itemMeta}>User ID: {profile.id}</Text>
                <View style={st.authActionRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void loadProfile();
                    }}
                    style={[st.authBtn, st.authBtnSecondary]}
                    disabled={moreLoading}
                  >
                    <Text style={st.authBtnSecondaryText}>
                      {moreLoading ? "Loading..." : "Refresh"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleSignOut}
                    style={[st.authBtn, st.authBtnPrimary]}
                    disabled={moreLoading}
                  >
                    <Text style={st.authBtnPrimaryText}>Sign Out</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Sign Up</Text>
                <Text style={st.itemMeta}>Create your account with email and password.</Text>

                <TextInput
                  value={signUpName}
                  onChangeText={setSignUpName}
                  placeholder="Name"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={signUpEmail}
                  onChangeText={setSignUpEmail}
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={signUpPassword}
                  onChangeText={setSignUpPassword}
                  placeholder="Password (min 8)"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSignUp}
                  style={[st.authBtn, st.authBtnPrimary]}
                  disabled={moreLoading}
                >
                  <Text style={st.authBtnPrimaryText}>
                    {moreLoading ? "Creating..." : "Create Account"}
                  </Text>
                </Pressable>
              </View>
            )}

            {profile ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Admin Data Entry (MVP)</Text>
                <Text style={st.itemMeta}>Add product, store, and price records manually.</Text>

                <Text style={st.adminTitle}>Create Product</Text>
                <TextInput
                  value={adminProductName}
                  onChangeText={setAdminProductName}
                  placeholder="Product name"
                  placeholderTextColor={C.textMuted}
                  style={st.formInput}
                />
                <TextInput
                  value={adminProductCategory}
                  onChangeText={setAdminProductCategory}
                  placeholder="Category"
                  placeholderTextColor={C.textMuted}
                  style={st.formInput}
                />
                <TextInput
                  value={adminProductThumb}
                  onChangeText={setAdminProductThumb}
                  placeholder="Thumbnail URL (optional)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCreateProduct}
                  style={[st.authBtn, st.authBtnSecondary]}
                  disabled={adminSubmitting}
                >
                  <Text style={st.authBtnSecondaryText}>Save Product</Text>
                </Pressable>

                <Text style={st.adminTitle}>Create Store</Text>
                <TextInput
                  value={adminStoreName}
                  onChangeText={setAdminStoreName}
                  placeholder="Store name"
                  placeholderTextColor={C.textMuted}
                  style={st.formInput}
                />
                <TextInput
                  value={adminStoreArea}
                  onChangeText={setAdminStoreArea}
                  placeholder="Area"
                  placeholderTextColor={C.textMuted}
                  style={st.formInput}
                />
                <TextInput
                  value={adminStoreLat}
                  onChangeText={setAdminStoreLat}
                  placeholder="Latitude"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={st.formInput}
                />
                <TextInput
                  value={adminStoreLng}
                  onChangeText={setAdminStoreLng}
                  placeholder="Longitude"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={st.formInput}
                />
                <TextInput
                  value={adminStoreNote}
                  onChangeText={setAdminStoreNote}
                  placeholder="Price note (optional)"
                  placeholderTextColor={C.textMuted}
                  style={st.formInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCreateStore}
                  style={[st.authBtn, st.authBtnSecondary]}
                  disabled={adminSubmitting}
                >
                  <Text style={st.authBtnSecondaryText}>Save Store</Text>
                </Pressable>

                <Text style={st.adminTitle}>Create Price Entry</Text>
                <TextInput
                  value={adminPriceProductId}
                  onChangeText={setAdminPriceProductId}
                  placeholder="Product ID"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={adminPriceStoreId}
                  onChangeText={setAdminPriceStoreId}
                  placeholder="Store ID"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <TextInput
                  value={adminPriceValue}
                  onChangeText={setAdminPriceValue}
                  placeholder="Price"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  style={st.formInput}
                />
                <TextInput
                  value={adminPriceObservedAt}
                  onChangeText={setAdminPriceObservedAt}
                  placeholder="Observed at (optional, ISO date)"
                  placeholderTextColor={C.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.formInput}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={handleCreatePrice}
                  style={[st.authBtn, st.authBtnSecondary]}
                  disabled={adminSubmitting}
                >
                  <Text style={st.authBtnSecondaryText}>Save Price Entry</Text>
                </Pressable>
              </View>
            ) : null}

            {moreMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{moreMessage}</Text>
              </View>
            ) : null}

            {adminMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{adminMessage}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          st.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            paddingHorizontal: pad,
          },
        ]}
      >
        <View style={st.tabRow}>
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                onPress={() => setActiveTab(tab.id)}
                style={[st.tabBtn, active && st.tabBtnActive]}
              >
                <Text style={[st.tabText, active && st.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  topBar: {
    minHeight: 68,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    backgroundColor: C.glass,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: C.text,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  alphaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alphaText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 18,
  },
  sectionStack: {
    gap: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  sectionSub: {
    color: C.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.regular,
  },
  searchCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  searchInput: {
    height: 46,
    color: C.text,
    fontSize: 14,
    fontFamily: F.semibold,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipActive: {
    backgroundColor: C.primaryGhost,
    borderColor: C.primary,
  },
  categoryChipText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  categoryChipTextActive: {
    color: C.primaryDeep,
  },
  summaryPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  summaryRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  summaryRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  summaryLabel: {
    color: C.textSoft,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  summaryValue: {
    color: C.primaryDeep,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  rowCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 14,
    gap: 6,
  },
  rowCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryGhost,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  productMain: {
    flex: 1,
    gap: 4,
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
  },
  productThumbImage: {
    width: "100%",
    height: "100%",
  },
  productThumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryGhost,
  },
  productThumbPlaceholderText: {
    color: C.primaryDeep,
    fontSize: 12,
    fontWeight: "800",
    fontFamily: F.extraBold,
    letterSpacing: 0.6,
  },
  detailActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailActionBtn: {
    flex: 1,
  },
  chartWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chartMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  chartMetaText: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.bold,
  },
  historyTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: F.extraBold,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  historyLabel: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.bold,
  },
  historyPrice: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  historyDiff: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  historyDiffUp: {
    color: "#A83939",
  },
  historyDiffDown: {
    color: C.primaryDeep,
  },
  watchRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  watchRowMain: {
    flex: 1,
    gap: 4,
  },
  removeBtn: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9A0A0",
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  removeBtnDisabled: {
    opacity: 0.6,
  },
  removeBtnText: {
    color: "#A83939",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  mapCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  mapView: {
    width: "100%",
    height: 260,
  },
  resultMeta: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.bold,
  },
  adminTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: F.extraBold,
    marginTop: 6,
  },
  formInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: F.semibold,
  },
  itemName: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  itemMeta: {
    color: C.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: F.regular,
  },
  storePrice: {
    color: C.primaryDeep,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tag: {
    borderRadius: 999,
    backgroundColor: C.primaryGhost,
    color: C.primaryDeep,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontFamily: F.bold,
  },
  alertTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  alertTime: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  authActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  authBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  authBtnPrimary: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  authBtnSecondary: {
    backgroundColor: C.white,
    borderColor: C.line,
  },
  authBtnPrimaryText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  authBtnSecondaryText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.white,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  tabText: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: F.bold,
  },
  tabTextActive: {
    color: C.white,
    fontFamily: F.bold,
  },
});
