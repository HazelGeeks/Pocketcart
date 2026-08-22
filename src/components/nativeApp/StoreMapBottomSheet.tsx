import { Animated, FlatList, Pressable, Text, useWindowDimensions, View } from "react-native";
import useStoreMapBottomSheet from "../../hooks/useStoreMapBottomSheet";
import type { MarketStore } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import { StoreMapModeButton } from "./StoreMapModeButton";
import { StoreResultCard } from "./StoreMapResultCard";

type Props = {
  activeStore: MarketStore | null;
  bottomInset: number;
  favoriteStoreIds: Set<string>;
  focusedStoreId: string;
  loading: boolean;
  message: string | null;
  scopeMessage: string;
  scopeTitle: string;
  showScopeNotice: boolean;
  stores: MarketStore[];
  topInset: number;
  onFocusStore: (store: MarketStore) => void;
  onOpenDeals: (store: MarketStore) => void;
  onOpenList: () => void;
  onToggleFavorite: (store: MarketStore) => void;
};

export function StoreMapBottomSheet({
  activeStore,
  bottomInset,
  favoriteStoreIds,
  focusedStoreId,
  loading,
  message,
  scopeMessage,
  scopeTitle,
  showScopeNotice,
  stores,
  topInset,
  onFocusStore,
  onOpenDeals,
  onOpenList,
  onToggleFavorite,
}: Props) {
  const { height } = useWindowDimensions();
  const sheet = useStoreMapBottomSheet({
    screenHeight: height,
    topInset,
    bottomInset,
  });
  const showStoreList = sheet.snap !== "collapsed";

  return (
    <Animated.View
      style={[
        st.storeMapBottomSheet,
        {
          bottom: sheet.bottomOffset,
          height: sheet.maxHeight,
          transform: [{ translateY: sheet.translateY }],
        },
      ]}
    >
      <View {...sheet.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            sheet.snap === "collapsed"
              ? "Expand nearby stores"
              : "Change nearby stores panel height"
          }
          accessibilityState={{ expanded: sheet.snap !== "collapsed" }}
          hitSlop={8}
          onPress={sheet.toggle}
          style={st.storeMapSheetGrabber}
        >
          <View style={st.storeMapSheetHandle} />
        </Pressable>
        <View style={st.storeMapSheetHeader}>
          <View style={st.storeMapSheetHeaderCopy}>
            <Text style={st.storeMapSheetTitle}>{scopeTitle}</Text>
            <Text style={[st.storeMapSheetSubtitle, showScopeNotice && st.storeMapScopeNotice]}>
              {loading ? "Updating map…" : scopeMessage}
            </Text>
          </View>
          <StoreMapModeButton mode="list" onPress={onOpenList} />
        </View>
      </View>

      {message ? <Text style={st.storeMapMessage}>{message}</Text> : null}
      {showStoreList ? (
        <FlatList
          data={stores}
          keyExtractor={(store) => store.id}
          style={st.storeMapSheetList}
          contentContainerStyle={st.storeMapSheetListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={st.storeListCardSeparator} />}
          renderItem={({ item: store }) => (
            <StoreResultCard
              store={store}
              active={store.id === focusedStoreId}
              compact
              favorite={favoriteStoreIds.has(store.id)}
              onFocus={() => {
                onFocusStore(store);
                sheet.collapse();
              }}
              onToggleFavorite={() => onToggleFavorite(store)}
              onViewDeals={() => onOpenDeals(store)}
            />
          )}
        />
      ) : activeStore ? (
        <StoreResultCard
          store={activeStore}
          active
          compact
          favorite={favoriteStoreIds.has(activeStore.id)}
          onFocus={() => onFocusStore(activeStore)}
          onToggleFavorite={() => onToggleFavorite(activeStore)}
          onViewDeals={() => onOpenDeals(activeStore)}
        />
      ) : !loading ? (
        <Text style={st.storeMapEmptyText}>No matching stores nearby.</Text>
      ) : null}
    </Animated.View>
  );
}
