import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { useFamily } from "../../contexts/FamilyContext";
import { hasSupabaseEnv } from "../../services/supabaseClient";
import { marketingPalette as C } from "../../shared/design/palette";
import { F } from "../../screens/nativeAppStyles/fonts";

export function GuestAccountPanel({ onSignIn, onSignUp, message }: {
  onSignIn: () => void; onSignUp: () => void; message: string | null;
}) {
  const { pendingInvite } = useFamily();
  return <View style={s.page}>
    <View style={s.hero}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={224} height={186} viewBox="0 0 224 186" fill="none">
          <Ellipse cx={114} cy={169} rx={77} ry={8} fill={C.primaryGhost} />
          <Circle cx={115} cy={87} r={76} fill="#F1F8EF" />
          <G rotation={-10} origin="72,73">
            <Path d="M62 79C39 68 42 44 47 36C68 41 79 58 72 76" fill="#8CCC8F" />
            <Path d="M70 75C61 51 77 31 91 28C100 48 94 70 76 79" fill={C.primaryLight} />
            <Path d="M53 78C42 68 31 74 31 91C31 109 44 124 56 122C66 126 82 110 82 92C82 76 69 70 59 78" fill="#D4ECC3" />
          </G>
          <G rotation={9} origin="156,80">
            <Rect x={138} y={37} width={43} height={85} rx={12} fill="#E9DCC4" />
            <Path d="m148 56 13-5m-12 21 14-5m-12 21 14-5" stroke="#C6B48D" strokeWidth={4} strokeLinecap="round" />
          </G>
          <Path d="m58 90 13 60a12 12 0 0 0 12 10h66a12 12 0 0 0 12-10l13-60" fill={C.primaryPale} />
          <Path d="m85 91 19-31m43 31-19-31" stroke={C.primaryDeep} strokeWidth={8} strokeLinecap="round" />
          <Rect x={54} y={87} width={124} height={14} rx={7} fill={C.primary} />
          <Path d="m88 115 4 27m24-27v27m28-27-4 27" stroke="#A8DDB7" strokeWidth={6} strokeLinecap="round" />
          <Circle cx={175} cy={130} r={21} fill={C.primaryDeep} />
          <Path d="m166 130 6 6 12-13" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <Text style={s.wordmark}>PocketCart</Text>
      <Text accessibilityRole="header" style={s.title}>Good groceries.{"\n"}Better together.</Text>
      <Text style={s.description}>Save your favourites, plan your cart,{"\n"}and keep track of food at home.</Text>
    </View>
    <View style={s.actions}>
      {pendingInvite ? <Text accessibilityRole="alert" style={s.notice}>Your family invitation is saved. Sign in or create an account to join.</Text> : null}
      {message ? <Text accessibilityRole="alert" style={s.notice}>{message}</Text> : null}
      {hasSupabaseEnv ? <>
        <Pressable accessibilityRole="button" onPress={onSignUp} style={({ pressed }) => [s.primary, pressed && s.pressed]}>
          <Text style={s.primaryText}>Create account</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Sign in" onPress={onSignIn} style={s.signIn}>
          <Text style={s.signInCopy}>Already have an account? <Text style={s.signInLabel}>Sign in</Text></Text>
        </Pressable>
        <Text style={s.footnote}>Free to join. Browse deals anytime.</Text>
      </> : <Text style={s.notice}>Account services are currently unavailable.</Text>}
    </View>
  </View>;
}

const s = StyleSheet.create({
  page: { flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", gap: 28, paddingHorizontal: 8, paddingBottom: 8 },
  hero: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  wordmark: { color: C.primaryDeep, fontFamily: F.extraBold, fontSize: 38, letterSpacing: -1.5, marginTop: 8, marginBottom: 28 },
  title: { color: C.text, fontFamily: F.extraBold, fontSize: 30, lineHeight: 37, letterSpacing: -0.7, textAlign: "center" },
  description: { color: C.textSoft, fontFamily: F.regular, fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 14 },
  actions: { gap: 8 },
  primary: { minHeight: 56, borderRadius: 16, backgroundColor: C.primaryDeep, alignItems: "center", justifyContent: "center", padding: 14 },
  pressed: { opacity: 0.82 },
  primaryText: { color: C.white, fontFamily: F.extraBold, fontSize: 17 },
  signIn: { minHeight: 52, alignItems: "center", justifyContent: "center", padding: 8 },
  signInCopy: { color: C.textSoft, fontFamily: F.regular, fontSize: 15, textAlign: "center" },
  signInLabel: { color: C.primaryDeep, fontFamily: F.extraBold },
  footnote: { color: C.textMuted, fontFamily: F.regular, fontSize: 12, textAlign: "center" },
  notice: { color: C.textSoft, fontFamily: F.semibold, fontSize: 13, lineHeight: 20, textAlign: "center", paddingBottom: 8 },
});
