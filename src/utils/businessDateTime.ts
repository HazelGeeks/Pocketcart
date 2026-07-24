export const BUSINESS_TIME_ZONE = "America/Vancouver";

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

function datePartsInTimeZone(
  date: Date,
  timeZone: string,
): Omit<LocalDateTimeParts, "millisecond"> {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const values = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get("year") ?? 0,
    month: values.get("month") ?? 0,
    day: values.get("day") ?? 0,
    hour: values.get("hour") ?? 0,
    minute: values.get("minute") ?? 0,
    second: values.get("second") ?? 0,
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = datePartsInTimeZone(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function localDateTimeToUtc(
  parts: LocalDateTimeParts,
  timeZone = BUSINESS_TIME_ZONE,
): Date | null {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
  if (!Number.isFinite(localAsUtc)) return null;

  let utcMs = localAsUtc - timeZoneOffsetMs(new Date(localAsUtc), timeZone);
  utcMs = localAsUtc - timeZoneOffsetMs(new Date(utcMs), timeZone);
  const date = new Date(utcMs);
  const actual = datePartsInTimeZone(date, timeZone);
  if (
    actual.year !== parts.year ||
    actual.month !== parts.month ||
    actual.day !== parts.day ||
    actual.hour !== parts.hour ||
    actual.minute !== parts.minute ||
    actual.second !== parts.second
  ) {
    return null;
  }
  return date;
}

export function localDatePartsToIso(params: {
  year: number;
  month: number;
  day: number;
  endOfDay: boolean;
  timeZone?: string;
}): string | null {
  const validationDate = new Date(Date.UTC(params.year, params.month - 1, params.day));
  if (
    validationDate.getUTCFullYear() !== params.year ||
    validationDate.getUTCMonth() !== params.month - 1 ||
    validationDate.getUTCDate() !== params.day
  ) {
    return null;
  }

  const date = localDateTimeToUtc(
    {
      year: params.year,
      month: params.month,
      day: params.day,
      hour: params.endOfDay ? 23 : 0,
      minute: params.endOfDay ? 59 : 0,
      second: params.endOfDay ? 59 : 0,
      millisecond: params.endOfDay ? 999 : 0,
    },
    params.timeZone,
  );
  return date?.toISOString() ?? null;
}

export function formatBusinessDate(
  value: string | null | undefined,
  timeZone = BUSINESS_TIME_ZONE,
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = datePartsInTimeZone(date, timeZone);
  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0"),
  ].join("-");
}
