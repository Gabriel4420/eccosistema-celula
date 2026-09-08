import type { MeetingStatus } from "@/src/features/meetings/api/meetings-api";
import type { AppLocale, TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

export const STATUS_KEYS: Record<MeetingStatus, TranslationKey> = {
  SCHEDULED: "meetings.status.scheduled",
  COMPLETED: "meetings.status.completed",
  CANCELED: "meetings.status.cancelled"
};

export function formatMeetingStatus(
  status: MeetingStatus,
  t: (key: TranslationKey, params?: TranslationParams) => string
): string {
  return t(STATUS_KEYS[status]);
}

export function formatMeetingDate(isoDate: string, locale: AppLocale): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatMeetingTimestamp(iso: string, locale: AppLocale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
