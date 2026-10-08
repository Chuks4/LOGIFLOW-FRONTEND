"use client";

import { useCallback, useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import toast from "react-hot-toast";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import { can } from "@/lib/rbac";
import { readSession } from "@/lib/session";
import {
  assignVehicleDriver,
  createVehicle,
  deleteVehicle,
  getVehicle,
  getVehicles,
  updateVehicle,
  type Vehicle,
  type VehicleInput,
  type VehicleStatus,
} from "@/services/axios/vehicles.service";
import { getDrivers, type DriverOption } from "@/services/axios/users.service";
import { formatDate } from "@/utils/utils";
import styles from "./vehicles.module.css";

const PAGE_SIZE = 10;
const VEHICLE_STATUSES: VehicleStatus[] = [
  "Available",
  "On Trip",
  "Under Maintenance",
  "Out of Service",
];

type VehicleForm = {
  plateNumber: string;
  type: string;
  capacity: string;
  status: VehicleStatus;
  year: string;
  model: string;
};

const EMPTY_FORM: VehicleForm = {
  plateNumber: "",
  type: "",
  capacity: "",
  status: "Available",
  year: "",
  model: "",
};

type ModalMode = "create" | "edit" | "details" | "assign" | null;

function statusClass(status: string) {
  return styles[`status${status.replace(/\s/g, "")}`] ?? styles.statusDefault;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [driverId, setDriverId] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);

  const permissions = readSession()?.permissions ?? [];

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVehicles({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        status: status || undefined,
      });
      setVehicles(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
      if (page > Math.max(result.totalPages, 1)) {
        setPage(Math.max(result.totalPages, 1));
      }
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadVehicles();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadVehicles]);

  function openCreate() {
    setSelectedVehicle(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
  }

  function openEdit(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setForm({
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      capacity: String(vehicle.capacity),
      status: vehicle.status,
      year: String(vehicle.year),
      model: vehicle.model,
    });
    setModalMode("edit");
  }

  async function viewVehicle(vehicle: Vehicle) {
    try {
      setSelectedVehicle(await getVehicle(vehicle.id));
      setModalMode("details");
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  async function openAssignment(vehicle: Vehicle) {
    setSelectedVehicle(vehicle);
    setDriverId("");
    setDrivers([]);
    setModalMode("assign");
    setIsLoadingDrivers(true);
    try {
      setDrivers(await getDrivers());
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoadingDrivers(false);
    }
  }

  async function saveVehicle(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const data: VehicleInput = {
      plateNumber: form.plateNumber.trim(),
      type: form.type.trim(),
      capacity: Number(form.capacity),
      status: form.status,
      year: Number(form.year),
      model: form.model.trim(),
    };
    try {
      if (modalMode === "edit" && selectedVehicle) {
        await updateVehicle(selectedVehicle.id, data);
        toast.success("Vehicle updated.");
      } else {
        await createVehicle(data);
        toast.success("Vehicle created.");
      }
      setModalMode(null);
      await loadVehicles();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  async function assignDriver(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle || !driverId) return;
    setIsSaving(true);
    try {
      await assignVehicleDriver(selectedVehicle.id, driverId);
      toast.success("Driver assigned to vehicle.");
      setModalMode(null);
      await loadVehicles();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  async function removeVehicle(vehicle: Vehicle) {
    if (
      !window.confirm(
        `Delete vehicle ${vehicle.plateNumber}? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteVehicle(vehicle.id);
      toast.success("Vehicle deleted.");
      await loadVehicles();
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  const canCreate = can(permissions, "vehicles", "create");
  const canUpdate = can(permissions, "vehicles", "update");
  const canDelete = can(permissions, "vehicles", "delete");
  const canAssignDriver = can(permissions, "vehicles", "assign");

  const columns: TableColumn<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (vehicle) => (
        <>
          <strong className={styles.cellTitle}>{vehicle.plateNumber}</strong>
          <span className={styles.cellSubtitle}>
            {vehicle.year} {vehicle.model}
          </span>
        </>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (vehicle) => vehicle.type,
    },
    {
      key: "capacity",
      header: "Capacity",
      render: (vehicle) => `${Number(vehicle.capacity).toLocaleString()} kg`,
    },
    {
      key: "driver",
      header: "Assigned driver",
      render: (vehicle) =>
        vehicle.driver
          ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}`
          : "Unassigned",
    },
    {
      key: "status",
      header: "Status",
      render: (vehicle) => (
        <span className={`${styles.status} ${statusClass(vehicle.status)}`}>
          {vehicle.status}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Last updated",
      render: (vehicle) => formatDate(vehicle.updatedAt),
    },
  ];

  const actions: TableAction<Vehicle>[] = [
    {
      key: "view",
      label: "View details",
      onClick: (vehicle) => void viewVehicle(vehicle),
    },
    {
      key: "edit",
      label: "Edit vehicle",
      hidden: () => !canUpdate,
      onClick: openEdit,
    },
    {
      key: "assign",
      label: "Assign driver",
      hidden: (vehicle) => !canAssignDriver || vehicle.status !== "Available",
      onClick: (vehicle) => void openAssignment(vehicle),
    },
    {
      key: "delete",
      label: "Delete vehicle",
      hidden: () => !canDelete,
      onClick: (vehicle) => void removeVehicle(vehicle),
    },
  ];

  if (!permissions.length || !can(permissions, "vehicles", "read")) {
    return (
      <section className={styles.denied}>
        <p className={styles.kicker}>Access restricted</p>
        <h2>You don&apos;t have permission to manage vehicles.</h2>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Fleet operations</p>
          <h2>Vehicles</h2>
          <p>Manage fleet records, availability, and driver assignments.</p>
        </div>
        {canCreate && (
          <button
            className={styles.primaryButton}
            onClick={openCreate}
            type="button"
          >
            <span aria-hidden="true">+</span> Add vehicle
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search vehicles</span>
          <input
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="Search by plate number or type"
            type="search"
            value={keyword}
          />
        </label>
        <label className={styles.filter}>
          <span className={styles.srOnly}>Filter by vehicle status</span>
          <select
            onChange={(event) => {
              setStatus(event.target.value as VehicleStatus | "");
              setPage(1);
            }}
            value={status}
          >
            <option value="">All statuses</option>
            {VEHICLE_STATUSES.map((vehicleStatus) => (
              <option key={vehicleStatus} value={vehicleStatus}>
                {vehicleStatus}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.total}>{totalItems} vehicle(s)</span>
      </div>

      <div className={styles.tableCard}>
        <DataTable
          actions={actions}
          columns={columns}
          data={vehicles}
          emptyMessage="No vehicles match your search."
          getRowKey={(vehicle) => vehicle.id}
          isLoading={isLoading}
          loadingLabel="Loading vehicles..."
        />
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
        />
      </div>

      {modalMode && (
        <div
          className={styles.backdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) setModalMode(null);
          }}
        >
          <section
            aria-labelledby="vehicle-dialog-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <div className={styles.dialogHeader}>
              <div>
                <p className={styles.kicker}>Fleet operations</p>
                <h3 id="vehicle-dialog-title">
                  {modalMode === "create" && "Add vehicle"}
                  {modalMode === "edit" && "Edit vehicle"}
                  {modalMode === "details" && "Vehicle details"}
                  {modalMode === "assign" && "Assign driver"}
                </h3>
              </div>
              <button
                aria-label="Close dialog"
                className={styles.closeButton}
                onClick={() => setModalMode(null)}
                type="button"
              >
                ×
              </button>
            </div>

            {(modalMode === "create" || modalMode === "edit") && (
              <form className={styles.form} onSubmit={saveVehicle}>
                <label>
                  Plate number
                  <input
                    onChange={(event) =>
                      setForm({ ...form, plateNumber: event.target.value })
                    }
                    required
                    value={form.plateNumber}
                  />
                </label>
                <label>
                  Vehicle type
                  <input
                    onChange={(event) =>
                      setForm({ ...form, type: event.target.value })
                    }
                    placeholder="Truck, van, motorcycle..."
                    required
                    value={form.type}
                  />
                </label>
                <label>
                  Model
                  <input
                    onChange={(event) =>
                      setForm({ ...form, model: event.target.value })
                    }
                    required
                    value={form.model}
                  />
                </label>
                <div className={styles.formRow}>
                  <label>
                    Year
                    <input
                      max={new Date().getFullYear() + 1}
                      min="1900"
                      onChange={(event) =>
                        setForm({ ...form, year: event.target.value })
                      }
                      required
                      type="number"
                      value={form.year}
                    />
                  </label>
                  <label>
                    Capacity (kg)
                    <input
                      min="1"
                      onChange={(event) =>
                        setForm({ ...form, capacity: event.target.value })
                      }
                      required
                      type="number"
                      value={form.capacity}
                    />
                  </label>
                </div>
                {modalMode === "edit" && (
                  <label>
                    Status
                    <select
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as VehicleStatus,
                        })
                      }
                      value={form.status}
                    >
                      {VEHICLE_STATUSES.map((vehicleStatus) => (
                        <option key={vehicleStatus} value={vehicleStatus}>
                          {vehicleStatus}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setModalMode(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryButton}
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Create vehicle"
                        : "Save changes"}
                  </button>
                </div>
              </form>
            )}

            {modalMode === "assign" && (
              <form className={styles.form} onSubmit={assignDriver}>
                <p>
                  Choose a driver for{" "}
                  <strong>{selectedVehicle?.plateNumber}</strong>.
                </p>
                <label>
                  Driver
                  <select
                    onChange={(event) => setDriverId(event.target.value)}
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
                {isLoadingDrivers && (
                  <p className={styles.helper}>Loading drivers...</p>
                )}
                {!isLoadingDrivers && drivers.length === 0 && (
                  <p className={styles.helper}>
                    No drivers are available to assign.
                  </p>
                )}
                <div className={styles.formActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setModalMode(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryButton}
                    disabled={
                      isSaving || isLoadingDrivers || drivers.length === 0
                    }
                    type="submit"
                  >
                    {isSaving ? "Assigning..." : "Assign driver"}
                  </button>
                </div>
              </form>
            )}

            {modalMode === "details" && selectedVehicle && (
              <dl className={styles.details}>
                <div>
                  <dt>Plate number</dt>
                  <dd>{selectedVehicle.plateNumber}</dd>
                </div>
                <div>
                  <dt>Vehicle</dt>
                  <dd>
                    {selectedVehicle.year} {selectedVehicle.model}
                  </dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{selectedVehicle.type}</dd>
                </div>
                <div>
                  <dt>Capacity</dt>
                  <dd>
                    {Number(selectedVehicle.capacity).toLocaleString()} kg
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedVehicle.status}</dd>
                </div>
                <div>
                  <dt>Assigned driver</dt>
                  <dd>
                    {selectedVehicle.driver
                      ? `${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`
                      : "Unassigned"}
                  </dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(selectedVehicle.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(selectedVehicle.updatedAt)}</dd>
                </div>
              </dl>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
