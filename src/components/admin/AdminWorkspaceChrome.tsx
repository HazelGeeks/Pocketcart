import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminMenuKey } from "../../state/adminStore";
import WebLink from "../WebLink";

type SectionMenuItem = {
  key: AdminMenuKey;
  label: string;
  badge?: number;
};

type AdminHeaderProps = {
  hasAdminAccess: boolean;
  styles: Record<string, any>;
  onBack: () => void;
  onRefresh: () => void;
};

type AdminMobileMenuProps = {
  activeMenu: AdminMenuKey;
  sectionMenu: SectionMenuItem[];
  styles: Record<string, any>;
  onSelectMenu: (menu: AdminMenuKey) => void;
};

export function AdminHeader({
  hasAdminAccess,
  styles: st,
  onBack,
  onRefresh,
}: AdminHeaderProps) {
  return (
    <View style={st.headerRow}>
      <View>
        <Text style={st.pageTitle}>Admin Dashboard</Text>
        <Text style={st.pageSub}>Manage product catalog and active price sets.</Text>
      </View>

      {hasAdminAccess ? (
        <Pressable accessibilityRole="button" onPress={onRefresh} style={[st.btn, st.btnGhost]}>
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
  );
}

export function AdminMobileMenu({
  activeMenu,
  sectionMenu,
  styles: st,
  onSelectMenu,
}: AdminMobileMenuProps) {
  return (
    <View style={st.mobileMenuRow}>
      {sectionMenu.map((item) => {
        const active = activeMenu === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => onSelectMenu(item.key)}
            style={[st.mobileMenuBtn, active && st.mobileMenuBtnActive]}
          >
            <Text style={[st.mobileMenuText, active && st.mobileMenuTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
