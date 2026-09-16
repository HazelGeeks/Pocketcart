import React from "react";
import { Animated, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type useNativeAccount from "../../hooks/useNativeAccount";
import { marketingPalette as C } from "../../shared/design/palette";
import { AppIcon } from "../icons/AppIcon";
import { AccountAuthPanel } from "./AccountAuthPanel";

export function NativeAuthSheet({ account }: { account: ReturnType<typeof useNativeAccount> }) {
  const insets = useSafeAreaInsets();
  const busy = account.moreLoading || account.socialAuthLoading !== null;
  const progress = React.useRef(new Animated.Value(0)).current;
  const close = React.useCallback(() => {
    if (busy) return;
    Keyboard.dismiss();
    account.closeSubpage();
  }, [busy, account.closeSubpage]);
  React.useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [progress]);
  const drag = React.useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !busy && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_event, gesture) => { if (gesture.dy > 48 || gesture.vy > 0.6) close(); },
  }).panHandlers, [busy, close]);

  return <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
    <View style={s.root}>
      <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, { opacity: progress }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss sign-in sheet" disabled={busy} onPress={close} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[s.position, { paddingTop: insets.top + 12 }]}>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={close} style={[s.sheet, {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }],
        }]}>
          <View style={s.handleRow} {...drag}>
            <View style={s.handle} />
            <Pressable accessibilityRole="button" accessibilityLabel="Close sign-in sheet" disabled={busy} onPress={close} style={s.close}>
              <AppIcon name="close" color={C.textSoft} size={20} />
            </Pressable>
          </View>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={s.scroll}
            contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <AccountAuthPanel mode={account.authMode} loading={account.moreLoading} socialLoading={account.socialAuthLoading}
              message={account.moreMessage} signInEmail={account.signInEmail} signInPassword={account.signInPassword}
              signUpName={account.signUpName} signUpEmail={account.signUpEmail} signUpPassword={account.signUpPassword}
              onChangeMode={mode => { account.setAuthMode(mode); account.setMoreMessage(null); account.setSignInPassword(""); account.setSignUpPassword(""); }}
              onClearMessage={() => account.setMoreMessage(null)} onSignIn={account.signIn} onSignUp={account.signUp}
              onSignInWithApple={() => void account.signInWithProvider("apple")}
              onSignInWithGoogle={() => void account.signInWithProvider("google")}
              onForgotPassword={email => void account.requestReset(email)}
              onChangeSignInEmail={account.setSignInEmail} onChangeSignInPassword={account.setSignInPassword}
              onChangeSignUpName={account.setSignUpName} onChangeSignUpEmail={account.setSignUpEmail} onChangeSignUpPassword={account.setSignUpPassword} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: "rgba(9, 25, 15, 0.36)" },
  position: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "100%", width: "100%", maxWidth: 560, alignSelf: "center", backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  handleRow: { height: 42, justifyContent: "center", alignItems: "center" },
  handle: { width: 36, height: 4, backgroundColor: "#D9E2DB", borderRadius: 2 },
  close: { position: "absolute", right: 8, top: 0, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingTop: 8, paddingHorizontal: 24 },
});
