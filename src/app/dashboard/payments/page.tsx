"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import {
  getUserPayment,
  getUserPayments,
  type Payment,
} from "@/services/axios/payments.service";
import styles from "./payments.module.css";
import { formatDate } from "../../../utils/utils";

const PAGE_SIZE = 10;

function statusClass(status: string) {
  return (
    styles[`status${status.charAt(0).toUpperCase()}${status.slice(1)}`] ??
    styles.statusDefault
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<Payment["status"] | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUserPayments({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        status: status || undefined,
      });
      setPayments(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPayments]);

  async function viewPayment(payment: Payment) {
    try {
      setSelectedPayment(await getUserPayment(payment.id));
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  const columns: TableColumn<Payment>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (payment) => (
        <strong className={styles.cellTitle}>{payment.reference}</strong>
      ),
    },
    {
      key: "shipment",
      header: "Shipment",
      render: (payment) => payment.shipment || "—",
    },
    {
      key: "amount",
      header: "Amount",
      render: (payment) => `₦ ${Number(payment.amount).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (payment) => (
        <span className={`${styles.status} ${statusClass(payment.status)}`}>
          {payment.status}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Date",
      render: (payment) => formatDate(payment.timestamp),
    },
  ];

  const actions: TableAction<Payment>[] = [
    {
      key: "view",
      label: "View details",
      onClick: (payment) => void viewPayment(payment),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Billing</p>
          <h2>Payments</h2>
          <p>Review your payment history and transaction details.</p>
        </div>
        <span className={styles.total}>{totalItems} payments</span>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search payments</span>
          <input
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="Search by payment reference"
            type="search"
            value={keyword}
          />
        </label>
        <label className={styles.filter}>
          <span className={styles.srOnly}>Filter payments by status</span>
          <select
            aria-label="Filter payments by status"
            onChange={(event) => {
              setStatus(event.target.value as Payment["status"] | "");
              setPage(1);
            }}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
      </div>

      <div className={styles.tableCard}>
        <DataTable
          actions={actions}
          columns={columns}
          data={payments}
          emptyMessage="You have not made any payment yet."
          getRowKey={(payment) => payment.id}
          isLoading={isLoading}
          loadingLabel="Loading payments..."
        />
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
        />
      </div>

      {selectedPayment && (
        <PaymentDetails
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </section>
  );
}

function PaymentDetails({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        aria-label="Payment details"
        className={styles.drawer}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.kicker}>Payment details</p>
            <h3>{payment.reference}</h3>
          </div>
          <button
            aria-label="Close details"
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
        <div className={styles.detailGrid}>
          <div>
            <span>Status</span>
            <strong
              className={`${styles.status} ${statusClass(payment.status)}`}
            >
              {payment.status}
            </strong>
          </div>
          <div>
            <span>Amount</span>
            <strong>₦ {Number(payment.amount).toLocaleString()}</strong>
          </div>
          <div>
            <span>Shipment</span>
            <strong>{payment.shipment || "—"}</strong>
          </div>
          <div>
            <span>Payment method</span>
            <strong>{payment.paymentMethod || "—"}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{formatDate(payment.timestamp)}</strong>
          </div>
        </div>
      </aside>
    </div>
  );
}
