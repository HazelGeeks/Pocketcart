import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { TABS, type NativeTabId } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";

type NativeBottomTabsProps = {
  activeTab: NativeTabId;
  bottomInset: number;
  pad: number;
  unreadAlertCount: number;
  onSelectTab: (tabId: NativeTabId) => void;
};

type NativeContextHeaderProps = {
  title: string;
  status: string;
  topInset: number;
  pad: number;
  onBack?: () => void;
};

export function NativeContextHeader({
  title,
  status,
  topInset,
  pad,
  onBack,
}: NativeContextHeaderProps) {
  return (
    <View
      style={[
        st.contextHeader,
        {
          paddingTop: topInset,
          paddingHorizontal: pad,
        },
      ]}
    >
      <View style={st.contextHeaderInner}>
        <View style={st.contextHeaderIdentity}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Account & Settings"
              onPress={onBack}
              style={st.contextBackButton}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="m14.5 6-6 6 6 6" stroke={C.primaryDeep} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ) : (
            <View style={st.contextBrandMark} accessibilityElementsHidden>
              <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5.5 8.5h13l-1 10h-11l-1-10Z"
                  stroke={C.primaryDeep}
                  strokeWidth={2.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 9V7a3 3 0 0 1 6 0v2"
                  stroke={C.primaryDeep}
                  strokeWidth={2.1}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          )}
          <Text accessibilityRole="header" style={st.contextHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={st.contextStatusPill}>
          <View style={st.contextStatusDot} />
          <Text style={st.contextStatusText} numberOfLines={1}>
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function NativeBottomTabs({
  activeTab,
  bottomInset,
  pad,
  unreadAlertCount,
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
          const isMain = tab.id === "home";
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onSelectTab(tab.id)}
              style={[
                st.tabBtn,
                isMain && st.tabBtnMain,
                active && !isMain && st.tabBtnActive,
                active && isMain && st.tabBtnMainActive,
              ]}
            >
              <View style={[st.tabBtnContent, isMain && st.tabBtnMainContent]}>
                <TabIcon tabId={tab.id} active={active} emphasized={isMain} />
                {active && !isMain ? <View style={st.tabActiveDot} /> : null}
                {tab.id === "alerts" && unreadAlertCount > 0 ? (
                  <View style={st.bottomAlertBadge}>
                    <Text style={st.bottomAlertBadgeText}>
                      {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ tabId, active, emphasized = false }: { tabId: NativeTabId; active: boolean; emphasized?: boolean }) {
  const color = emphasized ? C.white : active ? C.primaryDeep : C.textMuted;
  const strokeWidth = emphasized ? 2.3 : 2.1;
  const iconSize = emphasized ? 28 : 22;

  switch (tabId) {
    case "home":
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
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
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 5.5h12M7 12h12M7 18.5h12M3.5 5.5h.01M3.5 12h.01M3.5 18.5h.01"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "map":
      return (
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
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
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
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
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
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
        <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <Rect x={6} y={6} width={12} height={12} rx={3} stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
}
