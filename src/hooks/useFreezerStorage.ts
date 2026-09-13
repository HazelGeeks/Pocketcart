import React from "react";
import type { StorageAppearance } from "../utils/freezerStorageAppearance";
import { AppState } from "react-native";
import { useFamily } from "../contexts/FamilyContext";
import { deleteFreezerStorage, listFreezerStorage, saveFreezerStorage, type FreezerStorageUnit } from "../services/freezerStorage";
import type { FreezerStorageArea } from "../utils/freezerItem";

export default function useFreezerStorage(userId: string) {
  const family = useFamily();
  const familyId = family.family?.id ?? null;
  const scope = `${userId}:${familyId ?? "personal"}`;
  const currentScope = React.useRef(scope); currentScope.current = scope;
  const generation = React.useRef(0);
  const submitting = React.useRef(false);
  const [state, setState] = React.useState({ scope: "", units: [] as FreezerStorageUnit[], error: null as string | null });
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!family.ready || submitting.current) return;
    const request = ++generation.current;
    try {
      const result = await listFreezerStorage(userId, familyId);
      if (request !== generation.current || currentScope.current !== scope) return;
      setState(previous => ({ scope, units: result.error && previous.scope === scope ? previous.units : result.data, error: result.error }));
    } catch {
      if (request === generation.current && currentScope.current === scope) setState(previous => ({ scope, units: previous.scope === scope ? previous.units : [], error: "Could not load your storage locations. Please retry." }));
    } finally { if (request === generation.current && currentScope.current === scope) setLoading(false); }
  }, [userId, familyId, family.ready, scope]);

  React.useEffect(() => {
    setLoading(true); void load();
    const timer = setInterval(() => { if (AppState.currentState === "active") void load(); }, 10000);
    const resume = AppState.addEventListener("change", next => { if (next === "active") void load(); });
    return () => { generation.current++; clearInterval(timer); resume.remove(); };
  }, [load]);

  const save = async (name: string, area: FreezerStorageArea, creationId: string, unit?: FreezerStorageUnit, appearance?: StorageAppearance) => {
    if (!family.ready || submitting.current) return false;
    submitting.current = true; generation.current++; setSaving(true);
    try {
      const result = await saveFreezerStorage({ userId, expectedFamilyId: familyId, name, area, creationId, unit, appearance });
      if (currentScope.current !== scope) return false;
      setState(previous => ({ scope, error: result.error, units: result.data
        ? [...(previous.scope === scope ? previous.units : []).filter(row => row.id !== result.data?.id), result.data]
        : previous.scope === scope ? previous.units : [] }));
      return Boolean(result.data && !result.error);
    } catch {
      if (currentScope.current === scope) setState(previous => ({ ...previous, error: "Could not confirm the save. Please try again." }));
      return false;
    } finally { submitting.current = false; setSaving(false); }
  };

  const remove = async (unit: FreezerStorageUnit) => {
    if (!family.ready || submitting.current) return false;
    submitting.current = true; generation.current++; setDeleting(true);
    try {
      const error = await deleteFreezerStorage(userId, familyId, unit);
      if (currentScope.current !== scope) return false;
      setState(previous => ({ ...previous, error, units: error ? previous.units : previous.units.filter(row => row.id !== unit.id) }));
      return !error;
    } catch {
      if (currentScope.current === scope) setState(previous => ({ ...previous, error: "Could not confirm deletion. Refresh your storage before trying again." }));
      return false;
    } finally { submitting.current = false; setDeleting(false); }
  };

  return { units: family.ready && state.scope === scope ? state.units : [], error: state.scope === scope ? state.error : null,
    loading: !family.ready || loading, saving, deleting, save, remove, reload: load };
}
