import React from "react";
import type { ScrollView } from "react-native";

// Each route owns its scroll position; remounting the ScrollView prevents a
// restored offset from one page leaking into another page's layout.
export default function useNativeDetailScroll(screenKey: string) {
  const scrollRef = React.useRef<ScrollView | null>(null);
  const offsets = React.useRef(new Map<string, number>());
  const initialOffset = offsets.current.get(screenKey) ?? 0;
  const recordOffset = React.useCallback((offset: number) => {
    offsets.current.set(screenKey, Math.max(0, offset));
  }, [screenKey]);
  return { scrollRef, initialOffset, recordOffset };
}
