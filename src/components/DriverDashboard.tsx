"use client";

import { useEffect, useState } from "react";
import type { TableColumn } from "@/components/DataTable";
import DashboardShipmentsTable from "./DashboardShipmentsTable";
import { getShipments, type Shipment } from "@/services/axios/shipments.service";
import { readSession } from "@/lib/session";
import styles from "./RoleDashboard.module.css";
import { formatDate } from "@/utils/utils";

const PAGE_SIZE = 10;

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

export default function DriverDashboard() {
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
      getShipments({ page, limit: PAGE_SIZE, keyword, driverId: readSession()?.id ?? "" })
        .then((result) => {
          if (!current) return;
          setShipments(result.data);
          setTotalPages(Math.max(result.totalPages, 1));
          setTotalItems(result.totalItems);
        }).catch(() => undefined).finally(() => { if (current) setIsLoading(false); });
    }, 0);
    return () => { current = false; window.clearTimeout(timeout); };
  }, [keyword, page]);

  const columns: TableColumn<Shipment>[] = [
    { key: "shipment", header: "Shipment", render: (shipment) => <><strong className={styles.cellTitle}>{shipment.trackingNumber}</strong><span className={styles.cellSubtitle}>{shipment.shipmentType}</span></> },
    { key: "recipient", header: "Recipient", render: (shipment) => <><strong className={styles.cellTitle}>{shipment.recipientName}</strong><span className={styles.cellSubtitle}>{shipment.recipientPhone}</span></> },
    { key: "delivery", header: "Delivery address", render: (shipment) => shipment.deliveryAddress },
    { key: "status", header: "Status", render: (shipment) => <span className={`${styles.status} ${statusClass(shipment.status)}`}>{shipment.status}</span> },
    { key: "created", header: "Created", render: (shipment) => formatDate(shipment.createdAt) },
  ];

  const assigned = shipments.filter((shipment) => shipment.status === "Assigned").length;
  const inTransit = shipments.filter((shipment) => shipment.status === "In Transit" || shipment.status === "Picked Up").length;
  const delivered = shipments.filter((shipment) => shipment.status === "Delivered").length;

  return (
    <section className={styles.dashboard}>
      <div className={styles.welcome}><p className={styles.kicker}>Driver operations</p><h2>Your delivery route at a glance.</h2><p>Review assigned shipments and keep delivery progress up to date.</p></div>
      <div className={styles.stats}>
        {[["Assigned", assigned, "Shipments waiting for pickup"], ["In progress", inTransit, "Picked up or in transit"], ["Delivered", delivered, "Completed deliveries"], ["Total assigned", totalItems, "Shipments assigned to you"]].map(([label, value, note]) => <article className={styles.card} key={label as string}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>)}
      </div>
      <div className={styles.shipments}><div className={styles.shipmentsHeader}><p className={styles.kicker}>Delivery queue</p><h3>Shipments assigned to you</h3></div><DashboardShipmentsTable columns={columns} emptyMessage="No shipments are currently assigned to you." isLoading={isLoading} onPageChange={setPage} onSearch={(value) => { setKeyword(value); setPage(1); }} page={page} searchPlaceholder="Search tracking number or recipient" searchValue={keyword} shipments={shipments} totalItems={totalItems} totalPages={totalPages} /></div>
    </section>
  );
}
