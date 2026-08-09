import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { st } from "../../screens/nativeAppStyles";
import { AppIcon } from "../icons/AppIcon";

type Props = {
  locationLabel: string;
  settingsPostalCode: string;
  loading: boolean;
  onChangeSettingsPostalCode: (value: string) => void;
  onShareLocation: () => void;
  onSetPostalLocation: () => void;
};

export function SettingsLocationCard({
  locationLabel,
  settingsPostalCode,
  loading,
  onChangeSettingsPostalCode,
  onShareLocation,
  onSetPostalLocation,
}: Props) {
  const [editing, setEditing] = React.useState(false);

  return (
    <View style={st.settingsLocationBlock}>
      <View style={st.settingsLocationTopRow}>
        <View style={st.settingsLocationIdentity}>
          <View style={st.settingsLocationIcon} accessibilityElementsHidden>
            <AppIcon name="location" color={C.primaryDeep} size={20} strokeWidth={2} />
          </View>
          <View style={st.settingsRowCopy}>
            <Text style={st.settingsRowTitle}>Shopping area</Text>
            <Text style={st.settingsLocationStatus} numberOfLines={1}>{locationLabel}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? "Close location editor" : "Change shopping area"}
          accessibilityState={{ expanded: editing }}
          onPress={() => setEditing((current) => !current)}
          style={({ pressed }) => [
            st.settingsLocationAction,
            pressed && st.settingsRowPressed,
            loading && { opacity: 0.5 },
          ]}
          disabled={loading}
        >
          <Text style={st.settingsLocationActionText}>{editing ? "Done" : "Change"}</Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={st.settingsLocationEditor}>
          <Pressable
            accessibilityRole="button"
            onPress={onShareLocation}
            style={({ pressed }) => [
              st.settingsCurrentLocationButton,
              pressed && st.settingsRowPressed,
              loading && { opacity: 0.5 },
            ]}
            disabled={loading}
          >
            <AppIcon name="location" color={C.primaryDeep} size={18} strokeWidth={2} />
            <Text style={st.settingsCurrentLocationButtonText}>Use my current location</Text>
          </Pressable>

          <View style={st.settingsPostalRow}>
            <TextInput
              accessibilityLabel="Postal code"
              value={settingsPostalCode}
              onChangeText={onChangeSettingsPostalCode}
              placeholder="Enter postal code"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[st.settingsInput, st.settingsPostalInput]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Update postal code"
              onPress={onSetPostalLocation}
              style={({ pressed }) => [
                st.settingsPostalButton,
                pressed && st.settingsPostalButtonPressed,
                loading && { opacity: 0.5 },
              ]}
              disabled={loading}
            >
              <Text style={st.settingsButtonPrimaryText}>Update</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
