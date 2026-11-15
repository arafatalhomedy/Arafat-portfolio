import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function useLibraryPagination(
  items,
  { minimumCardWidth = 280, resetKey = "" } = {},
) {
  const sectionRef = useRef(null);

  const [columns, setColumns] = useState(1);
  const [selection, setSelection] = useState({
    key: "",
    page: 1,
  });

  useLayoutEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    function measure(width) {
      const gap = 22;

      setColumns(
        Math.max(1, Math.floor((width + gap) / (minimumCardWidth + gap))),
      );
    }

    measure(element.clientWidth);

    const observer = new ResizeObserver(([entry]) => {
      measure(entry.contentRect.width);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [minimumCardWidth]);

  const pageSize = columns * 2;
  const key = JSON.stringify([resetKey, pageSize]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  const page = selection.key === key ? Math.min(selection.page, pageCount) : 1;

  // Reset after searching, filtering, or changing the column count.
  // Also correct the current page after deleting its last item.
  useEffect(() => {
    setSelection((current) => {
      const nextPage =
        current.key === key ? Math.min(current.page, pageCount) : 1;

      if (current.key === key && current.page === nextPage) {
        return current;
      }

      return { key, page: nextPage };
    });
  }, [key, pageCount]);

  function goToPage(nextPage) {
    setSelection({
      key,
      page: Math.max(1, Math.min(nextPage, pageCount)),
    });
  }

  return {
    sectionRef,
    page,
    pageSize,
    pageCount,
    totalItems: items.length,
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    goToPage,
  };
}
