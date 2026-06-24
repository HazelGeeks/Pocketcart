import React from "react";
import { Pressable, Text, View } from "react-native";
import { TABS, type NativeTabId } from "../../screens/nativeAppData";
import { st } from "../../screens/nativeAppStyles";

type NativeTopBarProps = {
  topInset: number;
  pad: number;
};

type NativeBottomTabsProps = {
  activeTab: NativeTabId;
  bottomInset: number;
  pad: number;
  onSelectTab: (tabId: NativeTabId) => void;
};

export function NativeTopBar({ topInset, pad }: NativeTopBarProps) {
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
      <View style={st.alphaPill}>
        <Text style={st.alphaText}>Native Alpha</Text>
      </View>
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
          const icon = getTabIcon(tab.id);
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
                <Text style={[st.tabIcon, active && st.tabTextActive]}>{icon}</Text>
                <Text style={[st.tabText, active && st.tabTextActive]}>{tab.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getTabIcon(tabId: NativeTabId): string {
  switch (tabId) {
    case "home":
      return "🏠";
    case "watchlist":
      return "⭐";
    case "map":
      return "🗺️";
    case "alerts":
      return "🔔";
    case "more":
      return "⚙️";
    default:
      return "";
  }
}
