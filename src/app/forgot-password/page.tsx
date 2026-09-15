"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { forgotPassword } from "@/services/axios/auth.service";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      await forgotPassword(String(formData.get("email")));
      setSubmitted(true);
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
        <p className={styles.eyebrow}>Account recovery</p>
        <h1>Forgot your password?</h1>
        {submitted ? (
          <p className={styles.copy}>
            Check your inbox for a secure password reset link. The link will
            take you to the reset password page.
          </p>
        ) : (
          <>
            <p className={styles.copy}>
              Enter your account email and we&apos;ll send instructions to
              create a new password.
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                autoComplete="email"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <p className={styles.footer}>
          Remember your password? <Link href="/">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
