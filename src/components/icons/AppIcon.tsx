import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type AppIconName =
  | "alert"
  | "bell"
  | "check"
  | "chevron-right"
  | "close"
  | "heart"
  | "list"
  | "location"
  | "map";

type Props = {
  name: AppIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({
  name,
  color,
  size = 24,
  strokeWidth = 2,
}: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "map" ? (
        <>
          <Path d="M9 5 4.5 7v12L9 17l6 2 4.5-2V5L15 7 9 5Z" {...common} />
          <Path d="M9 5v12M15 7v12" {...common} />
        </>
      ) : null}
      {name === "location" ? (
        <>
          <Path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" {...common} />
          <Circle cx={12} cy={10} r={2.2} {...common} />
        </>
      ) : null}
      {name === "heart" ? (
        <Path d="M20.2 5.8a4.7 4.7 0 0 0-6.7 0L12 7.3l-1.5-1.5a4.7 4.7 0 1 0-6.7 6.7L12 20l8.2-7.5a4.7 4.7 0 0 0 0-6.7Z" {...common} />
      ) : null}
      {name === "list" ? (
        <>
          <Path d="M8 6h11M8 12h11M8 18h11" {...common} />
          <Circle cx={4.5} cy={6} r={0.9} fill={color} />
          <Circle cx={4.5} cy={12} r={0.9} fill={color} />
          <Circle cx={4.5} cy={18} r={0.9} fill={color} />
        </>
      ) : null}
      {name === "bell" ? (
        <>
          <Path d="M6.5 10.5a5.5 5.5 0 0 1 11 0v3.4l1.6 2.5H4.9l1.6-2.5v-3.4Z" {...common} />
          <Path d="M10 19a2 2 0 0 0 4 0" {...common} />
        </>
      ) : null}
      {name === "check" ? <Path d="m5 12.5 4.2 4.2L19 7" {...common} /> : null}
      {name === "chevron-right" ? <Path d="m9 5 7 7-7 7" {...common} /> : null}
      {name === "close" ? <Path d="m6 6 12 12M18 6 6 18" {...common} /> : null}
      {name === "alert" ? (
        <>
          <Path d="M12 3.5 21 20H3L12 3.5Z" {...common} />
          <Path d="M12 9v5" {...common} />
          <Rect x={11} y={16.5} width={2} height={2} rx={1} fill={color} />
        </>
      ) : null}
    </Svg>
  );
}
