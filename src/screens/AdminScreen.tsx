import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  AdminNoAccessPanel,
  AdminSignInPanel,
} from "../components/admin/AdminAuthPanels";
import AdminSidebar from "../components/admin/AdminSidebar";
import {
  AdminNoticePanel,
  AdminSupabaseSetupNotice,
} from "../components/admin/AdminStatusPanels";
import {
  AdminHeader,
  AdminMobileMenu,
} from "../components/admin/AdminWorkspaceChrome";
import AdminWorkspaceModals from "../components/admin/AdminWorkspaceModals";
import AdminWorkspacePanels from "../components/admin/AdminWorkspacePanels";
import useAdminWorkspaceActions from "../hooks/useAdminWorkspaceActions";
import useAdminWorkspaceData from "../hooks/useAdminWorkspaceData";
import { hasSupabaseEnv } from "../services/supabaseClient";
import { st } from "./adminScreenStyles";

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const data = useAdminWorkspaceData();
  const actions = useAdminWorkspaceActions(data);
  const { state, backend, isLg } = data;
  const { adminUi, auth, status } = state;

  return (
    <View style={st.root}>
      <View
        style={[
          st.workspace,
          !isLg && st.workspaceStack,
          { paddingHorizontal: isLg ? 0 : 10, paddingVertical: isLg ? 0 : 12 },
        ]}
      >
        {backend.authUser && backend.hasAdminAccess ? (
          <>
            {!isLg || !adminUi.sidebarCollapsed ? (
              <AdminSidebar
                isLg={isLg}
                sectionMenu={data.sectionMenu}
                activeMenu={adminUi.activeMenu}
                authUserLabel={backend.authUser.email || backend.authUser.id}
                authLoading={backend.loading.auth}
                productReviewCount={backend.reviews.length}
                styles={st}
                onSelectMenu={adminUi.setActiveMenu}
                onSignOut={() => void actions.handleSignOut()}
                onCollapse={() => adminUi.setSidebarCollapsed(true)}
              />
            ) : null}
            {isLg && adminUi.sidebarCollapsed ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Expand sidebar"
                accessibilityHint="Opens the admin navigation"
                onPress={() => adminUi.setSidebarCollapsed(false)}
                style={st.sidebarCollapsedToggle}
                {...({ title: "Expand sidebar" } as any)}
              >
                <Text style={st.sidebarCollapsedToggleIcon}>›</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        <View style={st.mainPanel}>
          <ScrollView
            role="main"
            style={st.scroll}
            contentContainerStyle={[
              st.scrollContent,
              !backend.authUser && st.scrollContentAuth,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <AdminHeader
              hasAdminAccess={Boolean(backend.authUser && backend.hasAdminAccess)}
              refreshing={status.refreshing}
              styles={st}
              onBack={onBack}
              onRefresh={() => void backend.handleRefresh()}
            />
            {!hasSupabaseEnv ? <AdminSupabaseSetupNotice styles={st} /> : null}
            {status.notice ? (
              <AdminNoticePanel
                notice={status.notice}
                styles={st}
                onDismiss={() => status.setNotice(null)}
              />
            ) : null}
            {!backend.authUser ? (
              <View style={st.authStage}>
                <AdminSignInPanel
                  email={auth.authEmail}
                  password={auth.authPassword}
                  loading={backend.loading.auth}
                  styles={st}
                  onEmailChange={auth.setAuthEmail}
                  onPasswordChange={auth.setAuthPassword}
                  onSignIn={actions.handleSignIn}
                />
              </View>
            ) : !backend.hasAdminAccess ? (
              <AdminNoAccessPanel
                styles={st}
                onBack={onBack}
                onSignOut={() => void actions.handleSignOut()}
              />
            ) : (
              <>
                {!isLg ? (
                  <AdminMobileMenu
                    activeMenu={adminUi.activeMenu}
                    sectionMenu={data.sectionMenu}
                    styles={st}
                    onSelectMenu={adminUi.setActiveMenu}
                  />
                ) : null}
                <AdminWorkspacePanels data={data} actions={actions} />
              </>
            )}
          </ScrollView>
        </View>
      </View>
      <AdminWorkspaceModals data={data} actions={actions} />
    </View>
  );
}
