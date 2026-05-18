import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import DashboardView from "../components/Dashboard/DashboardView";
import ShareMenu from "../components/Dashboard/ShareMenu";
import ExportMenu from "../components/Dashboard/ExportMenu";
import { useDashboard } from "../context/DashboardContext";
import { getDashboardById, listDashboards } from "../services/api";

export default function Dashboard() {
  const {
    dashboard,
    dashboardId,
    shareToken,
    setShareToken,
    filename,
    rowCount,
    persistenceWarning,
    setPersistenceWarning,
    setResult,
  } = useDashboard();
  const navigate = useNavigate();
  const { id } = useParams();
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const viewRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // Case 1: explicit /app/dashboard/:id — fetch that exact dashboard.
    if (id) {
      if (String(dashboardId) === String(id)) return;
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
            return;
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
  }, [id, dashboard, dashboardId, setResult]);

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

  const header = (
    <button
      type="button"
      onClick={() => navigate("/app")}
      className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-3"
    >
      <ArrowLeft className="w-3 h-3" />
      New upload
    </button>
  );

  const actions = (
    <>
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Re-run
      </Link>
      <ShareMenu
        dashboardId={dashboardId}
        shareToken={shareToken}
        onTokenChange={setShareToken}
      />
      <ExportMenu
        getNode={() => viewRef.current}
        filename={dashboard?.title || filename || "datuma-dashboard"}
      />
    </>
  );

  return (
    <>
      {persistenceWarning && (
        <div
          data-export-hide="true"
          className="max-w-[1400px] mx-auto mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed flex-1">
            {persistenceWarning}
          </p>
          <button
            type="button"
            onClick={() => setPersistenceWarning(null)}
            className="p-1 -m-1 text-amber-700 hover:text-amber-900"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <DashboardView
        dashboard={dashboard}
        filename={filename}
        rowCount={rowCount}
        header={header}
        actions={actions}
        viewRef={viewRef}
      />
    </>
  );
}
