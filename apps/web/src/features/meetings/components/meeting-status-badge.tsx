"use client";

import type { MeetingStatus } from "@/src/features/meetings/api/meetings-api";
import { formatMeetingStatus } from "@/src/features/meetings/lib/format";
import { useI18n } from "@/src/shared/i18n/language-provider";

export function MeetingStatusBadge({ status }: { readonly status: MeetingStatus }) {
  const { t } = useI18n();
  const variant =
    status === "SCHEDULED"
      ? "inactive"
      : status === "COMPLETED"
        ? "active"
        : "blocked";
  return <span className={`status-badge status-badge--${variant}`}>{formatMeetingStatus(status, t)}</span>;
}