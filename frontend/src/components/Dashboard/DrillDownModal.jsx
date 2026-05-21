import { useEffect, useMemo, useState } from "react";
import { X, Download, Search } from "lucide-react";

const MAX_ROWS_RENDERED = 200;

function toCsv(rows, columns) {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

// `filter` is { column, value } when the user clicked a chart point — narrows
// rows to that bucket. If null, shows the whole dataset.
export default function DrillDownModal({ open, onClose, datasetName, rows, columns, filter, title }) {
  const [query, setQuery] = useState("");

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset search when the source changes.
  useEffect(() => {
    setQuery("");
  }, [datasetName, filter?.column, filter?.value]);

  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    let out = rows;
    if (filter && filter.column) {
      out = out.filter((r) => String(r[filter.column]) === String(filter.value));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) =>
        columns.some((c) => String(r[c] ?? "").toLowerCase().includes(q))
      );
    }
    return out;
  }, [rows, columns, filter, query]);

  const visibleRows = filteredRows.slice(0, MAX_ROWS_RENDERED);

  const downloadCsv = () => {
    const csv = toCsv(filteredRows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = filter
      ? `${datasetName}-${filter.column}-${filter.value}`
      : datasetName;
    a.href = url;
    a.download = `${slug}-${stamp}.csv`
      .replace(/[^a-z0-9._-]/gi, "-")
      .toLowerCase();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-5xl max-h-[92vh] bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-border flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Source rows · {datasetName}
            </p>
            <h2 className="font-display text-lg sm:text-xl tracking-tight truncate">
              {title}
            </h2>
            {filter && (
              <p className="mt-1 text-xs text-muted-foreground">
                Filtered to{" "}
                <span className="font-mono">
                  {filter.column} = {String(filter.value)}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 sm:px-6 py-3 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rows…"
              className="w-full pl-9 pr-3 h-9 rounded-md border border-border bg-card text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">
              {filteredRows.length.toLocaleString()} row
              {filteredRows.length === 1 ? "" : "s"}
              {filteredRows.length > MAX_ROWS_RENDERED && (
                <> · showing first {MAX_ROWS_RENDERED}</>
              )}
            </span>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border text-sm hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {visibleRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No rows match.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 whitespace-nowrap"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/60 hover:bg-accent/40"
                  >
                    {columns.map((c) => (
                      <td
                        key={c}
                        className="px-3 py-2 whitespace-nowrap max-w-xs truncate"
                        title={String(r[c] ?? "")}
                      >
                        {r[c] === null || r[c] === undefined ? (
                          <span className="text-muted-foreground/60 italic">
                            null
                          </span>
                        ) : (
                          String(r[c])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
