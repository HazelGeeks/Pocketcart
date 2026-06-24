export function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return value > 0 ? "+∞%" : value < 0 ? "-∞%" : "0.00%";
  }

  if (Object.is(value, -0)) {
    return "-0.00%";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
