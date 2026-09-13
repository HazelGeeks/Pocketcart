import React from "react";
import { useFamily } from "../contexts/FamilyContext";
import type useNativeAccount from "./useNativeAccount";
export default function useFamilyNavigation(account: ReturnType<typeof useNativeAccount>, openMore: () => void, hideOnboarding: (visible: boolean) => void) {
  const { pendingInvite } = useFamily();
  const opened = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!pendingInvite) { opened.current = null; return; }
    if (opened.current === pendingInvite) return;
    opened.current = pendingInvite;
    hideOnboarding(false);
    openMore(); account.setAccountRoute("settings");
  }, [pendingInvite, openMore, account.setAccountRoute, hideOnboarding]);
}
