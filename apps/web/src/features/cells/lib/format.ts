import type {
  CellMeetingDay,
  CellStatus
} from "@/src/features/cells/api/cells-api";
import type { AppLocale, TranslationKey, TranslationParams } from "@/src/shared/i18n/dictionaries";

export const DAY_KEYS: Record<CellMeetingDay, TranslationKey> = {
  MONDAY: "cells.day.monday",
  TUESDAY: "cells.day.tuesday",
  WEDNESDAY: "cells.day.wednesday",
  THURSDAY: "cells.day.thursday",
  FRIDAY: "cells.day.friday",
  SATURDAY: "cells.day.saturday",
  SUNDAY: "cells.day.sunday"
};

export const STATUS_KEYS: Record<CellStatus, TranslationKey> = {
  FORMING: "cells.status.formative",
  ACTIVE: "cells.status.active",
  SUSPENDED: "cells.status.suspended",
  CLOSED: "cells.status.closed"
};

export function formatCellDay(
  day: CellMeetingDay,
  t: (key: TranslationKey, params?: TranslationParams) => string
): string {
  return t(DAY_KEYS[day]);
}

export function formatCellStatus(
  status: CellStatus,
  t: (key: TranslationKey, params?: TranslationParams) => string
): string {
  return t(STATUS_KEYS[status]);
}

export function formatCellTimestamp(iso: string, locale: AppLocale): string {
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