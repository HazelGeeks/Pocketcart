import { Pressable, Text, View } from "react-native";

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
  onDismiss,
}: AdminStatusPanelsProps & { notice: string; onDismiss: () => void }) {
  return (
    <View style={st.noticeCard}>
      <Text style={st.noticeText}>{notice}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss admin message"
        hitSlop={8}
        onPress={onDismiss}
        style={st.noticeDismissButton}
      >
        <Text aria-hidden style={st.noticeDismissText}>
          ×
        </Text>
      </Pressable>
    </View>
  );
}
