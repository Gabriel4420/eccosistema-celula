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
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const info = labels?.info ?? defaultInfo;

  return (
    <nav className="pagination" aria-label="Paginação">
      <p className="pagination__info">{info(page, totalPages, totalItems, pageSize)}</p>
      <div className="pagination__controls">
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          {labels?.previous ?? "Anterior"}
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          {labels?.next ?? "Próxima"}
        </button>
      </div>
    </nav>
  );
}

function defaultInfo(
  page: number,
  totalPages: number,
  totalItems: number,
  pageSize: number
): string {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return `Página ${page} de ${Math.max(totalPages, 1)} · ${from}–${to} de ${totalItems}`;
}
