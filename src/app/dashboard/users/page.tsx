"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import DataTable, {
  type TableAction,
  type TableColumn,
} from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import { can } from "@/lib/rbac";
import { readSession } from "@/lib/session";
import {
  getUsers,
  updateUserStatus,
  type UserProfile,
} from "@/services/axios/users.service";
import styles from "./users.module.css";
import { getRoles, Role } from "@/services/axios/roles.service";

const PAGE_SIZE = 10;

function statusClass(status?: UserProfile["status"]) {
  return (
    styles[`status${status?.charAt(0).toUpperCase()}${status?.slice(1)}`] ??
    styles.statusPending
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filterByRoles, setFilterByRoles] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const permissions = readSession()?.permissions ?? [];
  const canCreateUser = can(permissions, "users", "create");
  const canUpdateUser = can(permissions, "users", "update");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({
        page,
        limit: PAGE_SIZE,
        keyword: keyword || undefined,
        filterByRoles: filterByRoles || undefined,
      });
      setUsers(result.data);
      setTotalItems(result.totalItems);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [filterByRoles, keyword, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setCurrentUserId(readSession()?.id ?? ""),
      0,
    );
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        console.log("Fetched roles", roles.data.data);
        if (roles.status) {
          setRoles(roles.data.data);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  async function changeStatus(user: UserProfile) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await updateUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus === "active" ? "User activated." : "User suspended.",
      );
      await loadUsers();
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  const columns: TableColumn<UserProfile>[] = [
    {
      key: "name",
      header: "User",
      render: (user) => (
        <>
          <strong className={styles.cellTitle}>
            {user.firstName} {user.lastName}
            {user.id === currentUserId && (
              <span className={styles.youBadge}>You</span>
            )}
          </strong>
          <span className={styles.cellSubtitle}>{user.email}</span>
        </>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => user.role?.name ?? "—",
    },
    {
      key: "phone",
      header: "Phone",
      render: (user) => user.phoneNumber || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <span className={`${styles.status} ${statusClass(user.status)}`}>
          {user.status ?? "pending"}
        </span>
      ),
    },
  ];

  const actions: TableAction<UserProfile>[] = [
    {
      key: "view",
      label: "View profile",
      onClick: (user) => router.push(`/dashboard/users/${user.id}`),
    },
    {
      key: "change-status",
      label: (user) =>
        user.status === "active" ? "Suspend user" : "Activate user",
      hidden: () => !canUpdateUser,
      onClick: (user) => void changeStatus(user),
    },
  ];

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>Administration</p>
          <h2>Users</h2>
          <p>Manage user profiles, roles, and account status.</p>
        </div>
        {canCreateUser && (
          <Link className={styles.primaryButton} href="/dashboard/users/create">
            <FiPlus aria-hidden="true" />
            Create user
          </Link>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <label className={styles.search}>
            <span className={styles.srOnly}>Search users</span>
            <input
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email"
              type="search"
              value={keyword}
            />
          </label>
          <label className={styles.roleFilter}>
            <span className={styles.srOnly}>Filter users by role</span>
            <select
              onChange={(event) => {
                setFilterByRoles(event.target.value);
                setPage(1);
              }}
              value={filterByRoles}
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className={styles.total}>{totalItems} users</span>
      </div>

      <div className={styles.tableCard}>
        <DataTable
          actions={actions}
          columns={columns}
          data={users}
          emptyMessage="No users found."
          getRowKey={(user) => user.id}
          isLoading={isLoading}
          loadingLabel="Loading users..."
        />
        <Pagination
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}
