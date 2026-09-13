import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Linking } from "react-native";
import { supabase } from "../services/supabaseClient";
import { loadFamily, type Family } from "../services/family";
import { parseFamilyInvite } from "../utils/familyInvite";
const KEY = "pc-pending-family-invite-v1";
type State = { userId: string | null; family: Family | null; ready: boolean; error: string | null; pendingInvite: string | null;
  refresh: () => Promise<void>; setInvite: (token: string | null) => Promise<void> };
const Context = React.createContext<State | null>(null);
export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [sessionReady, setSessionReady] = React.useState(false);
  const [state, setState] = React.useState<{ userId: string | null; family: Family | null; ready: boolean; error: string | null }>({ userId: null, family: null, ready: false, error: null });
  const [pendingInvite, setPendingInvite] = React.useState<string | null>(null);
  const generation = React.useRef(0);
  const inviteVersion = React.useRef(0);
  const inviteWrites = React.useRef(Promise.resolve());
  const setInvite = React.useCallback(async (token: string | null) => {
    inviteVersion.current++;
    setPendingInvite(token);
    inviteWrites.current = inviteWrites.current.catch(() => {}).then(() => token ? AsyncStorage.setItem(KEY, token) : AsyncStorage.removeItem(KEY));
    await inviteWrites.current;
  }, []);
  React.useEffect(() => {
    let live = true;
    const version = inviteVersion.current;
    void AsyncStorage.getItem(KEY).then(value => { if (live && inviteVersion.current === version && value) setPendingInvite(parseFamilyInvite(value)); }).catch(() => {});
    const handle = (url: string | null) => { const token = url && parseFamilyInvite(url); if (live && token) void setInvite(token).catch(() => {}); };
    void Linking.getInitialURL().then(url => { if (inviteVersion.current === version) handle(url); }).catch(() => {});
    const links = Linking.addEventListener("url", ({ url }) => handle(url));
    return () => { live = false; links.remove(); };
  }, [setInvite]);
  React.useEffect(() => {
    if (!supabase) { setSessionReady(true); return; }
    let live = true;
    let changed = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      changed = true;
      if (live) { setUserId(session?.user.id ?? null); setSessionReady(true); }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (live && !changed) { setUserId(data.session?.user.id ?? null); setSessionReady(true); }
    }).catch(() => { if (live) setSessionReady(true); });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  const refresh = React.useCallback(async () => {
    const request = ++generation.current;
    if (!sessionReady) return;
    if (!userId) { setState({ userId, family: null, ready: true, error: null }); return; }
    try {
      const family = await loadFamily();
      if (request === generation.current) setState({ userId, family, ready: true, error: null });
    } catch (error) {
      if (request === generation.current) setState(current => ({ userId, family: current.userId === userId ? current.family : null, ready: false, error: error instanceof Error ? error.message : "Could not load your family." }));
    }
  }, [userId, sessionReady]);
  React.useEffect(() => {
    void refresh();
    const resume = AppState.addEventListener("change", next => { if (next === "active") void refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 15000);
    return () => { generation.current++; resume.remove(); clearInterval(timer); };
  }, [refresh]);
  const current = state.userId === userId;
  return <Context.Provider value={{ userId, family: current ? state.family : null, ready: sessionReady && current && state.ready, error: current ? state.error : null, pendingInvite, refresh, setInvite }}>{children}</Context.Provider>;
}
export function useFamily() {
  const value = React.useContext(Context);
  if (!value) throw new Error("FamilyProvider is missing");
  return value;
}
