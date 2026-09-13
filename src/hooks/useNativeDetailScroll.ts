import React from "react";
import type { ScrollView } from "react-native";

export default function useNativeDetailScroll(detailKey: string | null) {
  const scrollRef = React.useRef<ScrollView | null>(null);

  React.useLayoutEffect(() => {
    if (detailKey !== null) {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [detailKey]);

  return scrollRef;
}
