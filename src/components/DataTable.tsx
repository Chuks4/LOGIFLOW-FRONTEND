import { useState, type ReactNode } from "react";

import Loading from "./Loading";
import styles from "./DataTable.module.css";

export type TableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

export type TableAction<T> = {
  key: string;
  label: ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
};

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  actions?: TableAction<T>[];
  actionHeader?: ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingLabel?: string;
};

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  actions = [],
  actionHeader = "Actions",
  emptyMessage = "No results found.",
  isLoading = false,
  loadingLabel = "Loading...",
}: DataTableProps<T>) {
  const [openRowKey, setOpenRowKey] = useState<string | null>(null);
  const hasActions = actions.length > 0;

  return (
    <div className={styles.wrap}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.key}>
                {column.header}
              </th>
            ))}
            {hasActions && <th>{actionHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length + Number(hasActions)}>
                <Loading label={loadingLabel} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td className={styles.empty} colSpan={columns.length + Number(hasActions)}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={column.className} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
                {hasActions && (
                  <td className={styles.actions}>
                    <button
                      aria-expanded={openRowKey === getRowKey(row)}
                      aria-label={`Actions for row ${getRowKey(row)}`}
                      className={styles.actionButton}
                      onClick={() => {
                        const rowKey = getRowKey(row);
                        setOpenRowKey((currentRowKey) =>
                          currentRowKey === rowKey ? null : rowKey,
                        );
                      }}
                      type="button"
                    >
                      ...
                    </button>
                    {openRowKey === getRowKey(row) && (
                      <div className={styles.actionMenu}>
                        {actions
                          .filter((action) => !action.hidden?.(row))
                          .map((action) => (
                            <button
                              disabled={action.disabled?.(row)}
                              key={action.key}
                              onClick={() => {
                                setOpenRowKey(null);
                                action.onClick(row);
                              }}
                              type="button"
                            >
                              {action.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
