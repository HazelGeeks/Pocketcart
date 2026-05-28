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
  getCurrentUserProfile,
  signOutUser,
  signUpUser,
  type UserProfile,
} from "../services/userProfile";
import {
  addWatchlistItem,
  listWatchlistItems,
  type WatchlistItem,
} from "../services/watchlist";

type NativeTabId = "home" | "watchlist" | "map" | "alerts" | "more";
type HomeRoute = "catalog" | "detail";

type SummaryCard = {
  id: string;
  label: string;
  value: string;
};

type HomeProduct = {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  priceHistory: number[];
  thumbnailUri?: string;
};

type AlertRow = {
  id: string;
  title: string;
  body: string;
  when: string;
};

type MapStore = {
  id: string;
  name: string;
  area: string;
  priceNote: string;
  latitude: number;
  longitude: number;
};

const SUMMARY_CARDS: SummaryCard[] = [
  { id: "watch", label: "Watchlist", value: "0" },
  { id: "drop", label: "Price Drops Today", value: "2" },
  { id: "save", label: "Monthly Savings", value: "$94" },
];

const HOME_PRODUCTS: HomeProduct[] = [
  {
    id: "rice-10kg",
    name: "Premium Rice 10kg",
    category: "Grains",
    currentPrice: 36.9,
    priceHistory: [39.8, 38.9, 38.1, 37.4, 37.1, 36.9, 36.9],
  },
  {
    id: "olive-oil-1l",
    name: "Olive Oil 1L",
    category: "Cooking",
    currentPrice: 12.4,
    priceHistory: [13.5, 13.2, 12.9, 12.7, 12.5, 12.4, 12.4],
  },
  {
    id: "whole-bean-coffee-1kg",
    name: "Whole Bean Coffee 1kg",
    category: "Beverage",
    currentPrice: 18.6,
    priceHistory: [20.5, 20.2, 19.7, 19.1, 18.9, 18.7, 18.6],
  },
  {
    id: "baby-formula-900g",
    name: "Baby Formula 900g",
    category: "Baby",
    currentPrice: 28.3,
    priceHistory: [30.2, 29.8, 29.3, 28.9, 28.6, 28.4, 28.3],
  },
  {
    id: "dish-soap-4l",
    name: "Dish Soap 4L",
    category: "Household",
    currentPrice: 5.2,
    priceHistory: [6.1, 5.9, 5.8, 5.7, 5.5, 5.4, 5.2],
  },
  {
    id: "milk-2l",
    name: "Milk 2L",
    category: "Dairy",
    currentPrice: 3.9,
    priceHistory: [4.3, 4.2, 4.1, 4.0, 3.95, 3.92, 3.9],
  },
];

const PRICE_WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const MAP_STORES: MapStore[] = [
  {
    id: "gangnam-mart",
    name: "Gangnam Fresh Mart",
    area: "Gangnam Station",
    priceNote: "Eggs 30pk $7.40",
    latitude: 37.498095,
    longitude: 127.02761,
  },
  {
    id: "hongdae-market",
    name: "Hongdae Smart Market",
    area: "Hongik Univ. Area",
    priceNote: "Chicken breast 1kg $8.90",
    latitude: 37.557192,
    longitude: 126.925381,
  },
  {
    id: "jamsil-store",
    name: "Jamsil Family Store",
    area: "Jamsil / Songpa",
    priceNote: "Olive oil 1L $11.20",
    latitude: 37.513319,
    longitude: 127.100188,
  },
  {
    id: "yeouido-hub",
    name: "Yeouido Daily Hub",
    area: "Yeouido Financial District",
    priceNote: "Milk 2L $3.90",
    latitude: 37.521939,
    longitude: 126.924218,
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

export default function NativeAppScreen() {
  const { pad, w } = useLayout();
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView | null>(null);
  const [activeTab, setActiveTab] = React.useState<NativeTabId>("home");
  const [mapQuery, setMapQuery] = React.useState("");
  const [focusedStoreId, setFocusedStoreId] =
    React.useState<string>(MAP_STORES[0].id);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [moreLoading, setMoreLoading] = React.useState(false);
  const [moreMessage, setMoreMessage] = React.useState<string | null>(null);
  const [signUpName, setSignUpName] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [watchlistItems, setWatchlistItems] = React.useState<WatchlistItem[]>([]);
  const [watchName, setWatchName] = React.useState("");
  const [watchStore, setWatchStore] = React.useState("");
  const [watchTargetPrice, setWatchTargetPrice] = React.useState("");
  const [watchLoading, setWatchLoading] = React.useState(false);
  const [watchSubmitting, setWatchSubmitting] = React.useState(false);
  const [watchMessage, setWatchMessage] = React.useState<string | null>(null);
  const [homeQuery, setHomeQuery] = React.useState("");
  const [selectedHomeProductId, setSelectedHomeProductId] = React.useState(
    HOME_PRODUCTS[0].id,
  );
  const [homeRoute, setHomeRoute] = React.useState<HomeRoute>("catalog");
  const [homeActionMessage, setHomeActionMessage] = React.useState<string | null>(
    null,
  );
  const [homeAddSubmitting, setHomeAddSubmitting] = React.useState(false);

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

  const filteredStores = React.useMemo(() => {
    const q = mapQuery.trim().toLowerCase();
    if (!q) return MAP_STORES;

    return MAP_STORES.filter((store) =>
      `${store.name} ${store.area} ${store.priceNote}`.toLowerCase().includes(q),
    );
  }, [mapQuery]);

  const filteredHomeProducts = React.useMemo(() => {
    const q = homeQuery.trim().toLowerCase();
    if (!q) return HOME_PRODUCTS;

    return HOME_PRODUCTS.filter((product) =>
      `${product.name} ${product.category}`.toLowerCase().includes(q),
    );
  }, [homeQuery]);

  const selectedHomeProduct = React.useMemo(
    () =>
      HOME_PRODUCTS.find((product) => product.id === selectedHomeProductId) ??
      HOME_PRODUCTS[0] ??
      null,
    [selectedHomeProductId],
  );

  const homeChart = React.useMemo(() => {
    if (!selectedHomeProduct) return null;

    const values = selectedHomeProduct.priceHistory;
    const width = Math.max(240, Math.min(360, w - pad * 2 - 28));
    const height = 160;
    const padding = 14;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    const points = values.map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * usableW;
      const y = padding + ((max - value) / range) * usableH;
      return { x, y, value, label: PRICE_WEEK_LABELS[index] ?? `D${index + 1}` };
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
  }, [pad, selectedHomeProduct, w]);

  const previousPriceRows = React.useMemo(() => {
    if (!selectedHomeProduct) return [];
    const values = selectedHomeProduct.priceHistory;
    if (values.length <= 1) return [];

    return values
      .slice(0, -1)
      .map((price, index) => {
        const next = values[index + 1];
        const diff = next - price;
        return {
          key: `${selectedHomeProduct.id}-${index}`,
          label: PRICE_WEEK_LABELS[index] ?? `D${index + 1}`,
          price,
          diff,
        };
      })
      .reverse();
  }, [selectedHomeProduct]);

  const summaryCards = React.useMemo(
    () =>
      SUMMARY_CARDS.map((card) =>
        card.id === "watch"
          ? { ...card, value: String(watchlistItems.length) }
          : card,
      ),
    [watchlistItems.length],
  );

  const focusStore = React.useCallback((store: MapStore) => {
    setFocusedStoreId(store.id);
    mapRef.current?.animateToRegion(
      {
        latitude: store.latitude,
        longitude: store.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      240,
    );
  }, []);

  const focusFirstSearchResult = React.useCallback(() => {
    if (filteredStores.length === 0) return;
    focusStore(filteredStores[0]);
  }, [filteredStores, focusStore]);

  const loadWatchlist = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setWatchlistItems([]);
      return;
    }

    setWatchLoading(true);
    const { data, error } = await listWatchlistItems();
    setWatchlistItems(data);

    if (error) {
      setWatchMessage(error);
    } else if (!keepMessage) {
      setWatchMessage(null);
    }
    setWatchLoading(false);
  }, []);

  const loadProfile = React.useCallback(async (keepMessage = false) => {
    if (!hasSupabaseEnv) {
      setProfile(null);
      return;
    }

    setMoreLoading(true);
    const { data, error } = await getCurrentUserProfile();
    setProfile(data);
    if (error) {
      setMoreMessage(error);
    } else if (!keepMessage) {
      setMoreMessage(null);
    }
    setMoreLoading(false);
  }, []);

  React.useEffect(() => {
    if (activeTab !== "watchlist") return;
    void loadWatchlist();
  }, [activeTab, loadWatchlist]);

  React.useEffect(() => {
    if (activeTab !== "home") return;
    setHomeRoute("catalog");
  }, [activeTab]);

  React.useEffect(() => {
    setHomeActionMessage(null);
  }, [homeRoute, selectedHomeProductId]);

  React.useEffect(() => {
    if (filteredHomeProducts.length === 0) return;
    const hasSelected = filteredHomeProducts.some(
      (product) => product.id === selectedHomeProductId,
    );
    if (!hasSelected) {
      setSelectedHomeProductId(filteredHomeProducts[0].id);
    }
  }, [filteredHomeProducts, selectedHomeProductId]);

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
    if (error) {
      setMoreMessage(error);
      setMoreLoading(false);
      return;
    }

    setMoreMessage(
      data.awaitingVerification
        ? "Account created. Check your email to verify your account."
        : "Account created successfully.",
    );
    setSignUpPassword("");
    setMoreLoading(false);
    await loadProfile(true);
  }, [loadProfile, signUpEmail, signUpName, signUpPassword]);

  const handleAddSelectedToWatchlist = React.useCallback(async () => {
    if (!selectedHomeProduct) return;

    setHomeAddSubmitting(true);
    const { error } = await addWatchlistItem({
      name: selectedHomeProduct.name,
      store: "Home Catalog",
      targetPrice: selectedHomeProduct.currentPrice.toFixed(2),
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

  return (
    <View style={st.root}>
      <View
        style={[
          st.topBar,
          {
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
              Search product list and tap an item to open detail page.
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

            {filteredHomeProducts.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>
                  No products found. Try another search keyword.
                </Text>
              </View>
            ) : (
              filteredHomeProducts.map((product) => {
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
                          Current {money.format(product.currentPrice)}
                        </Text>
                      </View>
                      <View style={st.productThumb}>
                        {product.thumbnailUri ? (
                          <Image
                            source={{ uri: product.thumbnailUri }}
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

            {selectedHomeProduct && homeChart ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>
                  {selectedHomeProduct.name}
                </Text>
                <Text style={st.sectionSub}>Price trend detail</Text>
                {homeActionMessage ? (
                  <Text style={st.itemMeta}>{homeActionMessage}</Text>
                ) : null}
                <Text style={st.itemMeta}>
                  Lowest {money.format(homeChart.min)} / Highest{" "}
                  {money.format(homeChart.max)}
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
                        key={`${point.label}-${idx}`}
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
                    {homeChart.points[homeChart.points.length - 1].label}:{" "}
                    {money.format(homeChart.end)}
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
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === "watchlist" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Watchlist</Text>
            <Text style={st.sectionSub}>
              Only items you add are shown here.
            </Text>

            {!hasSupabaseEnv ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Supabase configuration required</Text>
                <Text style={st.itemMeta}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  in your .env file.
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
                <Text style={st.itemMeta}>
                  No watchlist items yet. Add your first item above.
                </Text>
              </View>
            ) : (
              watchlistItems.map((item) => (
                <View key={item.id} style={st.rowCard}>
                  <Text style={st.itemName}>{item.name}</Text>
                  <Text style={st.itemMeta}>{item.store}</Text>
                  <View style={st.tagRow}>
                    <Text style={st.tag}>
                      Target {item.target_price?.trim() || "-"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {activeTab === "map" ? (
          <View style={st.sectionStack}>
            <Text style={st.sectionTitle}>Map</Text>
            <Text style={st.sectionSub}>
              Search stores and jump directly to their map location.
            </Text>

            <View style={st.searchCard}>
              <TextInput
                value={mapQuery}
                onChangeText={setMapQuery}
                onSubmitEditing={focusFirstSearchResult}
                placeholder="Search store or area"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={st.searchInput}
              />
            </View>

            <View style={st.mapCard}>
              <MapView
                ref={mapRef}
                initialRegion={DEFAULT_REGION}
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
                      description={`${store.area} • ${store.priceNote}`}
                      pinColor={active ? C.primaryDeep : C.primary}
                      onPress={() => setFocusedStoreId(store.id)}
                    />
                  );
                })}
              </MapView>
            </View>

            <Text style={st.resultMeta}>Search results: {filteredStores.length}</Text>
            {filteredStores.length === 0 ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>
                  No matches found. Try another store name or area.
                </Text>
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
                    <Text style={st.storePrice}>{store.priceNote}</Text>
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
            <Text style={st.sectionSub}>
              Create account and manage your basic profile.
            </Text>

            {!hasSupabaseEnv ? (
              <View style={st.rowCard}>
                <Text style={st.itemName}>Supabase configuration required</Text>
                <Text style={st.itemMeta}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  in your .env file.
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
                <Text style={st.itemMeta}>
                  Create your account with email and password.
                </Text>

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

            {moreMessage ? (
              <View style={st.rowCard}>
                <Text style={st.itemMeta}>{moreMessage}</Text>
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
                <Text style={[st.tabText, active && st.tabTextActive]}>
                  {tab.label}
                </Text>
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
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    padding: 18,
    gap: 8,
  },
  heroEyebrow: {
    color: C.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    fontFamily: F.extraBold,
  },
  heroTitle: {
    color: C.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: F.extraBold,
  },
  heroSub: {
    color: C.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: F.regular,
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
  resultMeta: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F.bold,
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
  detailActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailActionBtn: {
    flex: 1,
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
