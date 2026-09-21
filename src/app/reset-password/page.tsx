"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { resetPassword } from "@/services/axios/auth.service";
import PasswordField from "@/components/PasswordField";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("token") ?? ""),
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      setIsSubmitting(false);
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await resetPassword(token, newPassword);
      router.replace("/");
      toast.success("Password reset was successful");
    } catch {
      // Axios displays the API error through the global toast.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>L</span>
          <span>LogiFlow</span>
        </Link>
        <p className={styles.eyebrow}>Secure your account</p>
        <h1>Create a new password.</h1>
        <p className={styles.copy}>
          Choose a strong password you haven&apos;t used before to keep your
          account protected.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <PasswordField
            autoComplete="new-password"
            id="newPassword"
            label="New password"
            minLength={8}
            name="newPassword"
            placeholder="At least 8 characters"
            required
          />
          <PasswordField
            autoComplete="new-password"
            id="confirmPassword"
            label="Confirm password"
            minLength={8}
            name="confirmPassword"
            placeholder="Re-enter your password"
            required
          />
          <button disabled={isSubmitting || !token} type="submit">
            {isSubmitting ? "Updating..." : "Reset password"}
          </button>
        </form>
        {!token && (
          <p className={styles.warning}>
            Invalid Link. Please use the link from your email.
          </p>
        )}
        <p className={styles.footer}>
          Return to <Link href="/">sign in</Link>
        </p>
      </section>
    </main>
  );
}
