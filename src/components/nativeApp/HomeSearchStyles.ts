import { StyleSheet } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "../../screens/nativeAppStyles/fonts";

export const searchStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.white },
  title: { color: C.text, fontFamily: F.extraBold, fontSize: 26, paddingHorizontal: 20, paddingTop: 12 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20 },
  field: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: C.bg, paddingLeft: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 8, color: C.text, fontFamily: F.regular, fontSize: 16 },
  button: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  action: { color: C.primaryDeep, fontFamily: F.bold, fontSize: 14 },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { color: C.text, fontFamily: F.extraBold, fontSize: 18 },
  muted: { color: C.textMuted, fontFamily: F.regular, fontSize: 14 },
  stores: { gap: 12 },
  store: { width: 84, alignItems: "center", gap: 8 },
  logoFrame: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  logo: { width: 64, height: 64 },
  storeName: { color: C.textSoft, fontFamily: F.bold, fontSize: 12, textAlign: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line, borderRadius: 22 },
  chipText: { color: C.textSoft, fontFamily: F.semibold, fontSize: 14, flexShrink: 1 },
  result: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  resultText: { flex: 1, color: C.text, fontFamily: F.semibold, fontSize: 16 },
});
