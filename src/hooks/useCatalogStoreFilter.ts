import React from "react";
import { type CatalogStoreFilter, readCatalogStoreFilter, saveCatalogStoreFilter } from "../services/catalogStoreFilters";

export function useCatalogStoreFilter(profileId: string | null, showToast: (message: string) => void) {
  const owner = profileId ?? "guest";
  const [state, setState] = React.useState<{ owner: string; value: CatalogStoreFilter } | null>(null);
  const currentOwner = React.useRef(owner);
  const revision = React.useRef(0);
  currentOwner.current = owner;
  React.useEffect(() => {
    let active = true;
    const request = ++revision.current;
    void readCatalogStoreFilter(profileId).then((value) => {
      if (active && request === revision.current) setState({ owner, value });
    }).catch(() => {
      if (active && request === revision.current) {
        setState({ owner, value: null });
        showToast("Couldn't restore your store filters. Please select them again.");
      }
    });
    return () => { active = false; };
  }, [profileId, owner, showToast]);
  const ready = state?.owner === owner;
  const change = React.useCallback((value: CatalogStoreFilter) => {
    revision.current += 1;
    setState({ owner, value });
    void saveCatalogStoreFilter(profileId, value).catch(() => {
      if (currentOwner.current === owner) showToast("Store filters applied, but couldn't be saved on this device.");
    });
  }, [owner, profileId, showToast]);
  return { ready, value: ready ? state.value : null, change };
}
