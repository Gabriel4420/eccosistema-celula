import type { CellStatus } from "@/src/features/cells/api/cells-api";
import { formatCellStatus } from "@/src/features/cells/lib/format";

export function CellStatusBadge({ status }: { readonly status: CellStatus }) {
  const variant =
    status === "ACTIVE"
      ? "active"
      : status === "FORMING"
        ? "inactive"
        : "blocked";
  return <span className={`status-badge status-badge--${variant}`}>{formatCellStatus(status)}</span>;
}
