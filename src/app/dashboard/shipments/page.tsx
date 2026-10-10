"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import DashboardShipmentsTable from "@/components/DashboardShipmentsTable";
import DriverLocationShare from "@/components/DriverLocationShare";
import Pagination from "@/components/Pagination";
import { can } from "@/lib/rbac";
import { readSession } from "@/lib/session";
import { getDrivers, type DriverOption } from "@/services/axios/users.service";
import {
  assignShipmentDriver,
  getShipment,
  getShipments,
  updateShipmentStatus,
  type Shipment,
  type ShipmentHistory,
} from "@/services/axios/shipments.service";
import styles from "./shipments.module.css";
import { formatDate } from "../../../utils/utils";
import toast from "react-hot-toast";

const LiveTracking = dynamic(() => import("@/components/LiveTracking"), {
  ssr: false,
});

const PAGE_SIZE = 10;

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [trackingShipment, setTrackingShipment] = useState<Shipment | null>(
    null,
  );
  const [sharingShipment, setSharingShipment] = useState<Shipment | null>(null);
  const [assignmentShipment, setAssignmentShipment] = useState<Shipment | null>(
    null,
  );
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driverId, setDriverId] = useState("");
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const session = readSession();
  const canCreate = can(session?.permissions ?? [], "shipments", "create");
  const canAssignDriver = can(
    session?.permissions ?? [],
    "shipments",
    "assign",
  );
  const isDriver = session?.userType === process.env.NEXT_PUBLIC_DRIVER_ROLE;
  const isAdmin = session?.userType === process.env.NEXT_PUBLIC_ADMIN_ROLE;

  const loadShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getShipments({
        page,
        limit: PAGE_SIZE,
        keyword,
        ...(isAdmin
          ? {}
          : isDriver
            ? { driverId: session?.id ?? "" }
            : { customerId: session?.id ?? "" }),
      });
      setShipments(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isDriver, keyword, page, session?.id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadShipments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadShipments]);

  async function viewShipment(id: string) {
    try {
      setSelectedShipment(await getShipment(id));
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  async function openDriverAssignment(shipment: Shipment) {
    setAssignmentShipment(shipment);
    setDriverId("");
    setDrivers([]);
    setIsLoadingDrivers(true);
    try {
      setDrivers(await getDrivers());
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoadingDrivers(false);
    }
  }

  async function submitDriverAssignment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentShipment || !driverId || isAssigningDriver) return;

    setIsAssigningDriver(true);
    try {
      await assignShipmentDriver(assignmentShipment.id, driverId);
      toast.success("Driver assigned to shipment.");
      setAssignmentShipment(null);
      await loadShipments();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsAssigningDriver(false);
    }
  }

  function search(value: string) {
    setKeyword(value);
    setPage(1);
  }

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
      render: (shipment) => (
        <>
          <strong className={styles.cellTitle}>{shipment.recipientName}</strong>
          <span className={styles.cellSubtitle}>{shipment.recipientPhone}</span>
        </>
      ),
    },
    {
      key: "estimated cost",
      header: "Estimated Cost",
      render: (shipment) => (
        <>
          <p className={styles.route}>
            ₦ {Number(shipment.estimatedCost).toLocaleString()}
          </p>
        </>
      ),
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

  const actions: TableAction<Shipment>[] = [
    {
      key: "view",
      label: "View details",
      onClick: (shipment) => void viewShipment(shipment.id),
    },
    {
      key: "assign-driver",
      label: "Assign driver",
      hidden: () => !canAssignDriver || !isAdmin,
      disabled: (shipment) =>
        isAdmin &&
        ["Pending", "Delivered", "In Transit"].includes(shipment.status),

      onClick: (shipment) => void openDriverAssignment(shipment),
    },
    {
      key: "share-location",
      label: "Share my location",
      hidden: () => !isDriver,
      onClick: (shipment) => setSharingShipment(shipment),
      disabled: (shipment) =>
        isDriver &&
        !["Assigned", "Picked Up", "In Transit"].includes(shipment.status),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Operations</p>
          <h2>Shipments</h2>
          <p>
            {isDriver
              ? "Review shipments assigned to you and keep deliveries moving."
              : "Track and manage every delivery in your dashboard."}
          </p>
        </div>
        {canCreate && (
          <Link
            className={styles.createButton}
            href="/dashboard/shipments/create"
          >
            <span aria-hidden="true">+</span> Create shipment
          </Link>
        )}
      </div>

      {isDriver ? (
        <DashboardShipmentsTable
          actions={actions}
          columns={columns}
          emptyMessage="No shipments are currently assigned to you."
          isLoading={isLoading}
          onPageChange={setPage}
          onSearch={search}
          page={page}
          searchPlaceholder="Search tracking number or recipient"
          searchValue={keyword}
          shipments={shipments}
          totalItems={totalItems}
          totalPages={totalPages}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span className={styles.srOnly}>Search shipments</span>
              <input
                onChange={(event) => search(event.target.value)}
                placeholder="Search by tracking number or recipient"
                type="search"
                value={keyword}
              />
            </label>
            <span className={styles.total}>{totalItems} shipments</span>
          </div>

          <div className={styles.tableCard}>
            <DataTable
              columns={columns}
              data={shipments}
              emptyMessage="You have not created any shipments yet."
              getRowKey={(shipment) => shipment.id}
              actions={actions}
              isLoading={isLoading}
              loadingLabel="Loading shipments..."
            />
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              totalPages={totalPages}
            />
          </div>
        </>
      )}

      {selectedShipment && (
        <ShipmentDetails
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onTrack={() => setTrackingShipment(selectedShipment)}
          isDriver={isDriver}
        />
      )}
      {trackingShipment && (
        <LiveTracking
          onClose={() => setTrackingShipment(null)}
          shipmentId={trackingShipment.id}
          trackingNumber={trackingShipment.trackingNumber}
        />
      )}
      {sharingShipment && (
        <DriverLocationShare
          onClose={() => setSharingShipment(null)}
          shipmentId={sharingShipment.id}
          trackingNumber={sharingShipment.trackingNumber}
        />
      )}
      {assignmentShipment && (
        <DriverAssignmentModal
          drivers={drivers}
          isLoadingDrivers={isLoadingDrivers}
          isSaving={isAssigningDriver}
          onClose={() => {
            if (!isAssigningDriver) setAssignmentShipment(null);
          }}
          onDriverChange={setDriverId}
          onSubmit={submitDriverAssignment}
          shipment={assignmentShipment}
          driverId={driverId}
        />
      )}
    </section>
  );
}

function DriverAssignmentModal({
  shipment,
  drivers,
  driverId,
  isLoadingDrivers,
  isSaving,
  onClose,
  onDriverChange,
  onSubmit,
}: {
  shipment: Shipment;
  drivers: DriverOption[];
  driverId: string;
  isLoadingDrivers: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDriverChange: (driverId: string) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <section
        aria-labelledby="assign-driver-title"
        aria-modal="true"
        className={styles.assignmentModal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.kicker}>Shipment assignment</p>
            <h3 id="assign-driver-title">Assign a driver</h3>
            <p>{shipment.trackingNumber}</p>
          </div>
          <button
            aria-label="Close driver assignment"
            className={styles.closeButton}
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>

        <form className={styles.assignmentForm} onSubmit={onSubmit}>
          <label className={styles.assignmentField} htmlFor="shipment-driver">
            Select driver
            <select
              id="shipment-driver"
              disabled={isLoadingDrivers || isSaving || drivers.length === 0}
              onChange={(event) => onDriverChange(event.target.value)}
              required
              value={driverId}
            >
              <option value="">
                {isLoadingDrivers
                  ? "Loading drivers..."
                  : drivers.length === 0
                    ? "No drivers available"
                    : "Choose a driver"}
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </label>
          {!isLoadingDrivers && drivers.length === 0 && (
            <p className={styles.assignmentHint}>
              No drivers are available to assign.
            </p>
          )}
          <footer className={styles.assignmentActions}>
            <button
              className={styles.cancelButton}
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.confirmButton}
              disabled={!driverId || isLoadingDrivers || isSaving}
              type="submit"
            >
              {isSaving ? "Assigning..." : "Assign driver"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ShipmentDetails({
  shipment,
  onClose,
  onTrack,
  isDriver,
}: {
  shipment: Shipment;
  onClose: () => void;
  onTrack: () => void;
  isDriver: boolean;
}) {
  const history: ShipmentHistory[] = shipment.shipmentStatusHistory ?? [];
  const [shipmentStatus, setShipmentStatus] = useState(shipment.status);

  const setStatus = async (
    status: "In Transit" | "Delivered" | "Picked Up",
  ) => {
    try {
      await updateShipmentStatus(shipment.id, status);
      setShipmentStatus(status);
      toast.success("Shipment status updated successfully");
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setShipmentStatus(shipment.status),
      0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [shipment.status]);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        className={styles.drawer}
        onClick={(event) => event.stopPropagation()}
        aria-label="Shipment details"
      >
        <div className={styles.drawerHeader}>
          <div>
            <p className={styles.kicker}>Shipment details</p>
            <h3>{shipment.trackingNumber}</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            aria-label="Close details"
          >
            x
          </button>
        </div>
        <div className={styles.detailGrid}>
          <div>
            <span>Status</span>
            <strong
              className={`${styles.status} ${statusClass(shipment.status)}`}
            >
              {shipment.status}
            </strong>
          </div>
          <div>
            <span>Recipient</span>
            <strong>{shipment.recipientName}</strong>
          </div>
          <div>
            <span>Recipient phone no.</span>
            <strong>{shipment.recipientPhone}</strong>
          </div>
          <div>
            <span>Pickup</span>
            <strong>{shipment.pickupAddress}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{shipment.deliveryAddress}</strong>
          </div>
          <div>
            <span>Estimated cost</span>
            <strong>₦ {Number(shipment.estimatedCost).toLocaleString()}</strong>
          </div>

          {isDriver && (
            <div className={styles.field}>
              <label htmlFor="update-shipment">Update shipment status</label>
              <select
                id="update-shipment"
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "In Transit"
                      | "Delivered"
                      | "Picked Up",
                  )
                }
                required
                value={shipmentStatus}
              >
                <option value="">Select an option</option>
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          )}
        </div>
        {!isDriver && (
          <button
            className={styles.trackButton}
            onClick={onTrack}
            type="button"
          >
            Track shipment live
          </button>
        )}

        <h4>Status history</h4>
        <div className={styles.timeline}>
          {history.length === 0 ? (
            <p className={styles.muted}>No status history available.</p>
          ) : (
            history.map((event) => (
              <div className={styles.timelineItem} key={event.id}>
                <span className={styles.timelineDot} />
                <div>
                  <strong>{event.event || ""}</strong>
                  <p>{event.notes || ""}</p>
                  <span>
                    {event.status || ""} - {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
