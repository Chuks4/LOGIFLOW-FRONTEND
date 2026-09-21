import styles from "./Loading.module.css";

type LoadingProps = {
  label?: string;
};

export default function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div aria-live="polite" className={styles.loading} role="status">
      <span aria-hidden="true" className={styles.spinner} />
      <span>{label}</span>
    </div>
  );
}
