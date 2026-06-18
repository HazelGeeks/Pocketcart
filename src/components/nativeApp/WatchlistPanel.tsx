import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { WatchlistItem } from "../../services/watchlist";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";

type WatchlistPanelProps = {
  hasSupabaseEnv: boolean;
  items: WatchlistItem[];
  name: string;
  store: string;
  targetPrice: string;
  loading: boolean;
  submitting: boolean;
  removingId: string | null;
  message: string | null;
  onChangeName: (value: string) => void;
  onChangeStore: (value: string) => void;
  onChangeTargetPrice: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
};

export function WatchlistPanel({
  hasSupabaseEnv,
  items,
  name,
  store,
  targetPrice,
  loading,
  submitting,
  removingId,
  message,
  onChangeName,
  onChangeStore,
  onChangeTargetPrice,
  onAddItem,
  onRemoveItem,
}: WatchlistPanelProps) {
  return (
    <View style={st.sectionStack}>
      <Text style={st.sectionTitle}>Watchlist</Text>
      <Text style={st.sectionSub}>Only items you add are shown here.</Text>

      {!hasSupabaseEnv ? (
        <View style={st.rowCard}>
          <Text style={st.itemName}>Supabase configuration required</Text>
          <Text style={st.itemMeta}>
            Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
          </Text>
        </View>
      ) : (
        <View style={st.rowCard}>
          <Text style={st.itemName}>Add Watchlist Item</Text>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Item name"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={st.formInput}
          />
          <TextInput
            value={store}
            onChangeText={onChangeStore}
            placeholder="Store"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            style={st.formInput}
          />
          <TextInput
            value={targetPrice}
            onChangeText={onChangeTargetPrice}
            placeholder="Target price (optional)"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
            style={st.formInput}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onAddItem}
            style={[st.authBtn, st.authBtnPrimary]}
            disabled={submitting}
          >
            <Text style={st.authBtnPrimaryText}>
              {submitting ? "Adding..." : "Add Item"}
            </Text>
          </Pressable>
        </View>
      )}

      {message ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>{message}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>Loading watchlist...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={st.rowCard}>
          <Text style={st.itemMeta}>No watchlist items yet. Add your first item above.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={st.rowCard}>
            <View style={st.watchRowTop}>
              <View style={st.watchRowMain}>
                <Text style={st.itemName}>{item.name}</Text>
                <Text style={st.itemMeta}>{item.store}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRemoveItem(item.id)}
                style={[st.removeBtn, removingId === item.id && st.removeBtnDisabled]}
                disabled={removingId === item.id}
              >
                <Text style={st.removeBtnText}>
                  {removingId === item.id ? "Removing..." : "Remove"}
                </Text>
              </Pressable>
            </View>

            <View style={st.tagRow}>
              <Text style={st.tag}>Target {item.target_price?.trim() || "-"}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
