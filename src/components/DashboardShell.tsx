"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { can, roleLabels, visibleNavigation } from "@/lib/rbac";
import { readSession, type Session } from "@/lib/session";

import {
  logout,
  refreshAccessToken,
  tokenExpiresAt,
} from "@/services/axios/auth.service";

import styles from "./DashboardShell.module.css";

export default function DashboardShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const storedSession = readSession();

    if (!storedSession) {
      router.replace("/");
      return;
    }

    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session) return;

    if (tokenExpiresAt(session.accessToken) * 1000 <= Date.now()) {
      refreshAccessToken().catch(() => {
        router.replace("/");
      });
    }
  }, [session, router]);

  if (!session) return null;

  const items = visibleNavigation(session.permissions);

  async function signOut() {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/dashboard">
          <span className={styles.brandMark}>L</span>
          <span>LogiFlow</span>
        </Link>
        <p className={styles.menuLabel}>Dashboard</p>
        <nav className={styles.nav} aria-label="Dashboard navigation">
          {items.map((item) => (
            <Link
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className={styles.signOut} onClick={signOut} type="button">
          Sign out
        </button>
      </aside>
      <main className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Your dashboard</p>
            <h1>Welcome back!</h1>
          </div>
          <div className={styles.user}>
            <span className={styles.avatar}>
              {roleLabels[session.userType]}
            </span>
            <span>
              {roleLabels[session.userType].toUpperCase().slice(0, 3)}
            </span>
          </div>
        </header>
        {can(session.permissions, "dashboard", "read") ? (
          children
        ) : (
          <section className={styles.denied}>
            <p className={styles.kicker}>Access restricted</p>
            <h2>You don&apos;t have access to this workspace.</h2>
            <p>Ask an administrator to grant the dashboard:read permission.</p>
          </section>
        )}
      </main>
    </div>
  );
}
