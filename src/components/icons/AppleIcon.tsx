import Svg, { Path } from "react-native-svg";

export default function AppleIcon({
  size = 22,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.64-2.2.46-3.06-.4C3.79 16.17 4.36 9.53 8.72 9.29c1.27.06 2.15.72 2.9.76.97-.2 1.9-.89 2.96-.81 1.26.1 2.2.6 2.83 1.54-2.59 1.55-1.97 4.96.36 5.91-.47 1.23-.79 1.84-1.49 2.93l.77.66ZM12.05 9.22c-.16-2.07 1.52-3.85 3.46-4.02.28 2.36-2.13 4.18-3.46 4.02Z"
        fill={color}
      />
    </Svg>
  );
}
