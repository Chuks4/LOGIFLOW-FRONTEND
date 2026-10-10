"use client";

import Link from "next/link";
import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import { can } from "@/lib/rbac";
import { readSession } from "@/lib/session";
import { createUser, type UserInput } from "@/services/axios/users.service";
import LocationFields from "../LocationFields";
import styles from "../users.module.css";
import { getRoles, Role } from "@/services/axios/roles.service";

const INITIAL_FORM: UserInput & { password: string } = {
  email: "",
  password: "",
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

export default function CreateUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const canCreateUser = can(
    readSession()?.permissions ?? [],
    "users",
    "create",
  );

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true);

      try {
        const roles = await getRoles();
        console.log("Fetched roles", roles.data.data);
        if (roles.status) {
          setRoles(roles.data.data);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const user = await createUser(form);
      toast.success("User created. A verification email has been sent.");
      router.push(`/dashboard/users/${user.id}`);
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsSaving(false);
    }
  }

  if (!canCreateUser) {
    return (
      <section className={styles.page}>
        <div className={styles.accessDenied}>
          <h3>Access restricted</h3>
          You do not have permission to create users.
        </div>
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
          <p className={styles.kicker}>Administration</p>
          <h2>Create user</h2>
          <p>Create a user profile and send an email verification link.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3>Profile information</h3>
            <p>Fields marked required must be provided.</p>
          </div>
        </div>
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.fields}>
            <label className={styles.field}>
              First name *
              <input
                autoComplete="given-name"
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                required
                value={form.firstName}
              />
            </label>
            <label className={styles.field}>
              Last name *
              <input
                autoComplete="family-name"
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                required
                value={form.lastName}
              />
            </label>
            <label className={styles.field}>
              Email *
              <input
                autoComplete="email"
                onChange={(event) => updateField("email", event.target.value)}
                required
                type="email"
                value={form.email}
              />
            </label>
            <label className={styles.field}>
              Initial password *
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                required
                type="password"
                value={form.password}
              />
            </label>
            <label className={styles.field}>
              Role *
              <select
                disabled={isLoadingRoles}
                onChange={(event) => updateField("roleId", event.target.value)}
                required
                value={form.roleId}
              >
                <option value="">
                  {isLoadingRoles ? "Loading roles..." : "Select a role"}
                </option>
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
                autoComplete="tel"
                onChange={(event) =>
                  updateField("phoneNumber", event.target.value)
                }
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
                autoComplete="street-address"
                onChange={(event) => updateField("address", event.target.value)}
                required
                value={form.address}
              />
            </label>
          </div>
          <div className={styles.formActions}>
            <Link className={styles.secondaryButton} href="/dashboard/users">
              Cancel
            </Link>
            <button
              className={styles.primaryButton}
              disabled={isSaving || isLoadingRoles || roles.length === 0}
              type="submit"
            >
              {isSaving ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
