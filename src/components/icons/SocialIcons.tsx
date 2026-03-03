import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
};

export function InstagramIcon({
  size = 16,
  color = "#FFFFFF",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke={color}
        strokeWidth="2"
      />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="17.2" cy="6.8" r="1.2" fill={color} />
    </Svg>
  );
}

export function FacebookIcon({
  size = 16,
  color = "#FFFFFF",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={
          "M13.4 20v-6h2.2l.4-2.5h-2.6V9.9c0-.7.2-1.2 1.3-1.2H16V6.5" +
          "c-.2 0-1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.7H9V14h1.7v6h2.7Z"
        }
        fill={color}
      />
    </Svg>
  );
}

export function XIcon({
  size = 16,
  color = "#FFFFFF",
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={
          "M5 4h3.6l3.4 4.8L15.5 4H19l-5.4 7.4L19.5 20H16" +
          "l-3.9-5.5L8.1 20H4.5l5.7-7.8L5 4Z"
        }
        fill={color}
      />
    </Svg>
  );
}
