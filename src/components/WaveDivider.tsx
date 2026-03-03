import React from "react";
import { View } from "react-native";

export default function WaveDivider({
  color,
  flip,
}: {
  color: string;
  flip?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        width: "120%",
        height: 60,
        alignSelf: "center",
        backgroundColor: color,
        borderTopLeftRadius: flip ? 0 : 9999,
        borderTopRightRadius: flip ? 0 : 9999,
        borderBottomLeftRadius: flip ? 9999 : 0,
        borderBottomRightRadius: flip ? 9999 : 0,
        marginLeft: "-10%",
        marginTop: flip ? 0 : -30,
        marginBottom: flip ? -30 : 0,
      }}
    />
  );
}
