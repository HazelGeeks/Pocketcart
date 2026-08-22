import Bell from "lucide-react-native/icons/bell";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Heart from "lucide-react-native/icons/heart";
import List from "lucide-react-native/icons/list";
import MapIcon from "lucide-react-native/icons/map";
import MapPin from "lucide-react-native/icons/map-pin";
import Menu from "lucide-react-native/icons/menu";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import ShoppingBasket from "lucide-react-native/icons/shopping-basket";
import SlidersHorizontal from "lucide-react-native/icons/sliders-horizontal";
import Sparkles from "lucide-react-native/icons/sparkles";
import AlertTriangle from "lucide-react-native/icons/triangle-alert";
import X from "lucide-react-native/icons/x";

export type AppIconName =
  | "alert"
  | "basket"
  | "bell"
  | "check"
  | "chevron-right"
  | "close"
  | "filter"
  | "heart"
  | "list"
  | "location"
  | "map"
  | "menu"
  | "retake"
  | "sparkles";

const ICONS = {
  alert: AlertTriangle,
  basket: ShoppingBasket,
  bell: Bell,
  check: Check,
  "chevron-right": ChevronRight,
  close: X,
  filter: SlidersHorizontal,
  heart: Heart,
  list: List,
  location: MapPin,
  map: MapIcon,
  menu: Menu,
  retake: RotateCcw,
  sparkles: Sparkles,
} as const;

export function AppIcon({
  name,
  color,
  size = 24,
  strokeWidth = 2,
}: {
  name: AppIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name];
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}
