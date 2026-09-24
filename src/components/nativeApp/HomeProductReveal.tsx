import React from "react";
import { Animated } from "react-native";

type Props = React.PropsWithChildren<{
  animate: boolean;
  reduceMotion: boolean;
  delay: number;
}>;

export function HomeProductReveal({ children, animate, reduceMotion, delay }: Props) {
  const progress = React.useRef(new Animated.Value(animate && !reduceMotion ? 0 : 1)).current;
  React.useEffect(() => {
    if (!animate || reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, delay, progress, reduceMotion]);

  return (
    <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}
