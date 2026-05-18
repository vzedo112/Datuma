import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Download,
  Share2,
  RefreshCw,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import MetricCard from "../components/Dashboard/MetricCard";
import ChartPanel from "../components/Dashboard/ChartPanel";
import InsightPanel from "../components/Dashboard/InsightPanel";
import { useDashboard } from "../context/DashboardContext";
import { getDashboardById, listDashboards } from "../services/api";

export default function Dashboard() {
  const { dashboard, filename, rowCount, setResult } = useDashboard();
  const navigate = useNavigate();
  const { id } = useParams();
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Case 1: explicit /app/dashboard/:id — fetch that exact dashboard.
    if (id) {
      (async () => {
        try {
          setFetching(true);
          setFetchError(null);
          const data = await getDashboardById(id);
          if (!cancelled) setResult(data);
        } catch (err) {
          if (!cancelled) {
            setFetchError(
              err?.response?.data?.error || err?.message || "Failed to load dashboard."
            );
          }
        } finally {
          if (!cancelled) setFetching(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // Case 2: /app/dashboard with no session dashboard — try to load the
    // user's most recent saved dashboard.
    if (!dashboard) {
      (async () => {
        try {
          setFetching(true);
          setFetchError(null);
          const items = await listDashboards();
          if (cancelled) return;
          if (items.length === 0) {
            setFetching(false);
            return; // Empty state below will render.
          }
          const latest = await getDashboardById(items[0].id);
          if (!cancelled) setResult(latest);
        } catch {
          // Persistence unavailable / unauthenticated — drop to empty state silently.
        } finally {
          if (!cancelled) setFetching(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [id, dashboard, setResult]);

  if (fetching) {
    return (
      <div className="max-w-md mx-auto pt-24 text-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
        <p className="font-mono text-xs uppercase tracking-widest">Loading dashboard…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-lg mx-auto pt-12">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rose-900">Couldn't load this dashboard</p>
            <p className="text-sm text-rose-800 mt-1">{fetchError}</p>
            <Link
              to="/app/history"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-rose-900 hover:text-rose-950 underline underline-offset-4"
            >
              Back to history
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center">
        <h2 className="font-display text-3xl tracking-tight mb-3">
          No dashboard loaded
        </h2>
        <p className="text-muted-foreground mb-8">
          Upload a file to generate one, or pick one from history.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium"
          >
            New upload
          </Link>
          <Link
            to="/app/history"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-foreground/20 hover:bg-foreground/5 text-sm"
          >
            View history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            New upload
          </button>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
            {dashboard.title}
          </h1>
          {dashboard.primaryQuestion && (
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-widest text-brand mr-2">
                Q
              </span>
              {dashboard.primaryQuestion}
            </p>
          )}
          {(filename || rowCount) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
              {filename && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent">
                  <FileSpreadsheet className="w-3 h-3" />
                  {filename}
                </span>
              )}
              {rowCount && (
                <span className="px-2.5 py-1 rounded-md bg-accent">
                  {rowCount.toLocaleString()} rows
                </span>
              )}
              {dashboard.domain && (
                <span className="px-2.5 py-1 rounded-md bg-accent max-w-md truncate">
                  {dashboard.domain}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run
          </Link>
          <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {dashboard.metrics?.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboard.metrics.map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>
        </section>
      )}

      {dashboard.charts?.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard.charts.map((c, i) => (
              <ChartPanel key={i} chart={c} primary={i === 0} />
            ))}
          </div>
        </section>
      )}

      {dashboard.insights?.length > 0 && (
        <section>
          <InsightPanel insights={dashboard.insights} />
        </section>
      )}
    </div>
  );
}
