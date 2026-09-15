import styles from "./dashboard.module.css";

const stats = [
  { label: "Active shipments", value: "—", note: "Visible with shipments:read" },
  { label: "In transit", value: "—", note: "Live updates from your workspace" },
  { label: "Delivered this month", value: "—", note: "Visible with reports:read" },
];

export default function DashboardPage() {
  return (
    <section className={styles.dashboard}>
      <div className={styles.welcome}>
        <p className={styles.kicker}>Overview</p>
        <h2>Your operations at a glance.</h2>
        <p>Only data covered by your role permissions appears in this workspace.</p>
      </div>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <article className={styles.card} key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.note}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
