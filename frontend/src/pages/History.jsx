import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  History as HistoryIcon,
} from "lucide-react";
import { listDashboards, getDashboardById } from "../services/api";
import { useDashboard } from "../context/DashboardContext";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setResult } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await listDashboards();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.error ||
            (err?.code === "ERR_NETWORK"
              ? "Can't reach the server."
              : err?.message) ||
            "Failed to load history.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDashboard = async (id) => {
    try {
      const data = await getDashboardById(id);
      setResult(data);
      navigate(`/app/dashboard/${id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open dashboard.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
            History
          </span>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
            Past dashboards
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Every spreadsheet you've turned into a brief — newest first. Click any row to
            re-open it.
          </p>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          New upload
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rose-900">Couldn't load history</p>
            <p className="text-sm text-rose-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 bg-card/40 p-10 lg:p-14 text-center">
          <div className="inline-flex p-4 rounded-xl border border-border bg-background mb-6">
            <HistoryIcon className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl lg:text-3xl tracking-tight mb-3">
            No dashboards yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Upload your first spreadsheet and it'll show up here, along with every one
            after.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Upload your first file
          </Link>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openDashboard(item.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-accent/50 transition-colors group"
              >
                <div className="p-2 rounded-md bg-accent shrink-0">
                  <FileSpreadsheet className="w-4 h-4" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {item.title || item.filename}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.filename} · {Number(item.row_count).toLocaleString()} rows
                    {item.domain ? ` · ${item.domain}` : ""}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground hidden sm:block">
                  {formatDate(item.created_at)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
