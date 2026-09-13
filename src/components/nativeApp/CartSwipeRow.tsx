import React from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { marketingPalette as C } from "../../shared/design/palette";
import { getCartSwipeAction, shouldStartCartSwipe } from "../../utils/cartSwipe";

type Props = React.PropsWithChildren<{
  completed: boolean;
  onPurchase: () => void;
  onDelete: () => void;
}>;

export function CartSwipeRow({ children, completed, onPurchase, onDelete }: Props) {
  const offset = React.useRef(new Animated.Value(0)).current;
  const callbacks = React.useRef({ onPurchase, onDelete });
  callbacks.current = { onPurchase, onDelete };
  const responder = React.useMemo(() => {
    const reset = () => Animated.spring(offset, { toValue: 0, useNativeDriver: true, overshootClamping: true }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => shouldStartCartSwipe(gesture),
      onPanResponderGrant: () => offset.stopAnimation(),
      onPanResponderMove: (_event, gesture) => offset.setValue(Math.max(-140, Math.min(140, gesture.dx))),
      onPanResponderRelease: (_event, gesture) => {
        const action = getCartSwipeAction(gesture);
        // Reset before invoking a mutation: it may move this row to another group.
        if (action) {
          offset.setValue(0);
          if (action === "purchase") callbacks.current.onPurchase();
          else callbacks.current.onDelete();
        } else reset();
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: reset,
    });
  }, [offset]);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.action, styles.purchase, { opacity: offset.interpolate({ inputRange: [0, 20], outputRange: [0, 1], extrapolate: "clamp" }) }]}>
          <Text style={styles.label}>{completed ? "To buy" : "Purchased"}</Text>
        </Animated.View>
        <Animated.View style={[styles.action, styles.remove, { opacity: offset.interpolate({ inputRange: [-20, 0], outputRange: [1, 0], extrapolate: "clamp" }) }]}>
          <Text style={styles.label}>Delete</Text>
        </Animated.View>
      </View>
      <Animated.View {...responder.panHandlers} style={{ backgroundColor: C.white, transform: [{ translateX: offset }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  action: { ...StyleSheet.absoluteFillObject, justifyContent: "center", paddingHorizontal: 16 },
  purchase: { backgroundColor: C.primaryDeep, alignItems: "flex-start" },
  remove: { backgroundColor: "#B42318", alignItems: "flex-end" },
  label: { color: C.white, fontSize: 14, fontWeight: "700" },
});
