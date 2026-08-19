import React from "react";
import AlertTriangle from "lucide-react-native/icons/triangle-alert";
import Bell from "lucide-react-native/icons/bell";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Heart from "lucide-react-native/icons/heart";
import List from "lucide-react-native/icons/list";
import Map from "lucide-react-native/icons/map";
import MapPin from "lucide-react-native/icons/map-pin";
import ShoppingBasket from "lucide-react-native/icons/shopping-basket";
import X from "lucide-react-native/icons/x";

export type AppIconName =
  | "alert"
  | "basket"
  | "bell"
  | "check"
  | "chevron-right"
  | "close"
  | "heart"
  | "list"
  | "location"
  | "map";

const ICONS = {
  alert: AlertTriangle,
  basket: ShoppingBasket,
  bell: Bell,
  check: Check,
  "chevron-right": ChevronRight,
  close: X,
  heart: Heart,
  list: List,
  location: MapPin,
  map: Map,
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
