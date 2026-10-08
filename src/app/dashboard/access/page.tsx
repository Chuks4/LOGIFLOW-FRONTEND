"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import type { SubmitEvent } from "react";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import {
  createRole,
  deleteRole,
  getRolesPage,
  updateRole,
  type AccessRole,
} from "@/services/axios/access.service";
import styles from "./access.module.css";

const PAGE_SIZE = 10;
type RoleForm = { name: string; desc: string; isActive: boolean };

const EMPTY_FORM: RoleForm = { name: "", desc: "", isActive: true };

export default function AccessPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getRolesPage({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
      });
      setRoles(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [keyword, page]);

  function openCreate() {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEdit(role: AccessRole) {
    setEditingRole(role);
    setForm({
      name: role.name,
      desc: role.desc ?? "",
      isActive: role.isActive,
    });
    setIsFormOpen(true);
  }

  async function saveRole(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        desc: form.desc.trim(),
        isActive: form.isActive,
      };
      if (editingRole) {
        await updateRole(editingRole.id, payload);
        toast.success("Role updated.");
      } else {
        await createRole(payload);
        toast.success("Role created.");
      }
      setEditingRole(null);
      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      await loadRoles();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  async function removeRole(role: AccessRole) {
    if (
      !window.confirm(
        `Delete the "${role.name}" role? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteRole(role.id);
      toast.success("Role deleted.");
      if (roles.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadRoles();
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRoles(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRoles]);

  const columns: TableColumn<AccessRole>[] = [
    {
      key: "name",
      header: "Role",
      render: (role) => (
        <>
          <strong className={styles.cellTitle}>{role.name}</strong>
          <span className={styles.cellSubtitle}>
            {role.desc || "No description"}
          </span>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (role) => (
        <span
          className={`${styles.status} ${
            role.isActive ? styles.statusActive : styles.statusInactive
          }`}
        >
          {role.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (role) =>
        role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "—",
    },
  ];

  const actions: TableAction<AccessRole>[] = [
    {
      key: "edit",
      label: "Edit role",
      onClick: openEdit,
    },
    {
      key: "permissions",
      label: "Manage permissions",
      onClick: (role) => router.push(`/dashboard/access/${role.id}`),
    },
    {
      key: "delete",
      label: "Delete role",
      onClick: (role) => void removeRole(role),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Administration</p>
          <h2>Roles &amp; permissions</h2>
          <p>Review roles and manage the permissions assigned to each one.</p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={openCreate}
          type="button"
        >
          <FiPlus aria-hidden="true" />
          Create role
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search roles</span>
          <input
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="Search roles"
            type="search"
            value={keyword}
          />
        </label>
        <span className={styles.total}>{totalItems} roles</span>
      </div>

      <div className={styles.tableCard}>
        <DataTable
          actions={actions}
          columns={columns}
          data={roles}
          emptyMessage="No roles found."
          getRowKey={(role) => role.id}
          isLoading={isLoading}
          loadingLabel="Loading roles..."
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
            if (!isSaving) {
              setEditingRole(null);
              setForm(EMPTY_FORM);
              setIsFormOpen(false);
            }
          }}
          role="presentation"
        >
          <section
            aria-labelledby="role-form-title"
            aria-modal="true"
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>
                  {editingRole ? "Update access" : "New access"}
                </p>
                <h3 id="role-form-title">
                  {editingRole ? "Edit role" : "Create role"}
                </h3>
              </div>
              <button
                aria-label="Close role form"
                className={styles.modalClose}
                disabled={isSaving}
                onClick={() => {
                  setEditingRole(null);
                  setForm(EMPTY_FORM);
                  setIsFormOpen(false);
                }}
                type="button"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <form className={styles.form} onSubmit={saveRole}>
              <label className={styles.formField}>
                <span>Role name</span>
                <input
                  maxLength={80}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  value={form.name}
                />
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
              {editingRole && (
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
                  Role is active
                </label>
              )}
              <footer className={styles.formActions}>
                <button
                  className={styles.secondaryButton}
                  disabled={isSaving}
                  onClick={() => {
                    setEditingRole(null);
                    setForm(EMPTY_FORM);
                    setIsFormOpen(false);
                  }}
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
                    : editingRole
                      ? "Save changes"
                      : "Create role"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
