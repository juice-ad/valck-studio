import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  actions?: React.ReactNode;
}

export function AdminTable<T>({
  columns,
  data,
  loading,
  searchPlaceholder = "Zoeken...",
  searchFields = [],
  onRowClick,
  emptyMessage = "Geen resultaten.",
  pageSize = 25,
  actions,
}: AdminTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchFields.some((field) => {
        const val = (row as Record<string, unknown>)[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey] ?? "";
      const bVal = (b as Record<string, unknown>)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), "nl");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-border border-t-text animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="w-full rounded-[8px] border border-border-light bg-bg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-text transition-colors"
          />
        </div>
        {actions}
      </div>

      {/* Table */}
      <div className="rounded-[12px] bg-bg-white border border-border-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-light">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider ${col.sortable !== false ? "cursor-pointer select-none hover:text-text" : ""} ${col.className ?? ""}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable !== false && sortKey === col.key && (
                        sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-text-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr
                    key={(row as Record<string, unknown>).id as string ?? i}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-border-light last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-accent-soft/30" : ""}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-6 py-4 text-sm text-text ${col.className ?? ""}`}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-muted">
            {sorted.length} resultaten · pagina {page + 1} van {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-[6px] text-text-secondary hover:bg-accent-soft disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-[6px] text-text-secondary hover:bg-accent-soft disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
