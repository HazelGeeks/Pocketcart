import type { Region } from "react-native-maps";
import type { MarketPeriodStorePrice, MarketPricePoint } from "../services/marketData";
import { BUSINESS_TIME_ZONE } from "../utils/businessDateTime";

export type NativeTabId =
  | "home"
  | "shopping"
  | "freezer"
  | "receipts"
  | "map"
  | "scan"
  | "alerts"
  | "more";
export type HomeRoute = "catalog" | "detail";

type PriceChartPoint = {
  id: string;
  x: number;
  y: number;
  value: number;
  label: string;
  observed_at: string;
  sale_end_at: string | null;
  store_id: string | null;
  store_name: string;
  store_area: string | null;
  store_prices: MarketPeriodStorePrice[];
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
  plot: { left: number; right: number; top: number; bottom: number };
  ticks: Array<{ value: number; y: number }>;
};

export type PreviousPriceRow = {
  key: string;
  label: string;
  price: number;
  diff: number;
};

export const TABS: Array<{ id: NativeTabId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "shopping", label: "Cart" },
  { id: "freezer", label: "Freezer" },
  { id: "more", label: "Account" },
];

export const DEFAULT_REGION: Region = {
  latitude: 49.2827,
  longitude: -123.1207,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
};

export const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
});

export function buildPriceChart(
  history: MarketPricePoint[],
  viewportWidth: number,
  horizontalPadding: number,
): PriceChart | null {
  if (history.length === 0) return null;

  const source = [...history]
    .sort((a, b) => saleSessionChartTime(a) - saleSessionChartTime(b) || a.id.localeCompare(b.id))
    .slice(-7);
  const values = source.map((point) => point.price);
  const width = Math.max(240, Math.min(360, viewportWidth - horizontalPadding * 2 - 28));
  const height = 200;
  const plot = { left: 52, right: width - 14, top: 18, bottom: height - 30 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domainPadding = Math.max((max - min) * 0.15, 0.25);
  const domainMin = Math.max(0, min - domainPadding);
  const domainMax = max + domainPadding;
  const priceY = (value: number) =>
    max === min
      ? (plot.top + plot.bottom) / 2
      : plot.top + ((domainMax - value) / (domainMax - domainMin)) * (plot.bottom - plot.top);
  const usableW = plot.right - plot.left;
  const times = source.map(saleSessionChartTime);
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  const timeRange = lastTime - firstTime;

  const points = source.map((point, index) => {
    const x =
      source.length === 1
        ? (plot.left + plot.right) / 2
        : timeRange > 0 && Number.isFinite(times[index])
          ? plot.left + ((times[index] - firstTime) / timeRange) * usableW
          : plot.left + (index / (source.length - 1)) * usableW;
    const y = priceY(point.price);
    return {
      id: point.id,
      x,
      y,
      value: point.price,
      label: salePeriodLabel(point.observed_at, point.sale_end_at),
      observed_at: point.observed_at,
      sale_end_at: point.sale_end_at,
      store_id: point.store_id,
      store_name: point.store_name,
      store_area: point.store_area,
      store_prices: point.store_prices,
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
    plot,
    ticks: (max === min ? [min] : [domainMax, (domainMin + domainMax) / 2, domainMin]).map(
      (value) => ({
        value,
        y: priceY(value),
      }),
    ),
  };
}

/** Fit the existing time scale to the measured component, including narrow screens. */
export function fitPriceChart(chart: PriceChart, width: number): PriceChart {
  const fittedWidth = Math.max(120, width);
  const plot = { ...chart.plot, right: fittedWidth - 14 };
  const points = chart.points.map((point) => ({
    ...point,
    x:
      plot.left +
      ((point.x - chart.plot.left) / (chart.plot.right - chart.plot.left)) *
        (plot.right - plot.left),
  }));
  return {
    ...chart,
    width: fittedWidth,
    plot,
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
  };
}

export function nearestPriceChartPoint(chart: PriceChart, x: number): number {
  let nearest = 0;
  chart.points.forEach((point, index) => {
    if (Math.abs(point.x - x) < Math.abs(chart.points[nearest].x - x)) nearest = index;
  });
  return nearest;
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

function dateTime(dateLike: string): number {
  const time = new Date(dateLike).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function saleSessionChartTime(
  point: Pick<MarketPricePoint, "observed_at" | "sale_end_at">,
): number {
  const start = dateTime(point.observed_at);
  const end = point.sale_end_at ? dateTime(point.sale_end_at) : start;
  if (!Number.isFinite(start)) return start;
  return Number.isFinite(end) && end >= start ? start + (end - start) / 2 : start;
}

function shortDate(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  });
}

function salePeriodLabel(startLike: string, endLike: string | null): string {
  const start = shortDate(startLike);
  if (!endLike) return start;

  const end = shortDate(endLike);
  return end === "-" || end === start ? start : `${start}–${end}`;
}
