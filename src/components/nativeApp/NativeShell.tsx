import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { TABS, type NativeTabId } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type NativeTopBarProps = {
  topInset: number;
  pad: number;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
};

type NativeBottomTabsProps = {
  activeTab: NativeTabId;
  bottomInset: number;
  pad: number;
  onSelectTab: (tabId: NativeTabId) => void;
};

export function NativeTopBar({
  topInset,
  pad,
  unreadAlertCount,
  onOpenAlerts,
}: NativeTopBarProps) {
  const badgeLabel = unreadAlertCount > 99 ? "99+" : unreadAlertCount.toString();

  return (
    <View
      style={[
        st.topBar,
        {
          paddingTop: Math.max(topInset, 8) + 4,
          paddingBottom: 10,
          paddingHorizontal: pad,
        },
      ]}
    >
      <Text style={st.brand}>PocketCart</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          unreadAlertCount > 0
            ? `${unreadAlertCount} unread sale alerts`
            : "Open sale alerts"
        }
        onPress={onOpenAlerts}
        style={st.topAlertBtn}
      >
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.5 10.4a5.5 5.5 0 0 1 11 0v3.45l1.6 2.55H4.9l1.6-2.55V10.4Z"
            stroke={C.primaryDeep}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 19a2 2 0 0 0 4 0"
            stroke={C.primaryDeep}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
        {unreadAlertCount > 0 ? (
          <View style={st.topAlertBadge}>
            <Text style={st.topAlertBadgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export function NativeBottomTabs({
  activeTab,
  bottomInset,
  pad,
  onSelectTab,
}: NativeBottomTabsProps) {
  return (
    <View
      style={[
        st.bottomBar,
        {
          paddingBottom: Math.max(bottomInset, 10),
          paddingHorizontal: pad,
        },
      ]}
    >
      <View style={st.tabRow}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onSelectTab(tab.id)}
              style={[st.tabBtn, active && st.tabBtnActive]}
            >
              <View style={st.tabBtnContent}>
                <TabIcon tabId={tab.id} active={active} />
                <Text style={[st.tabText, active && st.tabTextActive]}>{tab.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ tabId, active }: { tabId: NativeTabId; active: boolean }) {
  const color = active ? C.primaryDeep : C.textMuted;
  const strokeWidth = 2.1;

  switch (tabId) {
    case "home":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 11.5 12 5l8 6.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6.5 10.5V20h11v-9.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 20v-5h4v5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "watchlist":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="m12 4 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 16l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L12 4Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "map":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 5 4.5 7v12L9 17l6 2 4.5-2V5L15 7 9 5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 5v12M15 7v12"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "alerts":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.5 10.5a5.5 5.5 0 0 1 11 0v3.4l1.6 2.5H4.9l1.6-2.5v-3.4Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 19a2 2 0 0 0 4 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case "more":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={2.7} stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M12 4.5v2M12 17.5v2M5.65 7.15l1.42 1.42M16.93 15.43l1.42 1.42M4.5 12h2M17.5 12h2M5.65 16.85l1.42-1.42M16.93 8.57l1.42-1.42"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect x={6} y={6} width={12} height={12} rx={3} stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
}
