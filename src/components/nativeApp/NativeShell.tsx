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
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: active }}
              onPress={() => onSelectTab(tab.id)}
              style={[st.tabBtn, active && st.tabBtnActive]}
            >
              <Text style={[st.tabText, active && st.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
