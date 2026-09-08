"use client";

import { useI18n } from "@/src/shared/i18n/language-provider";

interface PaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly labels?: { previous: string; next: string; info: (page: number, totalPages: number, totalItems: number) => string };
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  labels
}: PaginationProps) {
  const { t } = useI18n();
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const info = labels?.info ?? ((current, total, items) =>
    t("pagination.info", { page: current, totalPages: Math.max(total, 1), from: items === 0 ? 0 : (current - 1) * pageSize + 1, to: Math.min(current * pageSize, items), totalItems: items }));

  return (
    <nav className="pagination" aria-label={t("pagination.aria")}>
      <p className="pagination__info">{info(page, totalPages, totalItems)}</p>
      <div className="pagination__controls">
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          {labels?.previous ?? t("pagination.prev")}
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          {labels?.next ?? t("pagination.next")}
        </button>
      </div>
    </nav>
  );
}