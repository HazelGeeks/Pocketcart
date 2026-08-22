import { StyleSheet, Text, View } from "react-native";
import { marketingPalette as C } from "../shared/design/palette";

export default function NativeAppScreenWeb() {
  return (
    <View style={st.root}>
      <Text style={st.title}>Native app screen is not rendered on web.</Text>
      <Text style={st.body}>
        Use the marketing pages or /admin on web. Native tabs are available on iOS/Android builds.
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: C.bg,
    gap: 8,
  },
  title: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: C.textSoft,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
