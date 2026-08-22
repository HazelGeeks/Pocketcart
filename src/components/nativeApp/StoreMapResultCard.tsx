import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { MarketStore } from "../../services/marketData";
import { st } from "../../screens/nativeAppStyles";
import { AppIcon } from "../icons/AppIcon";
import { marketingPalette as C } from "../../shared/design/palette";
import { getStoreBrandLogoKey } from "../../utils/storeBrandLogo";
import { formatStoreDistance } from "../../utils/storeDistanceScope";

const STORE_LOGOS = {
  hMart: require("../../../assets/store-logos/h-mart.png"),
  hannamMart: require("../../../assets/store-logos/hannam-mart.png"),
  priceSmart: require("../../../assets/store-logos/pricesmart-foods.png"),
  marketRibbon: require("../../../assets/store-logos/market-ribbon.png"),
  tAndT: require("../../../assets/store-logos/t-and-t.png"),
};

export function getStoreDisplayName(store: MarketStore) {
  return store.brand ? `${store.brand} - ${store.name}` : store.name;
}

export function getStoreInitials(store: MarketStore) {
  const source = store.brand?.trim() || store.name.trim();
  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PC"
  );
}

export function getStoreLogo(store: MarketStore) {
  const logoKey = getStoreBrandLogoKey(store);
  return logoKey ? STORE_LOGOS[logoKey] : null;
}

type StoreResultCardProps = {
  store: MarketStore;
  active: boolean;
  compact?: boolean;
  favorite: boolean;
  onFocus: () => void;
  onToggleFavorite: () => void;
  onViewDeals: () => void;
};

export function StoreResultCard({
  store,
  active,
  compact = false,
  favorite,
  onFocus,
  onToggleFavorite,
  onViewDeals,
}: StoreResultCardProps) {
  const distance = formatStoreDistance(store.distance_km);
  const logo = getStoreLogo(store);

  return (
    <View
      style={[
        st.storeResultCard,
        active && st.storeResultCardActive,
        compact && st.storeResultCardCompact,
      ]}
    >
      <View style={st.storeResultMain}>
        <Pressable
          accessibilityRole="button"
          onPress={onFocus}
          style={st.storeResultFocusContent}
        >
          <View style={[st.storeResultBadge, logo && st.storeResultBadgeWithLogo]}>
            {logo ? (
              <Image
                source={logo}
                resizeMode="contain"
                style={st.storeResultLogo}
              />
            ) : (
              <Text style={st.storeResultBadgeText}>
                {getStoreInitials(store)}
              </Text>
            )}
          </View>
          <View style={st.storeResultCopy}>
            <Text style={st.storeResultName} numberOfLines={1}>
              {getStoreDisplayName(store)}
            </Text>
            <Text style={st.storeResultAddress} numberOfLines={1}>
              {store.address || store.area || "Address unavailable"}
            </Text>
            <View style={st.storeResultMetaRow}>
              {distance ? (
                <Text style={st.storeResultDistance}>{distance}</Text>
              ) : null}
              {distance && store.price_note ? (
                <View style={st.storeResultDivider} />
              ) : null}
              {store.price_note ? (
                <Text style={st.storeResultPrice} numberOfLines={1}>
                  {store.price_note}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? `Remove ${getStoreDisplayName(store)} from My stores`
              : `Save ${getStoreDisplayName(store)} to My stores`
          }
          accessibilityState={{ selected: favorite }}
          onPress={onToggleFavorite}
          style={[
            st.storeFavoriteButton,
            favorite && st.storeFavoriteButtonActive,
          ]}
        >
          <StoreStarIcon
            size={21}
            filled={favorite}
            color={C.primaryDeep}
          />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View deals at ${getStoreDisplayName(store)}`}
        onPress={onViewDeals}
        style={st.storeResultDealsButton}
      >
        <Text style={st.storeResultDealsText}>View deals</Text>
        <AppIcon name="chevron-right" color={C.primaryDeep} size={18} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

export function StoreStarIcon({
  color,
  filled,
  size,
}: {
  color: string;
  filled: boolean;
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
