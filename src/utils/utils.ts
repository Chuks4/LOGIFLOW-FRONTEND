export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function search(
  value: string | null,
  page: number,
  setKeyword: (value: string | null) => void,
  setPage: (page: number) => void,
) {
  setKeyword(value);
  setPage(page);
}
