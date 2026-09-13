export function shiftCalendarMonth(value: string, delta: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
export function calendarDays(value: string): Array<string | null> {
  const [year, month] = value.split("-").map(Number);
  const first = new Date(year, month - 1, 1, 12).getDay();
  const count = new Date(year, month, 0, 12).getDate();
  return [...Array<null>(first).fill(null), ...Array.from({ length: count }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)];
}
