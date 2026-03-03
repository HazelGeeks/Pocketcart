import React from "react";
import { View } from "react-native";

type BlobP = {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
};

export default function Blob({ size, color, top, left, right, bottom }: BlobP) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        ...(top !== undefined && { top }),
        ...(left !== undefined && { left }),
        ...(right !== undefined && { right }),
        ...(bottom !== undefined && { bottom }),
      }}
    />
  );
}
