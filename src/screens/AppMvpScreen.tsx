import React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import useLayout from "../hooks/useLayout";
import type { Route } from "../constants/palette";
import { useSiteI18n } from "../i18n/siteI18n";
import type { Locale } from "../i18n/types";
import useMvpStore, {
  type MvpErrorCode,
  type MvpResult,
} from "../mvp/store";

const C = {
  brick: "#B3472F",
  brickDark: "#8B3524",
  brickFaint: "#F2E1DB",
  bg: "#FFF8F5",
  white: "#FFFFFF",
  ink: "#2A1812",
  text: "#41281F",
  muted: "#6F4A40",
  line: "#E5C9C0",
  ok: "#1E7B4D",
  okBg: "#E8F6EE",
  err: "#A83939",
  errBg: "#FBEAEA",
};

type Banner = {
  tone: "ok" | "error";
  text: string;
};

const WEB_DELETION_URL = "https://pocketcart.app/delete-account";

function useCurrency(locale: Locale) {
  return React.useMemo(() => {
    const code = locale === "fr" ? "fr-FR" : "en-US";
    return new Intl.NumberFormat(code, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }, [locale]);
}

function useDate(locale: Locale) {
  return React.useMemo(() => {
    const code = locale === "fr" ? "fr-FR" : "en-US";
    return new Intl.DateTimeFormat(code, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);
}

export default function AppMvpScreen({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate: (route: Route) => void;
}) {
  const { locale, copy } = useSiteI18n();
  const {
    pad,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
  } = useLayout();
  const {
    booting,
    busyAction,
    user,
    items,
    historyByItem,
    notifications,
    unreadCount,
    alertsEnabled,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    addItem,
    recordPrice,
    deleteItem,
    markNotificationsRead,
    setAlertsEnabled,
  } = useMvpStore();

  const money = useCurrency(locale);
  const dateFmt = useDate(locale);
  const mvp = copy.mvp;
  const busy = busyAction !== null;
  const [banner, setBanner] = React.useState<Banner | null>(null);

  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");

  const [itemName, setItemName] = React.useState("");
  const [itemStore, setItemStore] = React.useState("");
  const [itemTarget, setItemTarget] = React.useState("");
  const [itemLatest, setItemLatest] = React.useState("");
  const [itemSource, setItemSource] = React.useState("");

  const [selectedItemId, setSelectedItemId] =
    React.useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = React.useState<
    Record<string, string>
  >({});
  const [sourceDrafts, setSourceDrafts] = React.useState<
    Record<string, string>
  >({});
  const [deleteArmed, setDeleteArmed] = React.useState(false);

  React.useEffect(() => {
    if (items.length === 0) {
      setSelectedItemId(null);
      return;
    }
    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  React.useEffect(() => {
    if (!user) {
      setDeleteArmed(false);
    }
  }, [user]);

  const messageByError = React.useMemo(
    (): Record<MvpErrorCode, string> => ({
      email_required: mvp.states.validation.emailRequired,
      password_required: mvp.states.validation.passwordRequired,
      password_too_short: mvp.states.validation.passwordTooShort,
      account_exists: mvp.states.validation.accountExists,
      invalid_credentials: mvp.states.validation.invalidCredentials,
      auth_required: mvp.states.validation.authRequired,
      name_required: mvp.states.validation.nameRequired,
      store_required: mvp.states.validation.storeRequired,
      target_invalid: mvp.states.validation.targetInvalid,
      price_invalid: mvp.states.validation.priceInvalid,
      item_missing: mvp.states.validation.itemMissing,
      busy: mvp.states.validation.busy,
      unknown: mvp.states.unknownError,
    }),
    [mvp.states],
  );

  const showResult = React.useCallback(
    (result: MvpResult, okText: string): boolean => {
      if (result.ok) {
        setBanner({ tone: "ok", text: okText });
        return true;
      }
      setBanner({
        tone: "error",
        text: messageByError[result.error] ?? mvp.states.unknownError,
      });
      return false;
    },
    [messageByError, mvp.states.unknownError],
  );

  const formatMoney = React.useCallback(
    (value: number) => money.format(value),
    [money],
  );

  const formatDate = React.useCallback(
    (value: string) => dateFmt.format(new Date(value)),
    [dateFmt],
  );

  const handleSignIn = React.useCallback(async () => {
    const result = await signIn(authEmail, authPassword);
    const ok = showResult(result, mvp.states.signedIn);
    if (ok) setAuthPassword("");
  }, [
    authEmail,
    authPassword,
    mvp.states.signedIn,
    showResult,
    signIn,
  ]);

  const handleSignUp = React.useCallback(async () => {
    const result = await signUp(authEmail, authPassword);
    const ok = showResult(result, mvp.states.signedUp);
    if (ok) setAuthPassword("");
  }, [
    authEmail,
    authPassword,
    mvp.states.signedUp,
    showResult,
    signUp,
  ]);

  const handleSignOut = React.useCallback(async () => {
    const result = await signOut();
    showResult(result, mvp.states.signedOut);
  }, [mvp.states.signedOut, showResult, signOut]);

  const handleAddItem = React.useCallback(async () => {
    const result = await addItem({
      name: itemName,
      store: itemStore,
      targetPrice: itemTarget,
      latestPrice: itemLatest,
      source: itemSource,
    });
    const ok = showResult(result, mvp.states.itemAdded);
    if (!ok) return;
    setItemName("");
    setItemStore("");
    setItemTarget("");
    setItemLatest("");
    setItemSource("");
  }, [
    addItem,
    itemLatest,
    itemName,
    itemSource,
    itemStore,
    itemTarget,
    mvp.states.itemAdded,
    showResult,
  ]);

  const handleRecordPrice = React.useCallback(
    async (itemId: string) => {
      const result = await recordPrice({
        itemId,
        price: priceDrafts[itemId] ?? "",
        source:
          sourceDrafts[itemId] ??
          mvp.history.sourceFallback,
      });
      const ok = showResult(result, mvp.states.priceRecorded);
      if (!ok) return;
      setPriceDrafts((prev) => ({ ...prev, [itemId]: "" }));
    },
    [
      mvp.history.sourceFallback,
      mvp.states.priceRecorded,
      priceDrafts,
      recordPrice,
      showResult,
      sourceDrafts,
    ],
  );

  const handleDeleteItem = React.useCallback(
    async (itemId: string) => {
      const result = await deleteItem(itemId);
      showResult(result, mvp.states.itemDeleted);
    },
    [deleteItem, mvp.states.itemDeleted, showResult],
  );

  const handleMarkAllRead = React.useCallback(async () => {
    const result = await markNotificationsRead();
    showResult(result, mvp.states.notificationsRead);
  }, [markNotificationsRead, mvp.states.notificationsRead, showResult]);

  const handleToggleAlerts = React.useCallback(async () => {
    const result = await setAlertsEnabled(!alertsEnabled);
    showResult(result, mvp.states.alertsUpdated);
  }, [
    alertsEnabled,
    mvp.states.alertsUpdated,
    setAlertsEnabled,
    showResult,
  ]);

  const handleOpenWebDeletion = React.useCallback(async () => {
    if (Platform.OS === "web") {
      onNavigate("delete-account");
      return;
    }
    try {
      await Linking.openURL(WEB_DELETION_URL);
    } catch {
      setBanner({ tone: "error", text: mvp.states.unknownError });
    }
  }, [mvp.states.unknownError, onNavigate]);

  const handleDeleteAccount = React.useCallback(async () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setBanner({ tone: "error", text: mvp.states.deletePending });
      return;
    }
    const result = await deleteAccount();
    const ok = showResult(result, mvp.states.accountDeleted);
    if (ok) {
      setDeleteArmed(false);
      setAuthEmail("");
      setAuthPassword("");
    }
  }, [
    deleteAccount,
    deleteArmed,
    mvp.states.accountDeleted,
    mvp.states.deletePending,
    showResult,
  ]);

  const activeHistory = React.useMemo(
    () => (selectedItemId ? historyByItem[selectedItemId] ?? [] : []),
    [historyByItem, selectedItemId],
  );

  const maxWidth = is2Xl ? 1400 : isXl ? 1260 : isLg ? 1120 : 900;
  const cols = isLg ? 2 : 1;

  if (booting) {
    return (
      <View style={st.bootWrap}>
        <ActivityIndicator color={C.brick} />
        <Text style={st.bootText}>{mvp.states.loading}</Text>
      </View>
    );
  }

  return (
    <View style={st.root}>
      <ScrollView
        role="main"
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            st.topBar,
            { paddingHorizontal: pad },
            Platform.OS === "web" &&
              ({ position: "sticky", top: 0, zIndex: 80 } as any),
          ]}
        >
          <View style={[st.topInner, { maxWidth }]}>
            <Pressable onPress={onBack} style={st.backBtn}>
              <Text style={st.backArrow}>←</Text>
              <Text style={st.backText}>{mvp.backToHome}</Text>
            </Pressable>
            <View style={st.topActionRow}>
              <Pressable
                onPress={() => onNavigate("privacy")}
                style={st.topLinkBtn}
              >
                <Text style={st.topLinkText}>{mvp.compliance.privacy}</Text>
              </Pressable>
              <Pressable
                onPress={() => onNavigate("terms")}
                style={st.topLinkBtn}
              >
                <Text style={st.topLinkText}>{mvp.compliance.terms}</Text>
              </Pressable>
              {user ? (
                <Pressable
                  onPress={handleSignOut}
                  disabled={busy}
                  style={[
                    st.ghostBtn,
                    busy && st.disabled,
                  ]}
                >
                  <Text style={st.ghostBtnText}>{mvp.auth.signOut}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View
          style={[
            st.container,
            { paddingHorizontal: pad, maxWidth },
          ]}
        >
          <View style={st.headCard}>
            <Text style={st.eyebrow}>{mvp.eyebrow}</Text>
            <Text
              accessibilityRole="header"
              aria-level={1}
              style={st.headTitle}
            >
              {mvp.title}
            </Text>
            <Text style={st.headSub}>{mvp.sub}</Text>
            {busy ? <Text style={st.saving}>{mvp.states.saving}</Text> : null}
          </View>

          {banner ? (
            <View
              style={[
                st.banner,
                banner.tone === "ok" ? st.bannerOk : st.bannerErr,
              ]}
            >
              <Text
                style={[
                  st.bannerText,
                  banner.tone === "ok"
                    ? st.bannerTextOk
                    : st.bannerTextErr,
                ]}
              >
                {banner.text}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              st.grid,
              cols > 1 && st.gridDesktop,
              cols > 1 && { alignItems: "stretch" },
            ]}
          >
            <View style={[st.col, cols > 1 && { flex: 1.2 }]}>
              <View style={st.card}>
                <Text style={st.cardTitle}>{mvp.auth.title}</Text>
                <Text style={st.cardSub}>{mvp.auth.sub}</Text>

                {user ? (
                  <Text style={st.loggedInText}>
                    {mvp.auth.welcomePrefix}: {user.email}
                  </Text>
                ) : null}

                {!user ? (
                  <View style={st.formStack}>
                    <View style={st.formGroup}>
                      <Text style={st.label}>{mvp.auth.emailLabel}</Text>
                      <TextInput
                        value={authEmail}
                        onChangeText={setAuthEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        style={st.input}
                        placeholder={mvp.auth.emailLabel}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <View style={st.formGroup}>
                      <Text style={st.label}>{mvp.auth.passwordLabel}</Text>
                      <TextInput
                        value={authPassword}
                        onChangeText={setAuthPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry
                        style={st.input}
                        placeholder={mvp.auth.passwordLabel}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <View
                      style={[
                        st.buttonRow,
                        !isSm && st.buttonRowStack,
                      ]}
                    >
                      <Pressable
                        onPress={handleSignIn}
                        disabled={busy}
                        style={[
                          st.primaryBtn,
                          !isSm && st.fullBtn,
                          busy && st.disabled,
                        ]}
                      >
                        <Text style={st.primaryBtnText}>{mvp.auth.signIn}</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSignUp}
                        disabled={busy}
                        style={[
                          st.ghostBtn,
                          !isSm && st.fullBtn,
                          busy && st.disabled,
                        ]}
                      >
                        <Text style={st.ghostBtnText}>{mvp.auth.signUp}</Text>
                      </Pressable>
                    </View>
                    <Text style={st.hint}>{mvp.auth.demoHint}</Text>
                  </View>
                ) : null}
              </View>

              <View style={st.card}>
                <Text style={st.cardTitle}>{mvp.compliance.title}</Text>
                <Text style={st.cardSub}>{mvp.compliance.sub}</Text>

                <View style={st.complianceRow}>
                  <Pressable
                    onPress={() => onNavigate("privacy")}
                    style={st.ghostBtn}
                  >
                    <Text style={st.ghostBtnText}>
                      {mvp.compliance.privacy}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onNavigate("terms")}
                    style={st.ghostBtn}
                  >
                    <Text style={st.ghostBtnText}>{mvp.compliance.terms}</Text>
                  </Pressable>
                </View>

                <View style={st.portalCard}>
                  <Text style={st.portalTitle}>
                    {mvp.compliance.deletionPortal}
                  </Text>
                  <Text style={st.portalUrl}>{WEB_DELETION_URL}</Text>
                  <Text style={st.portalHint}>
                    {mvp.compliance.deletionPortalHint}
                  </Text>
                  <Pressable
                    onPress={handleOpenWebDeletion}
                    style={st.ghostBtn}
                  >
                    <Text style={st.ghostBtnText}>
                      {mvp.compliance.openWebDeletion}
                    </Text>
                  </Pressable>
                </View>

                {user ? (
                  <View style={st.deleteCard}>
                    <Pressable
                      onPress={handleDeleteAccount}
                      disabled={busy}
                      style={[
                        st.dangerBtn,
                        busy && st.disabled,
                      ]}
                    >
                      <Text style={st.dangerBtnText}>
                        {deleteArmed
                          ? mvp.compliance.deleteAccountConfirm
                          : mvp.compliance.deleteAccount}
                      </Text>
                    </Pressable>
                    {deleteArmed ? (
                      <Pressable
                        onPress={() => setDeleteArmed(false)}
                        style={st.ghostBtn}
                      >
                        <Text style={st.ghostBtnText}>
                          {mvp.compliance.cancelDelete}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {user ? (
                <View style={st.card}>
                  <Text style={st.cardTitle}>{mvp.items.title}</Text>
                  <Text style={st.cardSub}>{mvp.items.formTitle}</Text>

                  <View style={st.formStack}>
                    <View style={st.formGroup}>
                      <Text style={st.label}>{mvp.items.nameLabel}</Text>
                      <TextInput
                        value={itemName}
                        onChangeText={setItemName}
                        style={st.input}
                        placeholder={mvp.items.nameLabel}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <View style={st.formGroup}>
                      <Text style={st.label}>{mvp.items.storeLabel}</Text>
                      <TextInput
                        value={itemStore}
                        onChangeText={setItemStore}
                        style={st.input}
                        placeholder={mvp.items.storeLabel}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <View
                      style={[
                        st.row,
                        !isMd && st.rowStack,
                      ]}
                    >
                      <View style={[st.formGroup, st.formHalf]}>
                        <Text style={st.label}>{mvp.items.targetLabel}</Text>
                        <TextInput
                          value={itemTarget}
                          onChangeText={setItemTarget}
                          style={st.input}
                          placeholder="49.99"
                          keyboardType="decimal-pad"
                          placeholderTextColor={C.muted}
                        />
                      </View>
                      <View style={[st.formGroup, st.formHalf]}>
                        <Text style={st.label}>{mvp.items.latestLabel}</Text>
                        <TextInput
                          value={itemLatest}
                          onChangeText={setItemLatest}
                          style={st.input}
                          placeholder="54.20"
                          keyboardType="decimal-pad"
                          placeholderTextColor={C.muted}
                        />
                      </View>
                    </View>
                    <View style={st.formGroup}>
                      <Text style={st.label}>{mvp.items.sourceLabel}</Text>
                      <TextInput
                        value={itemSource}
                        onChangeText={setItemSource}
                        style={st.input}
                        placeholder={mvp.history.sourceFallback}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                    <Pressable
                      onPress={handleAddItem}
                      disabled={busy}
                      style={[st.primaryBtn, busy && st.disabled]}
                    >
                      <Text style={st.primaryBtnText}>
                        {mvp.items.addButton}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={st.itemStack}>
                    {items.length === 0 ? (
                      <Text style={st.emptyText}>{mvp.items.empty}</Text>
                    ) : (
                      items.map((item) => (
                        <View key={item.id} style={st.itemCard}>
                          <View style={st.itemHead}>
                            <Text style={st.itemName}>{item.name}</Text>
                            <Pressable
                              onPress={() => handleDeleteItem(item.id)}
                              disabled={busy}
                              style={[st.tinyBtn, busy && st.disabled]}
                            >
                              <Text style={st.tinyBtnText}>
                                {mvp.items.deleteButton}
                              </Text>
                            </Pressable>
                          </View>
                          <Text style={st.itemStore}>{item.store}</Text>
                          <View style={st.tagRow}>
                            <Text style={st.tag}>
                              {mvp.items.latestTag}:{" "}
                              {formatMoney(item.latestPrice)}
                            </Text>
                            <Text style={st.tag}>
                              {mvp.items.targetTag}:{" "}
                              {formatMoney(item.targetPrice)}
                            </Text>
                          </View>
                          <View
                            style={[
                              st.row,
                              !isSm && st.rowStack,
                              { marginTop: 10 },
                            ]}
                          >
                            <TextInput
                              value={priceDrafts[item.id] ?? ""}
                              onChangeText={(text) =>
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: text,
                                }))
                              }
                              style={[st.input, st.formHalf]}
                              placeholder={mvp.items.latestLabel}
                              keyboardType="decimal-pad"
                              placeholderTextColor={C.muted}
                            />
                            <TextInput
                              value={sourceDrafts[item.id] ?? ""}
                              onChangeText={(text) =>
                                setSourceDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: text,
                                }))
                              }
                              style={[st.input, st.formHalf]}
                              placeholder={mvp.items.sourceLabel}
                              placeholderTextColor={C.muted}
                            />
                            <Pressable
                              onPress={() => handleRecordPrice(item.id)}
                              disabled={busy}
                              style={[
                                st.ghostBtn,
                                !isSm && st.fullBtn,
                                busy && st.disabled,
                              ]}
                            >
                              <Text style={st.ghostBtnText}>
                                {mvp.items.updateButton}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ) : null}
            </View>

            {user ? (
              <View style={[st.col, cols > 1 && { flex: 1 }]}>
                <View style={st.card}>
                  <Text style={st.cardTitle}>{mvp.history.title}</Text>
                  {items.length === 0 ? (
                    <Text style={st.emptyText}>{mvp.history.emptyItems}</Text>
                  ) : (
                    <>
                      <Text style={st.label}>{mvp.history.selectItem}</Text>
                      <View style={st.chipRow}>
                        {items.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => setSelectedItemId(item.id)}
                            style={[
                              st.chip,
                              selectedItemId === item.id && st.chipActive,
                            ]}
                          >
                            <Text
                              style={[
                                st.chipText,
                                selectedItemId === item.id &&
                                  st.chipTextActive,
                              ]}
                            >
                              {item.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={st.historyRows}>
                        {activeHistory.length === 0 ? (
                          <Text style={st.emptyText}>
                            {mvp.history.emptyRows}
                          </Text>
                        ) : (
                          activeHistory.map((row) => (
                            <View key={row.id} style={st.historyCard}>
                              <Text style={st.historyPrice}>
                                {formatMoney(row.price)}
                              </Text>
                              <Text style={st.historyMeta}>
                                {row.source} · {formatDate(row.createdAt)}
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                    </>
                  )}
                </View>

                <View style={st.card}>
                  <Text style={st.cardTitle}>{mvp.notifications.title}</Text>
                  <View
                    style={[
                      st.row,
                      !isMd && st.rowStack,
                      { alignItems: "center" },
                    ]}
                  >
                    <Text style={st.stateText}>
                      {alertsEnabled
                        ? mvp.notifications.alertsEnabled
                        : mvp.notifications.alertsDisabled}
                    </Text>
                    <Pressable
                      onPress={handleToggleAlerts}
                      disabled={busy}
                      style={[
                        st.ghostBtn,
                        !isMd && st.fullBtn,
                        busy && st.disabled,
                      ]}
                    >
                      <Text style={st.ghostBtnText}>
                        {alertsEnabled
                          ? mvp.notifications.alertsDisabled
                          : mvp.notifications.alertsEnabled}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={st.noticeTopRow}>
                    <Text style={st.unreadText}>
                      {mvp.notifications.unreadLabel}: {unreadCount}
                    </Text>
                    <Pressable
                      onPress={handleMarkAllRead}
                      disabled={busy || notifications.length === 0}
                      style={[
                        st.tinyBtn,
                        (busy || notifications.length === 0) && st.disabled,
                      ]}
                    >
                      <Text style={st.tinyBtnText}>
                        {mvp.notifications.markAllRead}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={st.noticeList}>
                    {notifications.length === 0 ? (
                      <Text style={st.emptyText}>
                        {mvp.notifications.empty}
                      </Text>
                    ) : (
                      notifications.map((note) => (
                        <View key={note.id} style={st.noticeCard}>
                          <View style={st.noticeTitleRow}>
                            <Text style={st.noticeTitle}>{note.title}</Text>
                            {!note.read ? <View style={st.unreadDot} /> : null}
                          </View>
                          <Text style={st.noticeBody}>{note.body}</Text>
                          <Text style={st.noticeTime}>
                            {formatDate(note.createdAt)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  bootWrap: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  bootText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "600",
  },
  topBar: {
    backgroundColor: "rgba(255,248,245,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingVertical: 12,
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(14px)" } as any)
      : {}),
  },
  topInner: {
    alignSelf: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  topActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  topLinkBtn: {
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topLinkText: {
    color: C.brickDark,
    fontSize: 12,
    fontWeight: "700",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backArrow: {
    color: C.brickDark,
    fontSize: 17,
    fontWeight: "700",
  },
  backText: {
    color: C.brickDark,
    fontSize: 14,
    fontWeight: "700",
  },
  container: {
    alignSelf: "center",
    width: "100%",
    paddingTop: 26,
    gap: 16,
  },
  headCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    padding: 22,
    gap: 8,
  },
  eyebrow: {
    color: C.brick,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  headTitle: {
    color: C.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  headSub: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 680,
  },
  saving: {
    marginTop: 4,
    color: C.brickDark,
    fontSize: 13,
    fontWeight: "700",
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bannerOk: {
    backgroundColor: C.okBg,
    borderColor: "rgba(30,123,77,0.24)",
  },
  bannerErr: {
    backgroundColor: C.errBg,
    borderColor: "rgba(168,57,57,0.24)",
  },
  bannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bannerTextOk: {
    color: C.ok,
  },
  bannerTextErr: {
    color: C.err,
  },
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: "row",
  },
  col: {
    gap: 16,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    color: C.ink,
    fontSize: 22,
    fontWeight: "800",
  },
  cardSub: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  loggedInText: {
    marginTop: 4,
    color: C.brickDark,
    fontSize: 14,
    fontWeight: "700",
  },
  formStack: {
    gap: 10,
    marginTop: 6,
  },
  formGroup: {
    gap: 5,
  },
  label: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    color: C.text,
    paddingHorizontal: 12,
    fontSize: 14,
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none" } as any)
      : {}),
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowStack: {
    flexDirection: "column",
  },
  formHalf: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  buttonRowStack: {
    flexDirection: "column",
  },
  primaryBtn: {
    height: 42,
    minWidth: 128,
    borderRadius: 12,
    backgroundColor: C.brick,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
  },
  ghostBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  ghostBtnText: {
    color: C.brickDark,
    fontSize: 13,
    fontWeight: "700",
  },
  fullBtn: {
    width: "100%",
  },
  disabled: {
    opacity: 0.55,
  },
  hint: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  complianceRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 2,
  },
  portalCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  portalTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  portalUrl: {
    color: C.brickDark,
    fontSize: 12,
    fontWeight: "700",
  },
  portalHint: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  deleteCard: {
    marginTop: 4,
    gap: 8,
  },
  dangerBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168,57,57,0.34)",
    backgroundColor: "rgba(168,57,57,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dangerBtnText: {
    color: C.err,
    fontSize: 13,
    fontWeight: "800",
  },
  itemStack: {
    marginTop: 8,
    gap: 10,
  },
  itemCard: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  itemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  itemName: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  itemStore: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  tinyBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    paddingHorizontal: 10,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyBtnText: {
    color: C.brickDark,
    fontSize: 12,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 2,
  },
  tag: {
    fontSize: 12,
    color: C.brickDark,
    fontWeight: "700",
    backgroundColor: C.brickFaint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: C.brick,
    borderColor: C.brick,
  },
  chipText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextActive: {
    color: C.white,
  },
  historyRows: {
    marginTop: 8,
    gap: 8,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 10,
    gap: 3,
  },
  historyPrice: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
  },
  historyMeta: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  stateText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  noticeTopRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  unreadText: {
    color: C.brickDark,
    fontSize: 13,
    fontWeight: "800",
  },
  noticeList: {
    marginTop: 8,
    gap: 8,
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    padding: 10,
    gap: 4,
  },
  noticeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  noticeTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    flexShrink: 1,
  },
  noticeBody: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  noticeTime: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.brick,
  },
  emptyText: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
  },
});
