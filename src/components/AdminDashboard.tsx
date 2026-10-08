"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { type TableColumn } from "@/components/DataTable";
import {
  getShipments,
  type Shipment,
  type ShipmentStatus,
  getAdminDashboardOverview,
} from "@/services/axios/shipments.service";
import {
  getVehicles,
  type Vehicle,
  type VehicleStatus,
} from "@/services/axios/vehicles.service";
import { formatDate } from "@/utils/utils";
import styles from "./OperationsDashboard.module.css";
import Pagination from "@/components/Pagination";

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

function vehicleStatusClass(status: string) {
  return (
    styles[`vehicleStatus${status.replace(/\s/g, "")}`] ?? styles.statusDefault
  );
}

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalShipments, setTotalShipments] = useState(0);
  const [pending, setPending] = useState("0");
  const [confirmed, setConfirmed] = useState("0");
  const [assigned, setAssigned] = useState("0");
  const [pickedUp, setPickedUp] = useState("0");
  const [inTransit, setInTransit] = useState("0");
  const [delivered, setDelivered] = useState("0");
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [shipmentTotalPages, setShipmentTotalPages] = useState(1);
  const [shipmentCurrentPage, setShipmentCurrentPage] = useState(1);
  const [vehicleTotalPages, setVehicleTotalPages] = useState(1);
  const [vehicleCurrentPage, setVehicleCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const PAGE_SIZE = 10;

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [recent, vehicles, overview] = await Promise.all([
          getShipments({ page: shipmentCurrentPage, limit: PAGE_SIZE }),
          getVehicles({ page: vehicleCurrentPage, limit: PAGE_SIZE }),
          getAdminDashboardOverview(),
        ]);

        setShipments(recent.data);
        setShipmentTotalPages(recent.totalPages);
        setTotalShipments(recent.totalItems);
        setPending(overview.pendingShipments);
        setConfirmed(overview.confirmedShipments);
        setAssigned(overview.assignedShipments);
        setPickedUp(overview.pickedUpShipments);
        setInTransit(overview.inTransit);
        setDelivered(overview.deliveredShipments);
        setTotalVehicles(vehicles.totalItems);
        setVehicleTotalPages(vehicles.totalPages);
        setVehicles(vehicles.data);

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

  const vehicleColumns: TableColumn<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Plate Number",
      render: (vehicle) => (
        <>
          <strong className={styles.cellTitle}>{vehicle.plateNumber}</strong>
          <span className={styles.cellSubtitle}>
            {vehicle.model} - {vehicle.year}
          </span>
        </>
      ),
    },
    {
      key: "driver",
      header: "Driver",
      render: (vehicle) =>
        vehicle.driver?.firstName && vehicle.driver?.lastName
          ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}`
          : "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (vehicle) => (
        <span
          className={`${styles.status} ${vehicleStatusClass(vehicle.status)}`}
        >
          {vehicle.status}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (vehicle) => formatDate(vehicle.createdAt),
    },
  ];

  return (
    <section className={styles.dashboard}>
      <div className={styles.welcome}>
        <p className={styles.kicker}>Administration</p>
        <h2>Logistics at a glance.</h2>
        <p>
          Monitor fleet capacity and shipment activity across your operation.
        </p>
      </div>
      <div className={styles.stats}>
        {[
          ["Total shipments", totalShipments, "All shipments in the system"],
          [
            "Awaiting dispatch",
            parseInt(pending) + parseInt(confirmed),
            "Pending or confirmed",
          ],
          [
            "On the road",
            parseInt(assigned) + parseInt(pickedUp) + parseInt(inTransit),
            "Assigned or in transit",
          ],
          ["Delivered", delivered, "Completed shipments"],
          ["Fleet vehicles", totalVehicles, "Registered vehicles"],
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
            <p className={styles.kicker}>Latest activities</p>
            <h3>Recent shipments</h3>
          </div>
          <Link href="/dashboard/shipments">View shipments</Link>
        </div>
        <div className={styles.tableCard}>
          <DataTable
            columns={columns}
            data={shipments}
            emptyMessage="No shipments have been created yet."
            getRowKey={(shipment) => shipment.id}
            isLoading={isLoading}
            loadingLabel="Loading operations..."
          />

          <Pagination
            currentPage={shipmentCurrentPage}
            onPageChange={setShipmentCurrentPage}
            totalPages={shipmentTotalPages}
          />
        </div>

        {/* Vehicle Section */}
        <div className={styles.sectionHeader}>
          <div>
            <h3>Vehicles</h3>
          </div>
          <Link href="/dashboard/vehicles">View vehicles</Link>
        </div>
        <div className={styles.tableCard}>
          <DataTable
            columns={vehicleColumns}
            data={vehicles}
            emptyMessage="No vehicles have been registered yet."
            getRowKey={(vehicle) => vehicle.id}
            isLoading={isLoading}
            loadingLabel="Loading fleet data..."
          />

          <Pagination
            currentPage={vehicleCurrentPage}
            onPageChange={setVehicleCurrentPage}
            totalPages={vehicleTotalPages}
          />
        </div>
      </div>
    </section>
  );
}
