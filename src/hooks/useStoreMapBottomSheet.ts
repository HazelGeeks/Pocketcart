import React from "react";
import { Animated, PanResponder } from "react-native";
import {
  getNearestStoreMapSheetSnap,
  getNextStoreMapSheetSnap,
  getStoreMapSheetOffsets,
  type StoreMapSheetSnap,
} from "../utils/storeMapBottomSheet";

type Options = {
  screenHeight: number;
  topInset: number;
  bottomInset: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function useStoreMapBottomSheet({ screenHeight, topInset, bottomInset }: Options) {
  const bottomOffset = 88 + Math.max(bottomInset, 10);
  const maxHeight = Math.max(232, Math.min(620, screenHeight - topInset - bottomOffset - 112));
  const offsets = React.useMemo(() => getStoreMapSheetOffsets(maxHeight), [maxHeight]);
  const translateY = React.useRef(new Animated.Value(offsets.collapsed)).current;
  const dragStart = React.useRef(offsets.collapsed);
  const [snap, setSnap] = React.useState<StoreMapSheetSnap>("collapsed");
  const snapRef = React.useRef<StoreMapSheetSnap>("collapsed");

  const animateTo = React.useCallback(
    (nextSnap: StoreMapSheetSnap) => {
      snapRef.current = nextSnap;
      setSnap(nextSnap);
      Animated.spring(translateY, {
        toValue: offsets[nextSnap],
        damping: 24,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    },
    [offsets, translateY],
  );

  React.useEffect(() => {
    const currentOffset = offsets[snapRef.current];
    translateY.setValue(currentOffset);
    dragStart.current = currentOffset;
  }, [offsets, translateY]);

  const panHandlers = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation((value) => {
            dragStart.current = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          translateY.setValue(
            clamp(dragStart.current + gesture.dy, offsets.expanded, offsets.collapsed),
          );
        },
        onPanResponderRelease: (_event, gesture) => {
          const currentOffset = clamp(
            dragStart.current + gesture.dy,
            offsets.expanded,
            offsets.collapsed,
          );
          animateTo(getNearestStoreMapSheetSnap(offsets, currentOffset, gesture.vy));
        },
        onPanResponderTerminate: () => animateTo(snap),
      }).panHandlers,
    [animateTo, offsets, snap, translateY],
  );

  const toggle = React.useCallback(
    () => animateTo(getNextStoreMapSheetSnap(snap)),
    [animateTo, snap],
  );
  const collapse = React.useCallback(() => animateTo("collapsed"), [animateTo]);

  return {
    bottomOffset,
    collapse,
    maxHeight,
    panHandlers,
    snap,
    toggle,
    translateY,
  };
}
