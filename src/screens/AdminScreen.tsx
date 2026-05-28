import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import WebLink from "../components/WebLink";
import useLayout from "../hooks/useLayout";
import { marketingPalette as C } from "../shared/design/palette";
import { hasSupabaseEnv } from "../services/supabaseClient";
import {
  createAdminPriceEntry,
  createAdminProduct,
  createAdminStore,
  deleteAdminPriceEntry,
  deleteAdminProduct,
  deleteAdminStore,
  getAdminUser,
  listAdminPriceEntries,
  listAdminProducts,
  listAdminStores,
  signInAdmin,
  signOutAdmin,
  type AdminPriceEntry,
  type AdminProduct,
  type AdminStore,
  type AdminUser,
} from "../services/adminBackoffice";

type AdminMenuKey = "overview" | "products" | "stores" | "prices";

type OverviewCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const ADMIN_EMAIL_ALLOWLIST = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function toDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateOnlyLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toNonNegativeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const { pad, isLg } = useLayout();
  const allowlistEnabled = ADMIN_EMAIL_ALLOWLIST.length > 0;

  const [activeMenu, setActiveMenu] = React.useState<AdminMenuKey>("overview");

  const [authUser, setAuthUser] = React.useState<AdminUser | null>(null);
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [authLoading, setAuthLoading] = React.useState(false);

  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [stores, setStores] = React.useState<AdminStore[]>([]);
  const [prices, setPrices] = React.useState<AdminPriceEntry[]>([]);

  const [productsLoading, setProductsLoading] = React.useState(false);
  const [storesLoading, setStoresLoading] = React.useState(false);
  const [pricesLoading, setPricesLoading] = React.useState(false);

  const [notice, setNotice] = React.useState<string | null>(null);

  const [productName, setProductName] = React.useState("");
  const [productCategory, setProductCategory] = React.useState("");
  const [productThumb, setProductThumb] = React.useState("");

  const [storeName, setStoreName] = React.useState("");
  const [storeArea, setStoreArea] = React.useState("");
  const [storeLat, setStoreLat] = React.useState("");
  const [storeLng, setStoreLng] = React.useState("");
  const [storeNote, setStoreNote] = React.useState("");

  const [priceProductId, setPriceProductId] = React.useState("");
  const [priceStoreId, setPriceStoreId] = React.useState("");
  const [priceValue, setPriceValue] = React.useState("");
  const [priceObservedAt, setPriceObservedAt] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);

  const hasAdminAccess = authUser
    ? !allowlistEnabled ||
      ADMIN_EMAIL_ALLOWLIST.includes(authUser.email.trim().toLowerCase())
    : false;

  const priceRowsMissingLink = React.useMemo(
    () => prices.filter((row) => !row.product_name || !row.store_name).length,
    [prices],
  );

  const stalePriceRows = React.useMemo(() => {
    const now = Date.now();
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
    return prices.filter((row) => {
      const time = new Date(row.observed_at).getTime();
      if (Number.isNaN(time)) return false;
      return now - time > THIRTY_DAYS;
    }).length;
  }, [prices]);

  const overviewCards = React.useMemo<OverviewCard[]>(
    () => [
      {
        id: "products",
        label: "Products",
        value: String(products.length),
        hint: "Catalog items",
      },
      {
        id: "stores",
        label: "Stores",
        value: String(stores.length),
        hint: "Map locations",
      },
      {
        id: "prices",
        label: "Price Entries",
        value: String(prices.length),
        hint: "History rows",
      },
      {
        id: "issues",
        label: "Needs Review",
        value: String(toNonNegativeCount(priceRowsMissingLink + stalePriceRows)),
        hint: "Orphan/stale rows",
      },
    ],
    [priceRowsMissingLink, prices.length, stalePriceRows, stores.length, products.length],
  );

  const loadProducts = React.useCallback(async () => {
    setProductsLoading(true);
    const { data, error } = await listAdminProducts();
    setProducts(data);
    setProductsLoading(false);
    return error;
  }, []);

  const loadStores = React.useCallback(async () => {
    setStoresLoading(true);
    const { data, error } = await listAdminStores();
    setStores(data);
    setStoresLoading(false);
    return error;
  }, []);

  const loadPrices = React.useCallback(async () => {
    setPricesLoading(true);
    const { data, error } = await listAdminPriceEntries();
    setPrices(data);
    setPricesLoading(false);
    return error;
  }, []);

  const loadAll = React.useCallback(
    async (keepNotice = false) => {
      const errors = await Promise.all([loadProducts(), loadStores(), loadPrices()]);
      const merged = errors.filter((item): item is string => Boolean(item)).join(" | ");
      if (merged) {
        setNotice(merged);
      } else if (!keepNotice) {
        setNotice(null);
      }
    },
    [loadPrices, loadProducts, loadStores],
  );

  const loadSessionUser = React.useCallback(async () => {
    if (!hasSupabaseEnv) return;
    setAuthLoading(true);
    const { data, error } = await getAdminUser();
    setAuthLoading(false);
    setAuthUser(data);
    if (error) {
      setNotice(error);
    }
  }, []);

  React.useEffect(() => {
    void loadSessionUser();
  }, [loadSessionUser]);

  React.useEffect(() => {
    if (!authUser || !hasAdminAccess) return;
    void loadAll();
  }, [authUser, hasAdminAccess, loadAll]);

  const handleSignIn = React.useCallback(async () => {
    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setNotice("Email and password are required.");
      return;
    }

    setAuthLoading(true);
    const { data, error } = await signInAdmin({ email, password });
    setAuthLoading(false);

    if (error) {
      setNotice(error);
      return;
    }

    setAuthUser(data);
    setAuthPassword("");
    setActiveMenu("overview");
    setNotice("Signed in to admin.");
  }, [authEmail, authPassword]);

  const handleSignOut = React.useCallback(async () => {
    setAuthLoading(true);
    const { error } = await signOutAdmin();
    setAuthLoading(false);

    if (error) {
      setNotice(error);
      return;
    }

    setAuthUser(null);
    setProducts([]);
    setStores([]);
    setPrices([]);
    setActiveMenu("overview");
    setNotice("Signed out.");
  }, []);

  const handleCreateProduct = React.useCallback(async () => {
    const name = productName.trim();
    const category = productCategory.trim();

    if (!name || !category) {
      setNotice("Product name and category are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await createAdminProduct({
      name,
      category,
      thumbnailUrl: productThumb,
    });
    setSubmitting(false);

    if (error) {
      setNotice(error);
      return;
    }

    setProductName("");
    setProductCategory("");
    setProductThumb("");
    setNotice("Product created.");
    await loadProducts();
  }, [loadProducts, productCategory, productName, productThumb]);

  const handleCreateStore = React.useCallback(async () => {
    const name = storeName.trim();
    const area = storeArea.trim();

    if (!name || !area || !storeLat.trim() || !storeLng.trim()) {
      setNotice("Store name, area, latitude, and longitude are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await createAdminStore({
      name,
      area,
      latitude: storeLat,
      longitude: storeLng,
      priceNote: storeNote,
    });
    setSubmitting(false);

    if (error) {
      setNotice(error);
      return;
    }

    setStoreName("");
    setStoreArea("");
    setStoreLat("");
    setStoreLng("");
    setStoreNote("");
    setNotice("Store created.");
    await loadStores();
  }, [loadStores, storeArea, storeLat, storeLng, storeName, storeNote]);

  const handleCreatePrice = React.useCallback(async () => {
    if (!priceProductId.trim() || !priceStoreId.trim() || !priceValue.trim()) {
      setNotice("Product ID, Store ID, and Price are required.");
      return;
    }

    setSubmitting(true);
    const { error } = await createAdminPriceEntry({
      productId: priceProductId,
      storeId: priceStoreId,
      price: priceValue,
      observedAt: priceObservedAt,
    });
    setSubmitting(false);

    if (error) {
      setNotice(error);
      return;
    }

    setPriceValue("");
    setPriceObservedAt("");
    setNotice("Price entry created.");
    await loadPrices();
    await loadProducts();
  }, [
    loadPrices,
    loadProducts,
    priceObservedAt,
    priceProductId,
    priceStoreId,
    priceValue,
  ]);

  const handleDeleteProduct = React.useCallback(
    async (id: string) => {
      setDeletingKey(`product:${id}`);
      const { error } = await deleteAdminProduct(id);
      setDeletingKey(null);
      if (error) {
        setNotice(error);
        return;
      }
      setNotice("Product deleted.");
      await loadProducts();
      await loadPrices();
    },
    [loadPrices, loadProducts],
  );

  const handleDeleteStore = React.useCallback(
    async (id: string) => {
      setDeletingKey(`store:${id}`);
      const { error } = await deleteAdminStore(id);
      setDeletingKey(null);
      if (error) {
        setNotice(error);
        return;
      }
      setNotice("Store deleted.");
      await loadStores();
      await loadPrices();
    },
    [loadPrices, loadStores],
  );

  const handleDeletePrice = React.useCallback(
    async (id: string) => {
      setDeletingKey(`price:${id}`);
      const { error } = await deleteAdminPriceEntry(id);
      setDeletingKey(null);
      if (error) {
        setNotice(error);
        return;
      }
      setNotice("Price entry deleted.");
      await loadPrices();
      await loadProducts();
    },
    [loadPrices, loadProducts],
  );

  const sectionMenu = [
    {
      key: "overview" as const,
      label: "Dashboard",
      badge: toNonNegativeCount(priceRowsMissingLink + stalePriceRows),
    },
    {
      key: "products" as const,
      label: "Products",
      badge: products.length,
    },
    {
      key: "stores" as const,
      label: "Stores",
      badge: stores.length,
    },
    {
      key: "prices" as const,
      label: "Price Entries",
      badge: prices.length,
    },
  ];

  const panelTitle =
    activeMenu === "overview"
      ? "Dashboard"
      : activeMenu === "products"
        ? "Products"
        : activeMenu === "stores"
          ? "Stores"
          : "Price Entries";

  return (
    <View style={st.root}>
      <View
        style={[
          st.workspace,
          !isLg && st.workspaceStack,
          { paddingHorizontal: pad, paddingVertical: 18 },
        ]}
      >
        {authUser && hasAdminAccess ? (
          <View style={[st.sidebar, !isLg && st.sidebarMobile]}>
            <View style={st.sidebarHeader}>
              <Text style={st.sidebarBrand}>PocketCart</Text>
              <Text style={st.sidebarSub}>Admin Workspace</Text>
            </View>

            <View style={st.menuGroup}>
              {sectionMenu.map((item) => {
                const active = activeMenu === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => setActiveMenu(item.key)}
                    style={[st.menuBtn, active && st.menuBtnActive]}
                  >
                    <Text style={[st.menuText, active && st.menuTextActive]}>{item.label}</Text>
                    <View style={[st.menuBadge, active && st.menuBadgeActive]}>
                      <Text style={[st.menuBadgeText, active && st.menuBadgeTextActive]}>
                        {item.badge}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={st.sidebarFooter}>
              <Text style={st.sidebarUser}>{authUser.email || authUser.id}</Text>
              <Text style={st.sidebarRole}>Administrator</Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void handleSignOut();
                }}
                style={[st.btn, st.btnSidebar]}
                disabled={authLoading}
              >
                <Text style={st.btnSidebarText}>{authLoading ? "..." : "Sign Out"}</Text>
              </Pressable>

              <WebLink href="/" onPress={onBack}>
                <View style={[st.btn, st.btnGhost]}>
                  <Text style={st.btnGhostText}>Back to Site</Text>
                </View>
              </WebLink>
            </View>
          </View>
        ) : null}

        <View style={st.mainPanel}>
          <ScrollView
            role="main"
            style={st.scroll}
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={st.headerRow}>
              <View>
                <Text style={st.pageTitle}>Admin Dashboard</Text>
                <Text style={st.pageSub}>Manage catalog, map stores, and price history.</Text>
              </View>

              {authUser && hasAdminAccess ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void loadAll(true);
                  }}
                  style={[st.btn, st.btnGhost]}
                >
                  <Text style={st.btnGhostText}>Refresh Data</Text>
                </Pressable>
              ) : (
                <WebLink href="/" onPress={onBack}>
                  <View style={[st.btn, st.btnGhost]}>
                    <Text style={st.btnGhostText}>Back Home</Text>
                  </View>
                </WebLink>
              )}
            </View>

            {!hasSupabaseEnv ? (
              <View style={st.infoCard}>
                <Text style={st.infoTitle}>Supabase setup required</Text>
                <Text style={st.infoBody}>
                  Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.
                </Text>
              </View>
            ) : null}

            {notice ? (
              <View style={st.noticeCard}>
                <Text style={st.noticeText}>{notice}</Text>
              </View>
            ) : null}

            {!authUser ? (
              <View style={st.authCard}>
                <Text style={st.infoTitle}>Admin Sign In</Text>
                <Text style={st.infoBody}>
                  Sign in with your Supabase email/password account.
                </Text>

                <TextInput
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />
                <TextInput
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="Password"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={st.input}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={handleSignIn}
                  style={[st.btn, st.btnPrimary]}
                  disabled={authLoading}
                >
                  <Text style={st.btnPrimaryText}>{authLoading ? "Signing in..." : "Sign In"}</Text>
                </Pressable>
              </View>
            ) : !hasAdminAccess ? (
              <View style={st.infoCard}>
                <Text style={st.infoTitle}>No admin access</Text>
                <Text style={st.infoBody}>
                  This account is signed in but not on admin allowlist.
                </Text>
                <Text style={st.infoBody}>
                  Set EXPO_PUBLIC_ADMIN_EMAILS with comma-separated admin emails.
                </Text>
                <View style={st.inlineRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void handleSignOut();
                    }}
                    style={[st.btn, st.btnGhost]}
                  >
                    <Text style={st.btnGhostText}>Sign Out</Text>
                  </Pressable>
                  <WebLink href="/" onPress={onBack}>
                    <View style={[st.btn, st.btnGhost]}>
                      <Text style={st.btnGhostText}>Back Home</Text>
                    </View>
                  </WebLink>
                </View>
              </View>
            ) : (
              <>
                {!isLg ? (
                  <View style={st.mobileMenuRow}>
                    {sectionMenu.map((item) => {
                      const active = activeMenu === item.key;
                      return (
                        <Pressable
                          key={item.key}
                          accessibilityRole="button"
                          onPress={() => setActiveMenu(item.key)}
                          style={[st.mobileMenuBtn, active && st.mobileMenuBtnActive]}
                        >
                          <Text style={[st.mobileMenuText, active && st.mobileMenuTextActive]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <View style={st.overviewTopCard}>
                  <Text style={st.overviewTopTitle}>Needs Attention</Text>
                  <View style={st.overviewBadgeRow}>
                    <View style={st.attentionItem}>
                      <Text style={st.attentionLabel}>Missing Product/Store Link</Text>
                      <Text style={st.attentionCount}>{priceRowsMissingLink}</Text>
                    </View>
                    <View style={st.attentionItem}>
                      <Text style={st.attentionLabel}>Stale Price Rows (30d+)</Text>
                      <Text style={st.attentionCount}>{stalePriceRows}</Text>
                    </View>
                    <View style={st.attentionItem}>
                      <Text style={st.attentionLabel}>Total Price Rows</Text>
                      <Text style={st.attentionCount}>{prices.length}</Text>
                    </View>
                  </View>
                </View>

                <View style={st.statGrid}>
                  {overviewCards.map((card) => (
                    <View key={card.id} style={st.statCard}>
                      <Text style={st.statLabel}>{card.label}</Text>
                      <Text style={st.statValue}>{card.value}</Text>
                      <Text style={st.statHint}>{card.hint}</Text>
                    </View>
                  ))}
                </View>

                <Text style={st.panelTitle}>{panelTitle}</Text>

                {activeMenu === "overview" ? (
                  <View style={st.dualColumnGrid}>
                    <View style={st.dataCard}>
                      <View style={st.dataCardHeader}>
                        <Text style={st.dataCardTitle}>Recent Products</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActiveMenu("products")}
                          style={[st.btn, st.btnLink]}
                        >
                          <Text style={st.btnLinkText}>Manage</Text>
                        </Pressable>
                      </View>

                      {productsLoading ? (
                        <Text style={st.dataMuted}>Loading products...</Text>
                      ) : products.length === 0 ? (
                        <Text style={st.dataMuted}>No products yet.</Text>
                      ) : (
                        products.slice(0, 6).map((item) => (
                          <View key={item.id} style={st.dataRow}>
                            <View style={st.dataRowMain}>
                              <Text style={st.dataRowTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.category}</Text>
                            </View>
                            <Text style={st.dataMeta}>{toDateOnlyLabel(item.created_at)}</Text>
                          </View>
                        ))
                      )}
                    </View>

                    <View style={st.dataCard}>
                      <View style={st.dataCardHeader}>
                        <Text style={st.dataCardTitle}>Recent Stores</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActiveMenu("stores")}
                          style={[st.btn, st.btnLink]}
                        >
                          <Text style={st.btnLinkText}>Manage</Text>
                        </Pressable>
                      </View>

                      {storesLoading ? (
                        <Text style={st.dataMuted}>Loading stores...</Text>
                      ) : stores.length === 0 ? (
                        <Text style={st.dataMuted}>No stores yet.</Text>
                      ) : (
                        stores.slice(0, 6).map((item) => (
                          <View key={item.id} style={st.dataRow}>
                            <View style={st.dataRowMain}>
                              <Text style={st.dataRowTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.area}</Text>
                            </View>
                            <Text style={st.dataMeta}>{item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}</Text>
                          </View>
                        ))
                      )}
                    </View>

                    <View style={[st.dataCard, st.dataCardWide]}>
                      <View style={st.dataCardHeader}>
                        <Text style={st.dataCardTitle}>Recent Price Entries</Text>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActiveMenu("prices")}
                          style={[st.btn, st.btnLink]}
                        >
                          <Text style={st.btnLinkText}>Manage</Text>
                        </Pressable>
                      </View>

                      {pricesLoading ? (
                        <Text style={st.dataMuted}>Loading price entries...</Text>
                      ) : prices.length === 0 ? (
                        <Text style={st.dataMuted}>No price entries yet.</Text>
                      ) : (
                        prices.slice(0, 8).map((item) => (
                          <View key={item.id} style={st.dataRow}>
                            <View style={st.dataRowMain}>
                              <Text style={st.dataRowTitle}>
                                {item.product_name ?? item.product_id} @ {item.store_name ?? item.store_id}
                              </Text>
                              <Text style={st.dataMuted}>{toDateLabel(item.observed_at)}</Text>
                            </View>
                            <Text style={st.dataMeta}>{money.format(item.price)}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                ) : null}

                {activeMenu === "products" ? (
                  <View style={st.dataCard}>
                    <View style={st.dataCardHeader}>
                      <Text style={st.dataCardTitle}>Product Management</Text>
                      <Text style={st.dataMuted}>Create and remove catalog products.</Text>
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="Product name"
                        placeholderTextColor={C.textMuted}
                        style={[st.input, st.inputGrow]}
                      />
                      <TextInput
                        value={productCategory}
                        onChangeText={setProductCategory}
                        placeholder="Category"
                        placeholderTextColor={C.textMuted}
                        style={[st.input, st.inputNarrow]}
                      />
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={productThumb}
                        onChangeText={setProductThumb}
                        placeholder="Thumbnail URL (optional)"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[st.input, st.inputGrow]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleCreateProduct}
                        style={[st.btn, st.btnPrimary]}
                        disabled={submitting}
                      >
                        <Text style={st.btnPrimaryText}>{submitting ? "Saving..." : "Add Product"}</Text>
                      </Pressable>
                    </View>

                    {productsLoading ? (
                      <Text style={st.dataMuted}>Loading products...</Text>
                    ) : products.length === 0 ? (
                      <Text style={st.dataMuted}>No products yet.</Text>
                    ) : (
                      products.map((item) => {
                        const deleteKey = `product:${item.id}`;
                        const deleting = deletingKey === deleteKey;
                        return (
                          <View key={item.id} style={st.listRow}>
                            <View style={st.listMain}>
                              <Text style={st.listTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.category}</Text>
                              <Text style={st.dataMuted}>{item.id}</Text>
                            </View>
                            <View style={st.listRight}>
                              <Text style={st.listDate}>{toDateOnlyLabel(item.created_at)}</Text>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  void handleDeleteProduct(item.id);
                                }}
                                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                                disabled={deleting}
                              >
                                <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}

                {activeMenu === "stores" ? (
                  <View style={st.dataCard}>
                    <View style={st.dataCardHeader}>
                      <Text style={st.dataCardTitle}>Store Management</Text>
                      <Text style={st.dataMuted}>Create and remove map stores.</Text>
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={storeName}
                        onChangeText={setStoreName}
                        placeholder="Store name"
                        placeholderTextColor={C.textMuted}
                        style={[st.input, st.inputGrow]}
                      />
                      <TextInput
                        value={storeArea}
                        onChangeText={setStoreArea}
                        placeholder="Area"
                        placeholderTextColor={C.textMuted}
                        style={[st.input, st.inputNarrow]}
                      />
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={storeLat}
                        onChangeText={setStoreLat}
                        placeholder="Latitude"
                        placeholderTextColor={C.textMuted}
                        keyboardType="decimal-pad"
                        style={[st.input, st.inputNarrow]}
                      />
                      <TextInput
                        value={storeLng}
                        onChangeText={setStoreLng}
                        placeholder="Longitude"
                        placeholderTextColor={C.textMuted}
                        keyboardType="decimal-pad"
                        style={[st.input, st.inputNarrow]}
                      />
                      <TextInput
                        value={storeNote}
                        onChangeText={setStoreNote}
                        placeholder="Price note (optional)"
                        placeholderTextColor={C.textMuted}
                        style={[st.input, st.inputGrow]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleCreateStore}
                        style={[st.btn, st.btnPrimary]}
                        disabled={submitting}
                      >
                        <Text style={st.btnPrimaryText}>{submitting ? "Saving..." : "Add Store"}</Text>
                      </Pressable>
                    </View>

                    {storesLoading ? (
                      <Text style={st.dataMuted}>Loading stores...</Text>
                    ) : stores.length === 0 ? (
                      <Text style={st.dataMuted}>No stores yet.</Text>
                    ) : (
                      stores.map((item) => {
                        const deleteKey = `store:${item.id}`;
                        const deleting = deletingKey === deleteKey;
                        return (
                          <View key={item.id} style={st.listRow}>
                            <View style={st.listMain}>
                              <Text style={st.listTitle}>{item.name}</Text>
                              <Text style={st.dataMuted}>{item.area}</Text>
                              <Text style={st.dataMuted}>
                                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                              </Text>
                            </View>
                            <View style={st.listRight}>
                              <Text style={st.listDate}>{item.price_note || "-"}</Text>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  void handleDeleteStore(item.id);
                                }}
                                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                                disabled={deleting}
                              >
                                <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}

                {activeMenu === "prices" ? (
                  <View style={st.dataCard}>
                    <View style={st.dataCardHeader}>
                      <Text style={st.dataCardTitle}>Price Entry Management</Text>
                      <Text style={st.dataMuted}>Append and remove product price history.</Text>
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={priceProductId}
                        onChangeText={setPriceProductId}
                        placeholder="Product ID"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[st.input, st.inputNarrow]}
                      />
                      <TextInput
                        value={priceStoreId}
                        onChangeText={setPriceStoreId}
                        placeholder="Store ID"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[st.input, st.inputNarrow]}
                      />
                      <TextInput
                        value={priceValue}
                        onChangeText={setPriceValue}
                        placeholder="Price"
                        placeholderTextColor={C.textMuted}
                        keyboardType="decimal-pad"
                        style={[st.input, st.inputNarrow]}
                      />
                    </View>

                    <View style={st.formRow}>
                      <TextInput
                        value={priceObservedAt}
                        onChangeText={setPriceObservedAt}
                        placeholder="Observed at (optional, ISO date)"
                        placeholderTextColor={C.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[st.input, st.inputGrow]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleCreatePrice}
                        style={[st.btn, st.btnPrimary]}
                        disabled={submitting}
                      >
                        <Text style={st.btnPrimaryText}>{submitting ? "Saving..." : "Add Price"}</Text>
                      </Pressable>
                    </View>

                    {pricesLoading ? (
                      <Text style={st.dataMuted}>Loading price entries...</Text>
                    ) : prices.length === 0 ? (
                      <Text style={st.dataMuted}>No price entries yet.</Text>
                    ) : (
                      prices.map((item) => {
                        const deleteKey = `price:${item.id}`;
                        const deleting = deletingKey === deleteKey;
                        return (
                          <View key={item.id} style={st.listRow}>
                            <View style={st.listMain}>
                              <Text style={st.listTitle}>
                                {item.product_name ?? item.product_id} @ {item.store_name ?? item.store_id}
                              </Text>
                              <Text style={st.dataMuted}>{item.id}</Text>
                              <Text style={st.dataMuted}>{toDateLabel(item.observed_at)}</Text>
                            </View>
                            <View style={st.listRight}>
                              <Text style={st.listPrice}>{money.format(item.price)}</Text>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                  void handleDeletePrice(item.id);
                                }}
                                style={[st.btn, st.btnDanger, deleting && st.btnDisabled]}
                                disabled={deleting}
                              >
                                <Text style={st.btnDangerText}>{deleting ? "..." : "Delete"}</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3f4f7",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh", width: "100%" } as any) : {}),
  },
  workspace: {
    flex: 1,
    flexDirection: "row",
    gap: 16,
  },
  workspaceStack: {
    flexDirection: "column",
  },
  sidebar: {
    width: 280,
    minHeight: 680,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 14,
    ...(Platform.OS === "web" ? ({ position: "sticky", top: 16, alignSelf: "flex-start" } as any) : {}),
  },
  sidebarMobile: {
    width: "100%",
    minHeight: 0,
    position: "relative",
  },
  sidebarHeader: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde3ee",
    backgroundColor: "#f5f8ff",
    padding: 12,
    gap: 4,
  },
  sidebarBrand: {
    color: "#2a3f7f",
    fontSize: 18,
    fontWeight: "800",
  },
  sidebarSub: {
    color: "#5d6a82",
    fontSize: 12,
    lineHeight: 17,
  },
  menuGroup: {
    gap: 8,
  },
  menuBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe4ec",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  menuBtnActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  menuText: {
    color: "#2e3a4f",
    fontSize: 13,
    fontWeight: "700",
  },
  menuTextActive: {
    color: "#2f55d4",
  },
  menuBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#eceff4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  menuBadgeActive: {
    backgroundColor: "#d6e0ff",
  },
  menuBadgeText: {
    color: "#4e5c74",
    fontSize: 11,
    fontWeight: "800",
  },
  menuBadgeTextActive: {
    color: "#2f55d4",
  },
  sidebarFooter: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#e5e9f1",
    paddingTop: 12,
    gap: 7,
  },
  sidebarUser: {
    color: "#2e3748",
    fontSize: 13,
    fontWeight: "700",
  },
  sidebarRole: {
    color: "#7a859a",
    fontSize: 12,
  },
  mainPanel: {
    flex: 1,
    minWidth: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
    gap: 12,
  },
  headerRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  pageTitle: {
    color: "#2a2f3a",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  pageSub: {
    color: "#677285",
    fontSize: 13,
    marginTop: 3,
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    color: "#2f3a52",
    fontSize: 20,
    fontWeight: "800",
  },
  infoBody: {
    color: "#616d83",
    fontSize: 13,
    lineHeight: 19,
  },
  authCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 9,
    maxWidth: 520,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d9e1ff",
    backgroundColor: "#eef3ff",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  noticeText: {
    color: "#415590",
    fontSize: 13,
    lineHeight: 18,
  },
  mobileMenuRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mobileMenuBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dde3ee",
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  mobileMenuBtnActive: {
    borderColor: "#8fa6f8",
    backgroundColor: "#edf2ff",
  },
  mobileMenuText: {
    color: "#3a465d",
    fontSize: 12,
    fontWeight: "700",
  },
  mobileMenuTextActive: {
    color: "#2f55d4",
  },
  overviewTopCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1cfa2",
    backgroundColor: "#fff8ef",
    padding: 14,
    gap: 9,
  },
  overviewTopTitle: {
    color: "#8f4c22",
    fontSize: 29,
    fontWeight: "800",
  },
  overviewBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attentionItem: {
    minWidth: 190,
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#edc28e",
    backgroundColor: "#ffffff",
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  attentionLabel: {
    color: "#84482f",
    fontSize: 12,
    fontWeight: "700",
  },
  attentionCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#f58231",
    color: "#ffffff",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 12,
    fontWeight: "800",
    paddingTop: 5,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    minWidth: 170,
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statLabel: {
    color: "#748096",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  statValue: {
    color: "#2b313d",
    fontSize: 32,
    fontWeight: "800",
  },
  statHint: {
    color: "#6f7b8f",
    fontSize: 12,
  },
  panelTitle: {
    color: "#2d3444",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  dualColumnGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dataCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 8,
    minWidth: 280,
    flexGrow: 1,
  },
  dataCardWide: {
    minWidth: 520,
    flex: 2,
  },
  dataCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dataCardTitle: {
    color: "#2f3747",
    fontSize: 20,
    fontWeight: "800",
  },
  dataMuted: {
    color: "#6f7b92",
    fontSize: 12,
    lineHeight: 17,
  },
  dataRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e7f0",
    backgroundColor: "#fafbfd",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dataRowMain: {
    flex: 1,
    gap: 2,
  },
  dataRowTitle: {
    color: "#323b4d",
    fontSize: 14,
    fontWeight: "700",
  },
  dataMeta: {
    color: "#56617a",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  input: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8dee8",
    backgroundColor: "#f7f9fc",
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputGrow: {
    flexGrow: 1,
    minWidth: 220,
  },
  inputNarrow: {
    minWidth: 150,
    flexGrow: 1,
  },
  listRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e7f0",
    backgroundColor: "#fafbfd",
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  listMain: {
    flex: 1,
    gap: 2,
  },
  listRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  listTitle: {
    color: "#2f3748",
    fontSize: 14,
    fontWeight: "700",
  },
  listDate: {
    color: "#5b677f",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  listPrice: {
    color: "#2f55d4",
    fontSize: 13,
    fontWeight: "800",
  },
  inlineRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btn: {
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  btnPrimary: {
    backgroundColor: "#3c6df0",
    borderColor: "#3c6df0",
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  btnGhost: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnGhostText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnSidebar: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
  },
  btnSidebarText: {
    color: "#40506e",
    fontSize: 12,
    fontWeight: "700",
  },
  btnLink: {
    backgroundColor: "#ffffff",
    borderColor: "#d8dee8",
    minHeight: 30,
    paddingHorizontal: 10,
  },
  btnLinkText: {
    color: "#2f55d4",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#fff2f2",
    borderColor: "#f0c0c0",
    minHeight: 32,
    minWidth: 74,
  },
  btnDangerText: {
    color: "#a53d3d",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
