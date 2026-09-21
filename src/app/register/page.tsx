"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/services/axios/auth.service";
import styles from "./register.module.css";
import { type Role, getRoles } from "@/services/axios/roles.service";
import PasswordField from "@/components/PasswordField";

const genders = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export default function RegisterPage() {
  const [roles, setRoles] = useState<Role[] | []>([]);
  const adminRole = process.env.NEXT_PUBLIC_ADMIN_ROLE;

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        console.log("Fetched roles", roles.data.data);
        if (roles.status) {
          const filteredRoles = roles.data.data.filter(
            (role) => role.name !== adminRole,
          );
          setRoles(filteredRoles);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );

    try {
      await register(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, String(value)]),
        ),
      );
      router.push("/");
    } catch {
      // The Axios response interceptor displays the global error toast.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <Link className={styles.brand} href="/" aria-label="LogiFlow home">
          <span className={styles.brandMark}>L</span>
          <span>LogiFlow</span>
        </Link>
        <div className={styles.introCopy}>
          <p className={styles.eyebrow}>Join the network</p>
          <h1>Build a smoother way forward.</h1>
          <p>
            Create your LogiFlow account and bring every delivery, driver, and
            destination into one connected workspace.
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formShell}>
          <div className={styles.mobileBrand}>
            <span className={styles.brandMark}>L</span>
            <span>LogiFlow</span>
          </div>
          <header className={styles.header}>
            <p className={styles.formEyebrow}>Create your account</p>
            <h2>Let&apos;s get you moving.</h2>
            <p>
              Fill in your details to start managing your logistics with ease.
            </p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g. Alex"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="e.g. Morgan"
                  autoComplete="family-name"
                  required
                />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              <PasswordField
                autoComplete="new-password"
                className={styles.field}
                id="password"
                label="Password"
                minLength={8}
                name="password"
                placeholder="Create a password"
                required
              />
              <div className={styles.field}>
                <label htmlFor="phoneNumber">Phone number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+2348165678909"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="roleId">Account Type</label>
                <select id="roleId" name="roleId" defaultValue="" required>
                  <option value="" disabled>
                    Select account type user
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" defaultValue="" required>
                  <option value="" disabled>
                    Select your gender
                  </option>
                  {genders.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="dob">Date of birth</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  autoComplete="bday"
                  required
                />
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Street, city, country"
                  autoComplete="street-address"
                  required
                />
              </div>
            </div>

            <button
              className={styles.submitButton}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className={styles.signInPrompt}>
            Already have an account? <Link href="/">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
