"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { ErrorState, Skeleton } from "../ui/display";

/** Search box, status filter, table and pager shared by admin list pages. */
export function AdminTable<T>({
  query,
  statuses,
  filters,
  setFilters,
  columns,
  row,
  rowKey,
}: {
  query: { data?: { items: T[]; pagination: { page: number; totalPages: number; total: number } }; isPending: boolean; isError: boolean; refetch: () => void };
  statuses: Array<{ value: string; label: string }>;
  filters: { q?: string; status?: string; page?: number };
  setFilters: (f: { q?: string; status?: string; page?: number }) => void;
  columns: string[];
  row: (item: T) => React.ReactNode;
  rowKey: (item: T) => string;
}) {
  const [q, setQ] = useState(filters.q ?? "");
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ ...filters, q: q.trim() || undefined, page: 1 });
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="admin-search" className="sr-only">
            Search
          </label>
          <input id="admin-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-10 w-full rounded-control border border-line-strong bg-surface pl-9 pr-3 text-sm outline-none focus:border-navy" />
        </form>
        <label htmlFor="admin-status" className="sr-only">
          Status
        </label>
        <select
          id="admin-status"
          value={filters.status ?? ""}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
          className="h-10 rounded-control border border-line-strong bg-surface px-3 text-sm"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : query.isError || !query.data ? (
        <ErrorState message="We couldn't load this list." onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  {columns.map((c) => (
                    <th key={c} className="px-4 py-2.5 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {query.data.items.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                      Nothing matches.
                    </td>
                  </tr>
                ) : (
                  query.data.items.map((item) => <tr key={rowKey(item)}>{row(item)}</tr>)
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="tnum">{query.data.pagination.total} total</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) - 1 })}>
                Previous
              </Button>
              <span className="tnum">
                {query.data.pagination.page} / {query.data.pagination.totalPages}
              </span>
              <Button variant="secondary" size="sm" disabled={(filters.page ?? 1) >= query.data.pagination.totalPages} onClick={() => setFilters({ ...filters, page: (filters.page ?? 1) + 1 })}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
