"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import { can } from "@/lib/rbac";
import { readSession } from "@/lib/session";
import {
  getUserById,
  updateUser,
  updateUserStatus,
  type UserInput,
  type UserProfile,
} from "@/services/axios/users.service";
import LocationFields from "../LocationFields";
import styles from "../users.module.css";
import { getRoles, Role } from "@/services/axios/roles.service";

type EditableProfile = UserInput;

const EMPTY_PROFILE: EditableProfile = {
  email: "",
  firstName: "",
  lastName: "",
  roleId: "",
  gender: "",
  dob: "",
  phoneNumber: "",
  country: "",
  state: "",
  city: "",
  address: "",
};

function dateValue(date?: string) {
  return date ? date.slice(0, 10) : "";
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<EditableProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const permissions = readSession()?.permissions ?? [];
  const canUpdate = can(permissions, "user", "update");

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUserById(id);
      setUser(result);
      setForm({
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        roleId: result.roleId ?? result.role?.id ?? "",
        gender: result.gender ?? "",
        dob: dateValue(result.dob),
        phoneNumber: result.phoneNumber ?? "",
        country: result.country ?? "",
        state: result.state ?? "",
        city: result.city ?? "",
        address: result.address ?? "",
      });
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      await loadUser();
      try {
        const result = await getRoles();
        setRoles(result.data.data);
      } catch {
        // The Axios interceptor displays the API error toast.
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [loadUser]);

  function updateField<K extends keyof EditableProfile>(
    key: K,
    value: EditableProfile[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateUser(id, form);
      setUser(updated);
      setIsEditing(false);
      toast.success("User profile updated.");
      await loadUser();
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus() {
    if (!user) return;
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      const updated = await updateUserStatus(id, nextStatus);
      setUser(updated);
      toast.success(nextStatus === "active" ? "User activated." : "User suspended.");
    } catch {
      // The Axios interceptor displays the API error toast.
    }
  }

  if (isLoading) {
    return (
      <section className={styles.page}>
        <p className={styles.muted}>Loading user profile...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={styles.page}>
        <Link className={styles.backLink} href="/dashboard/users">
          <FiArrowLeft aria-hidden="true" />
          Back to users
        </Link>
        <div className={styles.accessDenied}>User profile could not be loaded.</div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} href="/dashboard/users">
        <FiArrowLeft aria-hidden="true" />
        Back to users
      </Link>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.kicker}>User profile</p>
          <h2>
            {user.firstName} {user.lastName}
          </h2>
          <p>{user.email}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Account details</h3>
            <p>Profile information and account status.</p>
          </div>
          {!isEditing && canUpdate && (
            <div className={styles.formActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setIsEditing(true)}
                type="button"
              >
                Edit profile
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => void changeStatus()}
                type="button"
              >
                {user.status === "active" ? "Suspend user" : "Activate user"}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.fields}>
              <label className={styles.field}>
                First name *
                <input
                  onChange={(event) => updateField("firstName", event.target.value)}
                  required
                  value={form.firstName}
                />
              </label>
              <label className={styles.field}>
                Last name *
                <input
                  onChange={(event) => updateField("lastName", event.target.value)}
                  required
                  value={form.lastName}
                />
              </label>
              <label className={styles.field}>
                Email
                <input readOnly type="email" value={form.email ?? ""} />
              </label>
              <label className={styles.field}>
                Role *
                <select
                  onChange={(event) => updateField("roleId", event.target.value)}
                  required
                  value={form.roleId}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                Gender *
                <select
                  onChange={(event) => updateField("gender", event.target.value)}
                  required
                  value={form.gender}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className={styles.field}>
                Date of birth *
                <input
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => updateField("dob", event.target.value)}
                  required
                  type="date"
                  value={form.dob}
                />
              </label>
              <label className={styles.field}>
                Phone number *
                <input
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                  required
                  type="tel"
                  value={form.phoneNumber}
                />
              </label>
              <LocationFields
                onChange={(location) =>
                  setForm((current) => ({ ...current, ...location }))
                }
                value={form}
              />
              <label className={`${styles.field} ${styles.full}`}>
                Address *
                <textarea
                  onChange={(event) => updateField("address", event.target.value)}
                  required
                  value={form.address}
                />
              </label>
            </div>
            <div className={styles.formActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setIsEditing(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.detailGrid}>
            <Detail label="Email" value={user.email} />
            <Detail label="Role" value={user.role?.name ?? "—"} />
            <Detail label="Status" value={user.status ?? "pending"} />
            <Detail label="Gender" value={user.gender ?? "—"} />
            <Detail label="Date of birth" value={dateValue(user.dob) || "—"} />
            <Detail label="Phone number" value={user.phoneNumber ?? "—"} />
            <Detail label="Country" value={user.country ?? "—"} />
            <Detail label="State" value={user.state ?? "—"} />
            <Detail label="City" value={user.city ?? "—"} />
            <Detail label="Address" value={user.address ?? "—"} />
          </div>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
