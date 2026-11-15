import "../styles/LibraryPagination.css";

export default function LibraryPagination({
  page,
  pageSize,
  pageCount,
  totalItems,
  goToPage,
  label = "items",
  disabled = false,
}) {
  if (pageCount <= 1) return null;

  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));

  const pages = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPage + index,
  );

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav className="library-pagination" aria-label={`${label} pagination`}>
      <p className="library-pagination-summary" role="status">
        <strong>
          {firstItem}–{lastItem}
        </strong>
        {" of "}
        {totalItems} {label}
      </p>

      <div className="library-pagination-controls">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={disabled || page === 1}
          aria-label="Previous page"
        >
          ←
        </button>

        {pages.map((number) => (
          <button
            key={number}
            type="button"
            aria-label={`Page ${number}`}
            aria-current={number === page ? "page" : undefined}
            onClick={() => goToPage(number)}
            disabled={disabled}
          >
            {number}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={disabled || page === pageCount}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </nav>
  );
}
