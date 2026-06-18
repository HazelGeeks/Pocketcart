import React from "react";
import { Text, View } from "react-native";

type AdminStatusPanelsProps = {
  styles: Record<string, any>;
};

export function AdminSupabaseSetupNotice({ styles: st }: AdminStatusPanelsProps) {
  return (
    <View style={st.infoCard}>
      <Text style={st.infoTitle}>Supabase setup required</Text>
      <Text style={st.infoBody}>
        Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY first.
      </Text>
    </View>
  );
}

export function AdminNoticePanel({
  notice,
  styles: st,
}: AdminStatusPanelsProps & { notice: string }) {
  return (
    <View style={st.noticeCard}>
      <Text style={st.noticeText}>{notice}</Text>
    </View>
  );
}
