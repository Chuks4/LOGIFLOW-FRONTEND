import styles from "./Pagination.module.css";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const page = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <span>
        Page {page} of {lastPage}
      </span>
      <div className={styles.controls}>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
