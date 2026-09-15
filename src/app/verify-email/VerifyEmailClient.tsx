"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyEmail } from "@/services/axios/auth.service";
import styles from "./verify-email.module.css";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailClient({ token }: { token: string }) {
  const [state, setState] = useState<VerificationState>(
    token ? "loading" : "error",
  );

  useEffect(() => {
    if (!token) return;

    let isActive = true;
    verifyEmail(token)
      .then(() => {
        if (isActive) setState("success");
      })
      .catch(() => {
        if (isActive) setState("error");
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-live="polite">
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>L</span>
          <span>LogiFlow</span>
        </Link>

        {state === "loading" && (
          <>
            <p className={styles.eyebrow}>Verifying your email</p>
            <h1>Please wait a moment.</h1>
            <p className={styles.copy}>
              We are confirming your email address and activating your account.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <p className={styles.eyebrow}>Verification complete</p>
            <h1>Your email has been verified successfully.</h1>
            <p className={styles.copy}>
              Your LogiFlow account is now active. You can sign in and start
              managing your logistics operation.
            </p>
            <Link className={styles.action} href="/">
              Continue to sign in
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <p className={styles.eyebrow}>Verification unavailable</p>
            <h1>We could not verify your email.</h1>
            <p className={styles.copy}>
              This verification link may be missing, expired, or already used.
              Request a new verification email or contact support.
            </p>
            <Link className={styles.action} href="/">
              Return to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
