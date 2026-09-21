"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/axios/auth.service";
import PasswordField from "@/components/PasswordField";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      await login(
        String(formData.get("email")),
        String(formData.get("password")),
      );
      router.push("/dashboard");
    } catch {
      // The Axios response interceptor displays the global error toast.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.heroPattern} aria-hidden="true" />
        <div className={styles.heroContent}>
          <Link className={styles.brand} href="/" aria-label="LogiFlow home">
            <span className={styles.brandMark}>L</span>
            <span>LogiFlow</span>
          </Link>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Move smarter. Deliver better.</p>
            <h1>Everything in motion, all in one place.</h1>
            <p className={styles.heroText}>
              Manage every shipment, route, and delivery with a clear view of
              your entire logistics operation.
            </p>
          </div>
          <p className={styles.heroFooter}>Trusted logistics management</p>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileBrand}>
            <span className={styles.brandMark}>L</span>
            <span>LogiFlow</span>
          </div>
          <div className={styles.formHeader}>
            <p className={styles.formEyebrow}>Welcome back</p>
            <h2>Sign in to your account</h2>
            <p>Enter your details to access your logistics dashboard.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
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
              autoComplete="current-password"
              id="password"
              label="Password"
              labelExtra={<Link href="/forgot-password">Forgot password?</Link>}
              name="password"
              placeholder="Enter your password"
              required
            />
            <button
              className={styles.submitButton}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className={styles.registerPrompt}>
            Don&apos;t have an account?{" "}
            <Link href="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
