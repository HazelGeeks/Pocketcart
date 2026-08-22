import Svg, { Circle, Path, Rect } from "react-native-svg";
import { marketingPalette as C } from "../../shared/design/palette";
import type { CategoryIconVariant } from "../../utils/categoryIcon";

export function CategoryPlaceholderIcon({ variant }: { variant: CategoryIconVariant }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={21} fill={C.primaryGhost} />
      <CategoryIconGlyph variant={variant} />
    </Svg>
  );
}

function CategoryIconGlyph({ variant }: { variant: CategoryIconVariant }) {
  const stroke = C.primaryDeep;
  const fill = C.primaryLight;
  const accent = C.primary;
  switch (variant) {
    case "all": return <><Rect x={14} y={14} width={8} height={8} rx={2} fill={fill} stroke={stroke} strokeWidth={2} /><Rect x={26} y={14} width={8} height={8} rx={2} fill={C.white} stroke={stroke} strokeWidth={2} /><Rect x={14} y={26} width={8} height={8} rx={2} fill={C.white} stroke={stroke} strokeWidth={2} /><Rect x={26} y={26} width={8} height={8} rx={2} fill={accent} stroke={stroke} strokeWidth={2} /></>;
    case "meat": return <><Path d="M15 28c0-8 7-14 15-12 4 1 6 4 5 8-1 6-7 10-14 9-4 0-6-2-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Circle cx={30} cy={22} r={3} fill={C.white} stroke={stroke} strokeWidth={2} /></>;
    case "seafood": return <><Path d="M13 24c6-7 15-8 22 0-7 8-16 7-22 0Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M35 24l6-5v10l-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Circle cx={19} cy={23} r={1.6} fill={stroke} /></>;
    case "snack": return <><Path d="M17 14h14l3 22H14l3-22Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M18 20h12M19 27h10" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={31} cy={32} r={2.5} fill={accent} /></>;
    case "dessert": return <><Path d="M14 33h21L31 18H18l-4 15Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" /><Path d="M18 18c2-5 10-6 13 0M18 26h15" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={27} cy={14} r={2.5} fill={accent} /></>;
    case "fruit": return <><Path d="M17 25c0-6 4-9 7-6 3-3 7 0 7 6 0 7-4 11-7 11s-7-4-7-11Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M25 18c1-4 4-5 8-4-1 4-4 5-8 4Z" fill={accent} stroke={stroke} strokeWidth={2} /></>;
    case "vegetable": return <><Path d="M15 30c6-13 15-15 20-13-1 9-8 17-20 13Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M18 28c5-2 10-6 15-11" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "dairy": return <><Path d="M18 17h12l3 6v13H15V23l3-6Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 12h10l1 5H18l1-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M15 24h18" stroke={stroke} strokeWidth={2} /></>;
    case "kimchi": return <><Path d="M16 18h16l-2 18H18l-2-18Z" fill={C.white} stroke={stroke} strokeWidth={2} strokeLinejoin="round" /><Path d="M15 18h18M19 14h10l2 4H17l2-4Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M20 29c4-6 8-6 10-4-1 5-5 8-10 4Z" fill={accent} stroke={stroke} strokeWidth={1.8} /></>;
    case "noodles": return <><Path d="M15 25h18c0 7-3 11-9 11s-9-4-9-11Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M13 22h22M18 19c0-3 2-4 2-7M24 19c0-3 2-4 2-7M30 19c0-3 2-4 2-7" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "rice": return <><Path d="M15 25h18c0 7-3 11-9 11s-9-4-9-11Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M17 24c1-7 13-9 15 0" fill={C.white} stroke={stroke} strokeWidth={2} /><Circle cx={21} cy={21} r={1.2} fill={accent} /><Circle cx={26} cy={19} r={1.2} fill={accent} /><Circle cx={29} cy={22} r={1.2} fill={accent} /></>;
    case "grains": return <><Path d="M16 20h16l-2 16H18l-2-16Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M19 20c0-5 3-8 7-8 3 0 5 2 6 5" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={22} cy={27} r={1.5} fill={stroke} /><Circle cx={27} cy={31} r={1.5} fill={stroke} /></>;
    case "bakery": return <><Path d="M14 27c0-6 5-10 10-10s10 4 10 10v7H14v-7Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M20 22c2 2 2 5 0 8M28 22c-2 2-2 5 0 8" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "beverage": return <><Path d="M17 14h16l-3 23H20l-3-23Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 22h12l-1 9H20l-1-9Z" fill={fill} /><Path d="M26 14l5-5" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "frozen": return <><Path d="M24 13v22M15 18l18 12M33 18 15 30" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={24} cy={24} r={5} fill={fill} stroke={stroke} strokeWidth={2} /></>;
    case "deli": return <><Rect x={14} y={17} width={20} height={18} rx={4} fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M14 24h20M24 17v18" stroke={stroke} strokeWidth={2} /><Circle cx={19} cy={21} r={2} fill={accent} /><Circle cx={29} cy={30} r={2} fill={fill} /></>;
    case "canned": return <><Path d="M17 16c0-2 14-2 14 0v17c0 2-14 2-14 0V16Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M17 16c0 2 14 2 14 0M17 25c0 2 14 2 14 0" stroke={stroke} strokeWidth={2} /></>;
    case "soup": return <><Path d="M14 25h20c0 7-4 11-10 11s-10-4-10-11Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M13 22h22M19 18c-2-3 2-4 0-7M25 18c-2-3 2-4 0-7M31 18c-2-3 2-4 0-7" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "spice": return <><Path d="M18 19h12l2 17H16l2-17Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M18 15h12v4H18v-4Z" fill={fill} stroke={stroke} strokeWidth={2} /><Circle cx={21} cy={17} r={1} fill={stroke} /><Circle cx={24} cy={17} r={1} fill={stroke} /><Circle cx={27} cy={17} r={1} fill={stroke} /><Path d="M20 27h8" stroke={accent} strokeWidth={2} strokeLinecap="round" /></>;
    case "cooking": return <><Path d="M24 13c5 6 8 10 8 15a8 8 0 0 1-16 0c0-5 3-9 8-15Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M24 21c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7Z" fill={C.white} /></>;
    case "baby": return <><Path d="M20 14h8l2 8v13H18V22l2-8Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 23h10" stroke={stroke} strokeWidth={2} /><Circle cx={24} cy={30} r={3} fill={fill} stroke={stroke} strokeWidth={2} /></>;
    case "household": return <><Path d="M20 14h8l2 7v15H18V21l2-7Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M19 24h10M21 14v-3h6v3" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={31} cy={31} r={3} fill={C.white} stroke={stroke} strokeWidth={2} /></>;
    case "houseware": return <><Path d="M15 22h18v12H15V22Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" /><Path d="M12 25h3M33 25h3M19 18h10M22 15h4v3" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Path d="M18 34h12" stroke={accent} strokeWidth={2} strokeLinecap="round" /></>;
    case "health": return <><Rect x={15} y={15} width={18} height={20} rx={5} fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M24 20v10M19 25h10" stroke={accent} strokeWidth={3} strokeLinecap="round" /></>;
    case "personal": return <><Path d="M19 19h10l3 17H16l3-17Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M21 19v-5h6v5M20 27h8" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "seaweed": return <><Path d="M18 35c-2-8 1-15 6-22 4 8 3 15-2 22" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Path d="M28 35c-2-6 0-11 5-16 3 7 1 12-5 16Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M16 35h18" stroke={accent} strokeWidth={2} strokeLinecap="round" /></>;
    case "pantry": return <><Rect x={14} y={15} width={20} height={20} rx={3} fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M14 25h20M24 15v20" stroke={stroke} strokeWidth={2} /><Rect x={17} y={18} width={4} height={4} rx={1} fill={fill} /><Rect x={27} y={28} width={4} height={4} rx={1} fill={accent} /></>;
    default: return <><Path d="M14 20h20l-2 15H16l-2-15Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" /><Path d="M18 20c0-5 2-8 6-8s6 3 6 8M18 26h12" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={20} cy={30} r={1.5} fill={accent} /><Circle cx={28} cy={30} r={1.5} fill={accent} /></>;
  }
}
