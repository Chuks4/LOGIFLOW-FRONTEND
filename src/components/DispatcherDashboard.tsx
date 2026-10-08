"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { type TableColumn } from "@/components/DataTable";
import { readSession } from "@/lib/session";
import {
  getShipments,
  type Shipment,
  type ShipmentStatus,
  getDispatcherDashboardOverview,
} from "@/services/axios/shipments.service";
import { getVehicles } from "@/services/axios/vehicles.service";
import { formatDate } from "@/utils/utils";
import styles from "./OperationsDashboard.module.css";

const DASHBOARD_STATUSES: ShipmentStatus[] = [
  "Pending",
  "Confirmed",
  "Assigned",
  "Picked Up",
  "In Transit",
  "Delivered",
];

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

export default function DispatcherDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalAssigned, setTotalAssigned] = useState("0");
  const [pending, setPending] = useState("0");
  const [confirmed, setConfirmed] = useState("0");
  const [assigned, setAssigned] = useState("0");
  const [pickedUp, setPickedUp] = useState("0");
  const [inTransit, setInTransit] = useState("0");
  const [delivered, setDelivered] = useState("0");
  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dispatcherId = readSession()?.id;
    if (!dispatcherId) return;

    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [recent, overview, vehicles] = await Promise.all([
          getShipments({ page: 1, limit: 5, dispatcherId }),
          getDispatcherDashboardOverview(dispatcherId ?? ""),
          getVehicles({ page: 1, limit: 1, status: "Available" }),
        ]);

        setShipments(recent.data);
        setTotalAssigned(overview.assignedShipments);
        setPending(overview.pendingShipments);
        setConfirmed(overview.confirmedShipments);
        setAssigned(overview.assignedShipments);
        setPickedUp(overview.pickedUpShipments);
        setInTransit(overview.inTransit);
        setDelivered(overview.deliveredShipments);
        setAvailableVehicles(
          vehicles.data.filter((v) => v.status === "Available").length,
        );
      } catch {
        // The Axios interceptor displays the API error toast.
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const columns: TableColumn<Shipment>[] = [
    {
      key: "shipment",
      header: "Shipment",
      render: (shipment) => (
        <>
          <strong className={styles.cellTitle}>
            {shipment.trackingNumber}
          </strong>
          <span className={styles.cellSubtitle}>{shipment.shipmentType}</span>
        </>
      ),
    },
    {
      key: "recipient",
      header: "Recipient",
      render: (shipment) => shipment.recipientName,
    },
    {
      key: "status",
      header: "Status",
      render: (shipment) => (
        <span className={`${styles.status} ${statusClass(shipment.status)}`}>
          {shipment.status}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (shipment) => formatDate(shipment.createdAt),
    },
  ];

  return (
    <section className={styles.dashboard}>
      <div className={styles.welcome}>
        <p className={styles.kicker}>Dispatch operations</p>
        <h2>Keep every delivery moving.</h2>
        <p>Review your assigned queue and check the fleet ready to dispatch.</p>
      </div>
      <div className={styles.stats}>
        {[
          ["Your shipments", totalAssigned, "Assigned by you"],
          [
            "Ready to dispatch",
            parseInt(pending) + parseInt(confirmed),
            "Pending or confirmed",
          ],
          [
            "In progress",
            parseInt(assigned) + parseInt(pickedUp) + parseInt(inTransit),
            "On the delivery route",
          ],
          ["Delivered", delivered, "Completed by your team"],
          ["Available vehicles", availableVehicles, "Ready for assignment"],
        ].map(([label, value, note]) => (
          <article className={styles.card} key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{note}</span>
          </article>
        ))}
      </div>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Dispatch queue</p>
            <h3>Your recent shipments</h3>
          </div>
          <Link href="/dashboard/shipments">Manage shipments</Link>
        </div>
        <div className={styles.tableCard}>
          <DataTable
            columns={columns}
            data={shipments}
            emptyMessage="You have not assigned any shipments yet."
            getRowKey={(shipment) => shipment.id}
            isLoading={isLoading}
            loadingLabel="Loading dispatch queue..."
          />
        </div>
      </div>
    </section>
  );
}
