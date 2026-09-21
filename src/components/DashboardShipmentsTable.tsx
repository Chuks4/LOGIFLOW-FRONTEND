"use client";

import DataTable, { type TableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import type { Shipment } from "@/services/axios/shipments.service";
import styles from "./DashboardShipmentsTable.module.css";

type DashboardShipmentsTableProps = {
  shipments: Shipment[];
  columns: TableColumn<Shipment>[];
  page: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSearch: (value: string) => void;
  searchValue: string;
  searchPlaceholder: string;
  emptyMessage: string;
};

export default function DashboardShipmentsTable({
  shipments,
  columns,
  page,
  totalPages,
  totalItems,
  isLoading,
  onPageChange,
  onSearch,
  searchValue,
  searchPlaceholder,
  emptyMessage,
}: DashboardShipmentsTableProps) {
  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search shipments</span>
          <input
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
          />
        </label>
        <span className={styles.total}>{totalItems} shipment(s)</span>
      </div>
      <div className={styles.tableCard}>
        <DataTable
          columns={columns}
          data={shipments}
          emptyMessage={emptyMessage}
          getRowKey={(shipment) => shipment.id}
          isLoading={isLoading}
          loadingLabel="Loading shipments..."
        />
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
