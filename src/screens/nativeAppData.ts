import type { Region } from "react-native-maps";
import type { MarketPricePoint } from "../services/marketData";

export type NativeTabId = "home" | "watchlist" | "map" | "alerts" | "more";
export type HomeRoute = "catalog" | "detail";

type PriceChartPoint = {
  x: number;
  y: number;
  value: number;
  label: string;
  observed_at: string;
};

export type PriceChart = {
  points: PriceChartPoint[];
  polyline: string;
  width: number;
  height: number;
  min: number;
  max: number;
  start: number;
  end: number;
};

export type PreviousPriceRow = {
  key: string;
  label: string;
  price: number;
  diff: number;
};

export const TABS: Array<{ id: NativeTabId; label: string }> = [
  { id: "watchlist", label: "List" },
  { id: "map", label: "Map" },
  { id: "home", label: "Home" },
  { id: "alerts", label: "Alerts" },
  { id: "more", label: "More" },
];

export const DEFAULT_REGION: Region = {
  latitude: 49.2827,
  longitude: -123.1207,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function buildPriceChart(
  history: MarketPricePoint[],
  viewportWidth: number,
  horizontalPadding: number,
): PriceChart | null {
  if (history.length === 0) return null;

  const source = history.slice(-7);
  const values = source.map((point) => point.price);
  const width = Math.max(240, Math.min(360, viewportWidth - horizontalPadding * 2 - 28));
  const height = 160;
  const padding = 14;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = source.map((point, index) => {
    const x =
      source.length === 1
        ? width / 2
        : padding + (index / (source.length - 1)) * usableW;
    const y = padding + ((max - point.price) / range) * usableH;
    return {
      x,
      y,
      value: point.price,
      label: shortWeekday(point.observed_at),
      observed_at: point.observed_at,
    };
  });

  return {
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
    width,
    height,
    min,
    max,
    start: values[0],
    end: values[values.length - 1],
  };
}

export function buildPreviousPriceRows(chart: PriceChart | null): PreviousPriceRow[] {
  if (!chart || chart.points.length <= 1) return [];

  return chart.points
    .slice(0, -1)
    .map((point, index) => {
      const next = chart.points[index + 1];
      const diff = next.value - point.value;
      return {
        key: `${point.observed_at}-${index}`,
        label: point.label,
        price: point.value,
        diff,
      };
    })
    .reverse();
}

function shortWeekday(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}
