import type { MeetingStatus } from "@/src/features/meetings/api/meetings-api";
import { formatMeetingStatus } from "@/src/features/meetings/lib/format";

export function MeetingStatusBadge({ status }: { readonly status: MeetingStatus }) {
  const variant =
    status === "SCHEDULED"
      ? "inactive"
      : status === "COMPLETED"
        ? "active"
        : "blocked";
  return <span className={`status-badge status-badge--${variant}`}>{formatMeetingStatus(status)}</span>;
}
