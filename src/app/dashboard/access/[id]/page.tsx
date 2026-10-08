"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  assignRolePermissions,
  getAllPermissions,
  getRole,
  getRolePermissionNames,
  removeRolePermissions,
  type AccessPermission,
  type AccessRole,
} from "@/services/axios/access.service";
import styles from "../access.module.css";

const PERMISSIONS_PAGE_SIZE = 15;

export default function RoleAccessDetailPage() {
  const params = useParams<{ id: string }>();
  const roleId = params.id;
  const [role, setRole] = useState<AccessRole | null>(null);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [assignedNames, setAssignedNames] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRole = useCallback(async () => {
    setIsLoadingRole(true);
    try {
      const [roleResult, assignedResult] = await Promise.all([
        getRole(roleId),
        getRolePermissionNames(roleId),
      ]);
      setRole(roleResult);
      setAssignedNames(assignedResult);
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoadingRole(false);
    }
  }, [roleId]);

  const loadPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    try {
      setPermissions(await getAllPermissions());
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRole(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRole]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPermissions(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPermissions]);

  const filteredPermissions = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return permissions;
    return permissions.filter((permission) =>
      `${permission.name} ${permission.desc ?? ""} ${permission.resource} ${permission.action}`
        .toLowerCase()
        .includes(search),
    );
  }, [keyword, permissions]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPermissions.length / PERMISSIONS_PAGE_SIZE),
  );
  const visiblePermissions = useMemo(() => {
    const start = (page - 1) * PERMISSIONS_PAGE_SIZE;
    return filteredPermissions.slice(start, start + PERMISSIONS_PAGE_SIZE);
  }, [filteredPermissions, page]);
  const assignedPermissions = useMemo(
    () => permissions.filter((permission) => assignedNames.includes(permission.name)),
    [assignedNames, permissions],
  );
  const hasChanges = selectedIds.length > 0;

  function isChecked(permission: AccessPermission) {
    const assigned = assignedNames.includes(permission.name);
    return selectedIds.includes(permission.id) ? !assigned : assigned;
  }

  function togglePermission(permissionId: string) {
    setSelectedIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  }

  async function saveChanges() {
    if (!role || selectedIds.length === 0 || isSaving) return;

    const selectedPermissions = permissions.filter((permission) =>
      selectedIds.includes(permission.id),
    );
    const permissionIdsToAssign = selectedPermissions
      .filter((permission) => !assignedNames.includes(permission.name))
      .map((permission) => permission.id);
    const permissionIdsToRemove = selectedPermissions
      .filter((permission) => assignedNames.includes(permission.name))
      .map((permission) => permission.id);

    setIsSaving(true);
    try {
      if (permissionIdsToAssign.length > 0) {
        await assignRolePermissions(role.id, permissionIdsToAssign);
      }
      if (permissionIdsToRemove.length > 0) {
        await removeRolePermissions(role.id, permissionIdsToRemove);
      }

      await loadRole();
      setSelectedIds([]);
      toast.success("Role permissions updated.");
    } catch {
      // The Axios interceptor displays the API error toast.
      await loadRole();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingRole && !role) {
    return (
      <section className={styles.page}>
        <p className={styles.muted}>Loading role...</p>
      </section>
    );
  }

  if (!role) {
    return (
      <section className={styles.page}>
        <Link className={styles.backLink} href="/dashboard/access">
          ← Back to roles
        </Link>
        <p className={styles.muted}>Role details could not be loaded.</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} href="/dashboard/access">
        ← Back to roles
      </Link>

      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Role permissions</p>
          <h2>{role.name}</h2>
          <p>{role.desc || "Manage access for this role."}</p>
          <div className={styles.detailSummary}>
            <span>
              Status: <strong>{role.isActive ? "Active" : "Inactive"}</strong>
            </span>
            <span>
              Assigned:               <strong>{assignedPermissions.length}</strong>
            </span>
          </div>
        </div>
      </div>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Assigned permissions</h3>
            <p>Permissions currently assigned to this role.</p>
          </div>
          <span className={styles.total}>
            {assignedPermissions.length} assigned
          </span>
        </div>
        {isLoadingPermissions ? (
          <p className={styles.empty}>Loading assigned permissions...</p>
        ) : assignedPermissions.length === 0 ? (
          <p className={styles.empty}>
            No permissions are currently assigned to this role.
          </p>
        ) : (
          <div className={styles.permissionList}>
            {assignedPermissions.map((permission) => (
              <label className={styles.permissionRow} key={permission.id}>
                <input
                  checked={isChecked(permission)}
                  onChange={() => togglePermission(permission.id)}
                  type="checkbox"
                />
                <span>
                  <span className={styles.permissionName}>
                    {permission.name}
                  </span>
                  {permission.desc && (
                    <span className={styles.permissionDescription}>
                      {permission.desc}
                    </span>
                  )}
                </span>
                <span className={styles.permissionResource}>
                  {permission.resource} / {permission.action}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>All permissions</h3>
            <p>Select permissions to add or remove, then save your changes.</p>
          </div>
          <button
            className={styles.saveChanges}
            disabled={!hasChanges || isSaving}
            onClick={() => void saveChanges()}
            type="button"
          >
            {isSaving
              ? "Saving..."
              : `Save changes${hasChanges ? ` (${selectedIds.length})` : ""}`}
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
          <span className={styles.total}>
            {filteredPermissions.length} permissions
          </span>
        </div>

        {isLoadingPermissions ? (
          <p className={styles.empty}>Loading permissions...</p>
        ) : filteredPermissions.length === 0 ? (
          <p className={styles.empty}>No permissions found.</p>
        ) : (
          <div className={styles.permissionList}>
            {visiblePermissions.map((permission) => {
              const isAssigned = assignedNames.includes(permission.name);
              return (
                <label className={styles.permissionRow} key={permission.id}>
                  <input
                    checked={isChecked(permission)}
                    onChange={() => togglePermission(permission.id)}
                    type="checkbox"
                  />
                  <span>
                    <span className={styles.permissionName}>
                      {permission.name}
                    </span>
                    {permission.desc && (
                      <span className={styles.permissionDescription}>
                        {permission.desc}
                      </span>
                    )}
                  </span>
                  <span className={styles.permissionResource}>
                    {isAssigned
                      ? "Assigned"
                      : `${permission.resource} / ${permission.action}`}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div className={styles.pagination}>
          <span>
            Page {page} of {totalPages}
          </span>
          <div className={styles.paginationControls}>
            <button
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => current - 1);
              }}
              type="button"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => current + 1);
              }}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
