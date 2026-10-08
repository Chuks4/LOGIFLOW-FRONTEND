"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import {
  createPermission,
  deletePermission,
  getPermissionsPage,
  updatePermission,
  type AccessPermission,
} from "@/services/axios/access.service";
import styles from "../access/access.module.css";

const PAGE_SIZE = 10;
const RESOURCES = [
  "users",
  "roles",
  "permissions",
  "shipments",
  "vehicles",
  "drivers",
  "orders",
  "invoices",
  "payments",
  "reports",
  "settings",
  "dashboard",
  "messages",
];
const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "assign",
  "unassign",
  "manage",
  "approve",
  "reject",
  "track",
];

type PermissionForm = {
  resource: string;
  action: string;
  desc: string;
  isActive: boolean;
};

const EMPTY_FORM: PermissionForm = {
  resource: "",
  action: "",
  desc: "",
  isActive: true,
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<AccessPermission | null>(null);
  const [form, setForm] = useState<PermissionForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPermissionsPage({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        status: "all",
      });
      setPermissions(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPermissions(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPermissions]);

  function openCreate() {
    setEditingPermission(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEdit(permission: AccessPermission) {
    setEditingPermission(permission);
    setForm({
      resource: permission.resource,
      action: permission.action,
      desc: permission.desc ?? "",
      isActive: permission.isActive,
    });
    setIsFormOpen(true);
  }

  async function savePermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        resource: form.resource,
        action: form.action,
        desc: form.desc.trim(),
        isActive: form.isActive,
      };
      if (editingPermission) {
        await updatePermission(editingPermission.id, payload);
        toast.success("Permission updated.");
      } else {
        await createPermission(payload);
        toast.success("Permission created.");
      }
      setIsFormOpen(false);
      setEditingPermission(null);
      setForm(EMPTY_FORM);
      await loadPermissions();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  async function removePermission(permission: AccessPermission) {
    if (
      !window.confirm(
        `Delete permission "${permission.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deletePermission(permission.id);
      toast.success("Permission deleted.");
      if (permissions.length === 1 && page > 1)
        setPage((current) => current - 1);
      else await loadPermissions();
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  const columns: TableColumn<AccessPermission>[] = [
    {
      key: "name",
      header: "Permission",
      render: (permission) => (
        <>
          <strong className={styles.cellTitle}>{permission.name}</strong>
          <span className={styles.cellSubtitle}>
            {permission.desc || "No description"}
          </span>
        </>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      render: (permission) => permission.resource,
    },
    {
      key: "action",
      header: "Action",
      render: (permission) => permission.action,
    },
    {
      key: "status",
      header: "Status",
      render: (permission) => (
        <span
          className={`${styles.status} ${
            permission.isActive ? styles.statusActive : styles.statusInactive
          }`}
        >
          {permission.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const actions: TableAction<AccessPermission>[] = [
    { key: "edit", label: "Edit permission", onClick: openEdit },
    {
      key: "delete",
      label: "Delete permission",
      onClick: (permission) => void removePermission(permission),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Administration</p>
          <h2>Permissions</h2>
          <p>Create and maintain the permissions available for roles.</p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={openCreate}
          type="button"
        >
          <FiPlus aria-hidden="true" />
          Create permission
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search permissions</span>
          <input
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="Search permissions"
            type="search"
            value={keyword}
          />
        </label>
        <span className={styles.total}>{totalItems} permissions</span>
      </div>

      <div className={styles.tableCard}>
        <DataTable
          actions={actions}
          columns={columns}
          data={permissions}
          emptyMessage="No permissions found."
          getRowKey={(permission) => permission.id}
          isLoading={isLoading}
          loadingLabel="Loading permissions..."
        />
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
        />
      </div>

      {isFormOpen && (
        <div
          className={styles.overlay}
          onClick={() => {
            if (!isSaving) setIsFormOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="permission-form-title"
            aria-modal="true"
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>Access control</p>
                <h3 id="permission-form-title">
                  {editingPermission ? "Edit permission" : "Create permission"}
                </h3>
              </div>
              <button
                aria-label="Close permission form"
                className={styles.modalClose}
                disabled={isSaving}
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <form className={styles.form} onSubmit={savePermission}>
              <label className={styles.formField}>
                <span>Resource</span>
                <select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      resource: event.target.value,
                    }))
                  }
                  required
                  value={form.resource}
                >
                  <option disabled value="">
                    Select a resource
                  </option>
                  {RESOURCES.map((resource) => (
                    <option key={resource} value={resource}>
                      {resource}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.formField}>
                <span>Action</span>
                <select
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      action: event.target.value,
                    }))
                  }
                  required
                  value={form.action}
                >
                  <option disabled value="">
                    Select an action
                  </option>
                  {ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.formField}>
                <span>Description</span>
                <textarea
                  maxLength={255}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      desc: event.target.value,
                    }))
                  }
                  rows={3}
                  value={form.desc}
                />
              </label>
              {editingPermission && (
                <label className={styles.checkboxField}>
                  <input
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Permission is active
                </label>
              )}
              <footer className={styles.formActions}>
                <button
                  className={styles.secondaryButton}
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
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
                    : editingPermission
                      ? "Save changes"
                      : "Create permission"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
