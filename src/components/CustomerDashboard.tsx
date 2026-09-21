"use client";

import { useEffect, useState } from "react";
import DashboardShipmentsTable from "./DashboardShipmentsTable";
import { getOverviewAnalytics, type OverviewMetrics } from "@/services/axios/analytics.service";
import { getShipments, type Shipment } from "@/services/axios/shipments.service";
import { readSession } from "@/lib/session";
import type { TableColumn } from "@/components/DataTable";
import styles from "./RoleDashboard.module.css";
import { formatDate } from "@/utils/utils";

const PAGE_SIZE = 10;

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

export default function CustomerDashboard() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let current = true;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      Promise.all([
        getOverviewAnalytics(),
        getShipments({ page, limit: PAGE_SIZE, keyword, customerId: readSession()?.id ?? "" }),
      ]).then(([overview, result]) => {
        if (!current) return;
        setMetrics(overview.metrics);
        setShipments(result.data);
        setTotalPages(Math.max(result.totalPages, 1));
        setTotalItems(result.totalItems);
      }).catch(() => undefined).finally(() => {
        if (current) setIsLoading(false);
      });
    }, 0);
    return () => { current = false; window.clearTimeout(timeout); };
  }, [keyword, page]);

  const columns: TableColumn<Shipment>[] = [
    { key: "shipment", header: "Shipment", render: (shipment) => <><strong className={styles.cellTitle}>{shipment.trackingNumber}</strong><span className={styles.cellSubtitle}>{shipment.shipmentType}</span></> },
    { key: "recipient", header: "Recipient", render: (shipment) => <><strong className={styles.cellTitle}>{shipment.recipientName}</strong><span className={styles.cellSubtitle}>{shipment.recipientPhone}</span></> },
    { key: "cost", header: "Estimated Cost", render: (shipment) => `₦ ${Number(shipment.estimatedCost).toLocaleString()}` },
    { key: "status", header: "Status", render: (shipment) => <span className={`${styles.status} ${statusClass(shipment.status)}`}>{shipment.status}</span> },
    { key: "created", header: "Created", render: (shipment) => formatDate(shipment.createdAt) },
  ];

  return (
    <section className={styles.dashboard}>
      <div className={styles.welcome}><p className={styles.kicker}>Customer overview</p><h2>Your operations at a glance.</h2><p>Track shipments you have created and their delivery progress.</p></div>
      <div className={styles.stats}>
        {[
          ["Total shipments", metrics?.totalShipments, "All shipments created by you"],
          ["Active shipments", metrics?.activeShipments, "Currently being processed"],
          ["In transit", metrics?.inTransit, "Currently on the way"],
          ["Delivered this month", metrics?.deliveredThisMonth, "Completed this month"],
        ].map(([label, value, note]) => <article className={styles.card} key={label as string}><p>{label}</p><strong>{value ?? "—"}</strong><span>{note}</span></article>)}
      </div>
      <div className={styles.shipments}><div className={styles.shipmentsHeader}><p className={styles.kicker}>Shipment history</p><h3>All your shipments</h3></div><DashboardShipmentsTable columns={columns} emptyMessage="You have not created any shipments yet." isLoading={isLoading} onPageChange={setPage} onSearch={(value) => { setKeyword(value); setPage(1); }} page={page} searchPlaceholder="Search by tracking number or recipient" searchValue={keyword} shipments={shipments} totalItems={totalItems} totalPages={totalPages} /></div>
    </section>
  );
}
