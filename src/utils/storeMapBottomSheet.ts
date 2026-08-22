export type StoreMapSheetSnap = "collapsed" | "half" | "expanded";

export type StoreMapSheetOffsets = Record<StoreMapSheetSnap, number>;

export function getStoreMapSheetOffsets(
  maxHeight: number,
  collapsedHeight = 232,
): StoreMapSheetOffsets {
  const collapsed = Math.max(0, maxHeight - Math.min(collapsedHeight, maxHeight));
  return {
    expanded: 0,
    half: Math.round(collapsed * 0.5),
    collapsed,
  };
}

export function getNearestStoreMapSheetSnap(
  offsets: StoreMapSheetOffsets,
  currentOffset: number,
  velocityY: number,
): StoreMapSheetSnap {
  const projectedOffset = currentOffset + velocityY * 100;
  const snaps: StoreMapSheetSnap[] = ["expanded", "half", "collapsed"];

  return snaps.reduce((nearest, candidate) =>
    Math.abs(offsets[candidate] - projectedOffset) < Math.abs(offsets[nearest] - projectedOffset)
      ? candidate
      : nearest,
  );
}

export function getNextStoreMapSheetSnap(current: StoreMapSheetSnap): StoreMapSheetSnap {
  if (current === "collapsed") return "half";
  if (current === "half") return "expanded";
  return "collapsed";
}
