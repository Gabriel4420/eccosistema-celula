import type { ReactNode, TableHTMLAttributes } from "react";

interface TableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: T) => ReactNode;
  readonly className?: string;
  readonly mobileLabel?: string;
}

interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  readonly columns: ReadonlyArray<TableColumn<T>>;
  readonly rows: readonly T[];
  readonly rowKey: (row: T) => string;
}

export function Table<T>({ columns, rows, rowKey, className, ...props }: TableProps<T>) {
  return (
    <div className="table-container">
      <table className={`table ${className ?? ""}`} {...props}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.mobileLabel ?? column.header}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
