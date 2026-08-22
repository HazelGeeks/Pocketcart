import Svg, { Path } from "react-native-svg";

export default function GooglePlayIcon({
  size = 22,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.61 1.814a1.63 1.63 0 0 0-.61 1.29v17.792a1.63 1.63 0 0 0 .61 1.29l.068.062 9.97-9.97v-.235L3.678 1.752l-.068.062Z"
        fill={color}
        opacity={0.85}
      />
      <Path
        d="m16.98 15.598-3.33-3.331v-.235l3.33-3.33.075.043 3.943 2.24c1.127.64 1.127 1.688 0 2.329l-3.943 2.24-.075.044Z"
        fill={color}
      />
      <Path
        d="M17.055 15.554 13.65 12.15 3.61 22.186c.372.392.986.44 1.683.05l11.762-6.682Z"
        fill={color}
        opacity={0.85}
      />
      <Path
        d="M17.055 8.745 5.293 2.064c-.697-.39-1.311-.343-1.683.049L13.65 12.15l3.405-3.405Z"
        fill={color}
        opacity={0.7}
      />
    </Svg>
  );
}
