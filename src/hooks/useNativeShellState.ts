import React from "react";
import type { NativeTabId } from "../screens/nativeAppData";

export default function useNativeShellState() {
  const [activeTab, setActiveTab] = React.useState<NativeTabId>("home");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = React.useCallback((message: string) => {
    setToastMessage(message);
  }, []);
  const openHome = React.useCallback(() => setActiveTab("home"), []);
  const openMap = React.useCallback(() => setActiveTab("map"), []);
  const openMore = React.useCallback(() => setActiveTab("more"), []);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2300);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  return {
    activeTab,
    openHome,
    openMap,
    openMore,
    setActiveTab,
    showToast,
    toastMessage,
  };
}
