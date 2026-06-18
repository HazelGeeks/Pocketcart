import React from "react";
import { ScrollView, Text, View } from "react-native";
import MapView, { type Region } from "react-native-maps";
import { HomeCatalogPanel } from "../components/nativeApp/HomeCatalogPanel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MorePanel } from "../components/nativeApp/MorePanel";
import { NativeBottomTabs, NativeTopBar } from "../components/nativeApp/NativeShell";
import { ProductDetailPanel } from "../components/nativeApp/ProductDetailPanel";
import { StoreMapPanel } from "../components/nativeApp/StoreMapPanel";
import { WatchlistPanel } from "../components/nativeApp/WatchlistPanel";
import useLayout from "../hooks/useLayout";
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
import {
  ALERT_ROWS,
  DEFAULT_REGION,
  SUMMARY_CARDS,
  buildPreviousPriceRows,
  buildPriceChart,
  money,
  type HomeRoute,
  type NativeTabId,
} from "./nativeAppData";
import { st } from "./nativeAppStyles";

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
            summaryCards={summaryCards}
            message={homeMessage}
            loading={homeLoading}
            products={homeProducts}
            selectedProduct={selectedHomeProduct}
            onChangeQuery={setHomeQuery}
            onChangeCategory={setHomeCategory}
            onSelectProduct={(productId) => {
              setSelectedHomeProductId(productId);
              setHomeRoute("detail");
            }}
          />
        ) : null}

        {activeTab === "home" && homeRoute === "detail" ? (
          <ProductDetailPanel
            product={selectedHomeProduct}
            chart={homeChart}
            previousPriceRows={previousPriceRows}
            actionMessage={homeActionMessage}
            historyMessage={homeHistoryMessage}
            historyLoading={homeHistoryLoading}
            addSubmitting={homeAddSubmitting}
            onBack={() => setHomeRoute("catalog")}
            onAddToWatchlist={handleAddSelectedToWatchlist}
          />
        ) : null}

        {activeTab === "watchlist" ? (
          <WatchlistPanel
            hasSupabaseEnv={hasSupabaseEnv}
            items={watchlistItems}
            name={watchName}
            store={watchStore}
            targetPrice={watchTargetPrice}
            loading={watchLoading}
            submitting={watchSubmitting}
            removingId={watchRemovingId}
            message={watchMessage}
            onChangeName={setWatchName}
            onChangeStore={setWatchStore}
            onChangeTargetPrice={setWatchTargetPrice}
            onAddItem={handleAddWatchlistItem}
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
          />
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
          <MorePanel
            profile={profile}
            loading={moreLoading}
            message={moreMessage}
            adminMessage={adminMessage}
            signUpName={signUpName}
            signUpEmail={signUpEmail}
            signUpPassword={signUpPassword}
            adminProductName={adminProductName}
            adminProductCategory={adminProductCategory}
            adminProductThumb={adminProductThumb}
            adminStoreName={adminStoreName}
            adminStoreArea={adminStoreArea}
            adminStoreLat={adminStoreLat}
            adminStoreLng={adminStoreLng}
            adminStoreNote={adminStoreNote}
            adminPriceProductId={adminPriceProductId}
            adminPriceStoreId={adminPriceStoreId}
            adminPriceValue={adminPriceValue}
            adminPriceObservedAt={adminPriceObservedAt}
            adminSubmitting={adminSubmitting}
            onRefreshProfile={() => {
              void loadProfile();
            }}
            onSignOut={handleSignOut}
            onSignUp={handleSignUp}
            onChangeSignUpName={setSignUpName}
            onChangeSignUpEmail={setSignUpEmail}
            onChangeSignUpPassword={setSignUpPassword}
            onChangeAdminProductName={setAdminProductName}
            onChangeAdminProductCategory={setAdminProductCategory}
            onChangeAdminProductThumb={setAdminProductThumb}
            onChangeAdminStoreName={setAdminStoreName}
            onChangeAdminStoreArea={setAdminStoreArea}
            onChangeAdminStoreLat={setAdminStoreLat}
            onChangeAdminStoreLng={setAdminStoreLng}
            onChangeAdminStoreNote={setAdminStoreNote}
            onChangeAdminPriceProductId={setAdminPriceProductId}
            onChangeAdminPriceStoreId={setAdminPriceStoreId}
            onChangeAdminPriceValue={setAdminPriceValue}
            onChangeAdminPriceObservedAt={setAdminPriceObservedAt}
            onCreateProduct={handleCreateProduct}
            onCreateStore={handleCreateStore}
            onCreatePrice={handleCreatePrice}
          />
        ) : null}
      </ScrollView>

      <NativeBottomTabs
        activeTab={activeTab}
        bottomInset={insets.bottom}
        pad={pad}
        onSelectTab={setActiveTab}
      />
    </View>
  );
}
