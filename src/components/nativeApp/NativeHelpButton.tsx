import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { st } from "../../screens/nativeAppStyles";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";

export function NativeHelpButton({ title, children }: React.PropsWithChildren<{ title: string }>) {
  const [visible, setVisible] = React.useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => setVisible(true)} style={st.headerIconButton}>
      <View style={styles.icon}><Text style={styles.question}>?</Text></View>
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={st.shoppingSectionTitle}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={() => setVisible(false)} style={st.headerIconButton}>
              <AppIcon name="close" color={C.text} size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  icon: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.8, borderColor: C.text, alignItems: "center", justifyContent: "center" },
  question: { color: C.text, fontSize: 16, fontWeight: "700", lineHeight: 19 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { width: "100%", maxWidth: 420, maxHeight: "80%", backgroundColor: C.white, borderRadius: 20, padding: 20 },
  heading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  content: { gap: 16, paddingTop: 8, paddingBottom: 12 },
});
