import React from "react";
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
    case "meat": return <><Path d="M15 28c0-8 7-14 15-12 4 1 6 4 5 8-1 6-7 10-14 9-4 0-6-2-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Circle cx={30} cy={22} r={3} fill={C.white} stroke={stroke} strokeWidth={2} /></>;
    case "seafood": return <><Path d="M13 24c6-7 15-8 22 0-7 8-16 7-22 0Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M35 24l6-5v10l-6-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Circle cx={19} cy={23} r={1.6} fill={stroke} /></>;
    case "snack": return <><Path d="M17 14h14l3 22H14l3-22Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M18 20h12M19 27h10" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={31} cy={32} r={2.5} fill={accent} /></>;
    case "fruit": return <><Path d="M17 25c0-6 4-9 7-6 3-3 7 0 7 6 0 7-4 11-7 11s-7-4-7-11Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M25 18c1-4 4-5 8-4-1 4-4 5-8 4Z" fill={accent} stroke={stroke} strokeWidth={2} /></>;
    case "vegetable": return <><Path d="M15 30c6-13 15-15 20-13-1 9-8 17-20 13Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M18 28c5-2 10-6 15-11" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "dairy": return <><Path d="M18 17h12l3 6v13H15V23l3-6Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 12h10l1 5H18l1-5Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M15 24h18" stroke={stroke} strokeWidth={2} /></>;
    case "grains": return <><Path d="M16 20h16l-2 16H18l-2-16Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M19 20c0-5 3-8 7-8 3 0 5 2 6 5" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={22} cy={27} r={1.5} fill={stroke} /><Circle cx={27} cy={31} r={1.5} fill={stroke} /></>;
    case "bakery": return <><Path d="M14 27c0-6 5-10 10-10s10 4 10 10v7H14v-7Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M20 22c2 2 2 5 0 8M28 22c-2 2-2 5 0 8" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "beverage": return <><Path d="M17 14h16l-3 23H20l-3-23Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 22h12l-1 9H20l-1-9Z" fill={fill} /><Path d="M26 14l5-5" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    case "frozen": return <><Path d="M24 13v22M15 18l18 12M33 18 15 30" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={24} cy={24} r={5} fill={fill} stroke={stroke} strokeWidth={2} /></>;
    case "deli": return <><Rect x={14} y={17} width={20} height={18} rx={4} fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M14 24h20M24 17v18" stroke={stroke} strokeWidth={2} /><Circle cx={19} cy={21} r={2} fill={accent} /><Circle cx={29} cy={30} r={2} fill={fill} /></>;
    case "canned": return <><Path d="M17 16c0-2 14-2 14 0v17c0 2-14 2-14 0V16Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M17 16c0 2 14 2 14 0M17 25c0 2 14 2 14 0" stroke={stroke} strokeWidth={2} /></>;
    case "cooking": return <><Path d="M24 13c5 6 8 10 8 15a8 8 0 0 1-16 0c0-5 3-9 8-15Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M24 21c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7Z" fill={C.white} /></>;
    case "baby": return <><Path d="M20 14h8l2 8v13H18V22l2-8Z" fill={C.white} stroke={stroke} strokeWidth={2} /><Path d="M19 23h10" stroke={stroke} strokeWidth={2} /><Circle cx={24} cy={30} r={3} fill={fill} stroke={stroke} strokeWidth={2} /></>;
    case "household": return <><Path d="M20 14h8l2 7v15H18V21l2-7Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M19 24h10M21 14v-3h6v3" stroke={stroke} strokeWidth={2} strokeLinecap="round" /><Circle cx={31} cy={31} r={3} fill={C.white} stroke={stroke} strokeWidth={2} /></>;
    case "personal": return <><Path d="M19 19h10l3 17H16l3-17Z" fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M21 19v-5h6v5M20 27h8" stroke={stroke} strokeWidth={2} strokeLinecap="round" /></>;
    default: return <><Rect x={14} y={15} width={20} height={20} rx={6} fill={fill} stroke={stroke} strokeWidth={2} /><Path d="M18 22h12M18 27h8M20 15l2-4h5l2 4" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></>;
  }
}
