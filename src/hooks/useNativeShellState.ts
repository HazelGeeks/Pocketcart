import React from "react";
import type { NativeTabId } from "../screens/nativeAppData";

export default function useNativeShellState() {
  const [activeTab, setActiveTab] = React.useState<NativeTabId>("home");
  const alertsReturnTab = React.useRef<NativeTabId>("home");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((message: string) => {
    setToastMessage(message);
  }, []);
  const openHome = React.useCallback(() => setActiveTab("home"), []);
  const openMap = React.useCallback(() => setActiveTab("map"), []);
  const openMore = React.useCallback(() => setActiveTab("more"), []);

  const openAlerts = React.useCallback(() => {
    if (activeTab !== "alerts") alertsReturnTab.current = activeTab;
    setActiveTab("alerts");
  }, [activeTab]);
  const closeAlerts = React.useCallback(() => setActiveTab(alertsReturnTab.current), []);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2300);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return {
    activeTab,
    openAlerts,
    closeAlerts,
    openHome,
    openMap,
    openMore,
    setActiveTab,
    showToast,
    toastMessage,
  };
}
