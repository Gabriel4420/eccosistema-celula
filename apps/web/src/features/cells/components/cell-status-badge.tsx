"use client";

import type { CellStatus } from "@/src/features/cells/api/cells-api";
import { formatCellStatus } from "@/src/features/cells/lib/format";
import { useI18n } from "@/src/shared/i18n/language-provider";
import { Badge } from "@/src/shared/ui";

export function CellStatusBadge({ status }: { readonly status: CellStatus }) {
  const { t } = useI18n();
  const variant =
    status === "ACTIVE"
      ? ("success" as const)
      : status === "FORMING"
        ? ("secondary" as const)
        : status === "SUSPENDED"
          ? ("warning" as const)
          : ("destructive" as const);
  return <Badge variant={variant}>{formatCellStatus(status, t)}</Badge>;
}