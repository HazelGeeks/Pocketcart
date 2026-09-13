import type React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";

export function AppSheet({ title, visible, onClose, busy = false, children }: React.PropsWithChildren<{
  title: string; visible: boolean; onClose: () => void; busy?: boolean;
}>) {
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }}>
        <Text accessibilityRole="header" style={st.shoppingSectionTitle}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} disabled={busy} onPress={onClose} style={st.headerIconButton}>
          <AppIcon name="close" color={C.text} size={22} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16 }}>{children}</ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
