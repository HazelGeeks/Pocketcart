import type React from "react";
import { Pressable, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon, type AppIconName } from "../icons/AppIcon";

export function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={st.settingsSection}>
      <Text accessibilityRole="header" style={st.settingsSectionLabel}>{label}</Text>
      <View style={st.settingsGroup}>{children}</View>
    </View>
  );
}

export function SettingsLinkRow({
  label,
  value,
  icon,
  destructive = false,
  disabled = false,
  onPress,
}: {
  label: string;
  value?: string;
  icon?: AppIconName;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.settingsLinkRow,
        pressed && st.settingsRowPressed,
        disabled && { opacity: 0.5 },
      ]}
    >
      {icon ? <AppIcon name={icon} color={C.primaryDeep} size={23} /> : null}
      <View style={st.settingsRowCopy}>
        <Text style={[st.settingsRowTitle, destructive && st.settingsDangerText]}>{label}</Text>
        {value ? <Text style={st.settingsHelp}>{value}</Text> : null}
      </View>
      <View style={st.settingsLinkMeta}>
        <AppIcon
          name="chevron-right"
          color={destructive ? "#A83939" : C.textMuted}
          size={20}
          strokeWidth={2.1}
        />
      </View>
    </Pressable>
  );
}
