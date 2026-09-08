"use client";

import type { CellStatus } from "@/src/features/cells/api/cells-api";
import { formatCellStatus } from "@/src/features/cells/lib/format";
import { useI18n } from "@/src/shared/i18n/language-provider";

export function CellStatusBadge({ status }: { readonly status: CellStatus }) {
  const { t } = useI18n();
  const variant =
    status === "ACTIVE"
      ? "active"
      : status === "FORMING"
        ? "inactive"
        : "blocked";
  return <span className={`status-badge status-badge--${variant}`}>{formatCellStatus(status, t)}</span>;
}
