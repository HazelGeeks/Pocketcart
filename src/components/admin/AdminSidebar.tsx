import React from "react";
import { Pressable, Text, View } from "react-native";
import type { AdminMenuKey } from "../../state/adminStore";

type AdminSidebarMenuItem = {
  key: AdminMenuKey;
  label: string;
  badge?: number;
};

type AdminSidebarProps = {
  isLg: boolean;
  sectionMenu: AdminSidebarMenuItem[];
  activeMenu: AdminMenuKey;
  authUserLabel: string;
  authLoading: boolean;
  productReviewCount: number;
  styles: Record<string, any>;
  onSelectMenu: (value: AdminMenuKey) => void;
  onSignOut: () => void;
  onCollapse: () => void;
};

export default function AdminSidebar({
  isLg,
  sectionMenu,
  activeMenu,
  authUserLabel,
  authLoading,
  productReviewCount,
  styles: st,
  onSelectMenu,
  onSignOut,
  onCollapse,
}: AdminSidebarProps) {
  return (
    <View style={[st.sidebar, !isLg && st.sidebarMobile]}>
      <View style={[st.sidebarHeader, !isLg && st.sidebarHeaderMobile]}>
        <Text style={st.sidebarBrand} numberOfLines={1}>PocketCart</Text>
        <Text style={st.sidebarSub} numberOfLines={1}>Admin Workspace</Text>
      </View>

      {isLg ? (
        <View style={st.menuGroup}>
          {sectionMenu.map((item) => {
            const active = activeMenu === item.key;
            return (
              <React.Fragment key={item.key}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onSelectMenu(item.key)}
                  style={[st.menuBtn, active && st.menuBtnActive]}
                >
                  <Text style={[st.menuText, active && st.menuTextActive]}>{item.label}</Text>
                  {typeof item.badge === "number" ? (
                    <View style={[st.menuBadge, active && st.menuBadgeActive]}>
                      <Text style={[st.menuBadgeText, active && st.menuBadgeTextActive]}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                {item.key === "overview" && productReviewCount > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${productReviewCount} products need identity review`}
                    onPress={() => onSelectMenu("overview")}
                    style={st.sidebarReviewAlert}
                  >
                    <Text style={st.sidebarReviewAlertTitle}>
                      Review required · {productReviewCount}
                    </Text>
                    <Text style={st.sidebarReviewAlertBody}>
                      Product matching needs confirmation
                    </Text>
                  </Pressable>
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      ) : null}

      <View style={[st.sidebarFooter, !isLg && st.sidebarFooterMobile]}>
        {isLg ? (
          <View style={st.sidebarUserBlock}>
            <Text style={st.sidebarUser} numberOfLines={1}>{authUserLabel}</Text>
            <Text style={st.sidebarRole} numberOfLines={1}>Administrator</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onSignOut}
          style={[st.btn, st.btnSidebar, !isLg && st.btnSidebarMobile]}
          disabled={authLoading}
        >
          <Text style={st.btnSidebarText}>{authLoading ? "..." : "Sign Out"}</Text>
        </Pressable>

        {isLg ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCollapse}
            style={[st.btn, st.btnSidebar]}
          >
            <Text style={st.btnSidebarText}>Collapse Sidebar</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
