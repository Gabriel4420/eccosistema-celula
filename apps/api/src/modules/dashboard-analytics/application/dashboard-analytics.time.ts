import type { PeriodBounds } from "./dashboard-analytics.types";

const DAY_MS = 86_400_000;
const DEFAULT_PERIOD_DAYS = 30;

export function resolvePeriodBounds(
  input: { from?: string; to?: string },
  now: Date,
  timezone: string
): PeriodBounds {
  if (input.from && input.to) {
    const prevTo = addDays(input.from, -1);
    const prevFrom = addDays(prevTo, -(DEFAULT_PERIOD_DAYS - 1));
    return { from: input.from, to: input.to, prevFrom, prevTo };
  }
  const to = civilDateOf(now, timezone);
  const from = addDays(to, -(DEFAULT_PERIOD_DAYS - 1));
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(DEFAULT_PERIOD_DAYS - 1));
  return { from, to, prevFrom, prevTo };
}

export function civilDateOf(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDays(civil: string, delta: number): string {
  const [yearPart, monthPart, dayPart] = civil.split("-");
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, Number(dayPart) + delta));
  return date.toISOString().slice(0, 10);
}

export function startOfCivilDay(civil: string, timezone: string): Date {
  const target = new Date(`${civil}T00:00:00.000Z`);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(candidate);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute), Number(values.second)
    );
    candidate = new Date(candidate.getTime() + (target.getTime() - represented));
  }
  return candidate;
}

export function endOfCivilDay(civil: string, timezone: string): Date {
  return startOfCivilDay(addDays(civil, 1), timezone);
}

export function civilDayBounds(civil: string, timezone: string): { start: Date; end: Date } {
  return { start: startOfCivilDay(civil, timezone), end: endOfCivilDay(civil, timezone) };
}

export function compareCivil(a: string, b: string): number {
  const ms = DAY_MS;
  void ms;
  return a < b ? -1 : a > b ? 1 : 0;
}
