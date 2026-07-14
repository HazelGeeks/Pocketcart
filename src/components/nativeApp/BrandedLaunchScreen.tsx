import React from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";

type BrandedLaunchScreenProps = {
  ready: boolean;
  onFinish: () => void;
};

const MINIMUM_DISPLAY_MS = 900;
const EXIT_DURATION_MS = 240;

export function BrandedLaunchScreen({
  ready,
  onFinish,
}: BrandedLaunchScreenProps) {
  const mountedAt = React.useRef(Date.now());
  const entrance = React.useRef(new Animated.Value(0)).current;
  const exit = React.useRef(new Animated.Value(1)).current;
  const progress = React.useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      progress.setValue(1);
      return;
    }

    const animation = Animated.parallel([
      Animated.spring(entrance, {
        toValue: 1,
        damping: 16,
        stiffness: 150,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [entrance, progress, reduceMotion]);

  React.useEffect(() => {
    if (!ready) return undefined;

    const elapsed = Date.now() - mountedAt.current;
    const delay = Math.max(0, MINIMUM_DISPLAY_MS - elapsed);
    const timeout = setTimeout(() => {
      if (reduceMotion) {
        onFinish();
        return;
      }

      Animated.timing(exit, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [exit, onFinish, ready, reduceMotion]);

  const iconScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1],
  });
  const iconTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const runnerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-26, 26],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: exit }]}>
      <Animated.View
        style={[
          styles.iconFrame,
          {
            opacity: entrance,
            transform: [
              { translateY: iconTranslateY },
              { scale: iconScale },
            ],
          },
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={require("../../../assets/icon.png")}
          style={styles.icon}
        />
      </Animated.View>

      <View accessibilityLabel="PocketCart is starting" style={styles.track}>
        <Animated.View
          style={[
            styles.runner,
            { transform: [{ translateX: runnerTranslateX }] },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: C.bg,
    flex: 1,
    justifyContent: "center",
  },
  iconFrame: {
    borderRadius: 42,
    elevation: 8,
    shadowColor: C.primaryDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  icon: {
    borderRadius: 42,
    height: 176,
    width: 176,
  },
  track: {
    alignItems: "center",
    backgroundColor: C.primaryPale,
    borderRadius: 999,
    height: 6,
    justifyContent: "center",
    marginTop: 34,
    overflow: "hidden",
    width: 72,
  },
  runner: {
    backgroundColor: C.primaryDeep,
    borderRadius: 999,
    height: 6,
    width: 20,
  },
});
