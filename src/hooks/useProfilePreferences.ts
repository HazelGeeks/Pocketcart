import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  EMPTY_PROFILE_PREFERENCES,
  getProfilePreferences,
  saveProfilePreferences,
  type ProfilePreferences,
} from "../services/profilePreferences";
import { normalizeProfilePreferences } from "../utils/profilePreferenceNormalization";

const STORAGE_KEY = "pocketcart.profile-preferences.v1";

function pendingStorageKey(email: string) {
  return `${STORAGE_KEY}.pending.${encodeURIComponent(email.trim().toLowerCase())}`;
}

function storageKey(profileId: string | null, ownerEmail: string | null) {
  if (profileId) return `${STORAGE_KEY}.user.${profileId}`;
  if (ownerEmail) return pendingStorageKey(ownerEmail);
  return `${STORAGE_KEY}.guest`;
}

export default function useProfilePreferences(
  profileId: string | null,
  ownerEmail: string | null,
) {
  const [preferences, setPreferences] = React.useState<ProfilePreferences>(EMPTY_PROFILE_PREFERENCES);
  const [loadedKey, setLoadedKey] = React.useState<string | null>(null);
  const preferencesRef = React.useRef(preferences);
  const key = storageKey(profileId, ownerEmail);
  const fallbackKey = profileId && ownerEmail ? pendingStorageKey(ownerEmail) : null;

  React.useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  React.useEffect(() => {
    let active = true;
    setLoadedKey(null);
    void AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return null;
        if (raw) return raw;
        return fallbackKey ? AsyncStorage.getItem(fallbackKey) : null;
      })
      .then((raw) => {
        if (!active) return;
        setPreferences(raw
          ? normalizeProfilePreferences(JSON.parse(raw) as Partial<ProfilePreferences>)
          : EMPTY_PROFILE_PREFERENCES);
      })
      .catch(() => {
        if (active) setPreferences(EMPTY_PROFILE_PREFERENCES);
      })
      .finally(() => {
        if (active) setLoadedKey(key);
      });
    return () => {
      active = false;
    };
  }, [fallbackKey, key]);

  React.useEffect(() => {
    if (loadedKey !== key || !profileId) return;
    let active = true;
    void getProfilePreferences().then(({ data }) => {
      if (!active) return;
      if (data?.completed) {
        setPreferences(data);
        void AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => undefined);
        return;
      }
      if (preferencesRef.current.completed) {
        void saveProfilePreferences(preferencesRef.current).then(({ error }) => {
          if (!error && fallbackKey) {
            void AsyncStorage.removeItem(fallbackKey).catch(() => undefined);
          }
        });
      }
    });
    return () => {
      active = false;
    };
  }, [fallbackKey, key, loadedKey, profileId]);

  const save = React.useCallback(async (next: ProfilePreferences) => {
    const normalized = normalizeProfilePreferences(next);
    setPreferences(normalized);
    await AsyncStorage.setItem(key, JSON.stringify(normalized)).catch(() => undefined);
    if (!profileId) return null;
    const { error } = await saveProfilePreferences(normalized);
    return error;
  }, [key, profileId]);

  const saveDraft = React.useCallback((next: ProfilePreferences) => {
    const normalized = normalizeProfilePreferences(next);
    setPreferences(normalized);
    void AsyncStorage.setItem(key, JSON.stringify(normalized)).catch(() => undefined);
  }, [key]);

  return { loaded: loadedKey === key, preferences, save, saveDraft };
}
