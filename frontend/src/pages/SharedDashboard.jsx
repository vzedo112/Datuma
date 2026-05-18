import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import DashboardView from "../components/Dashboard/DashboardView";
import { getSharedDashboard } from "../services/api";

export default function SharedDashboard() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSharedDashboard(token);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          const status = err?.response?.status;
          setError(
            status === 404
              ? "This share link doesn't exist or has been revoked."
              : err?.response?.data?.error || err?.message || "Failed to load dashboard."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">Dashboard unavailable</p>
              <p className="text-sm text-rose-800 mt-1">{error}</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Go to Datuma
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!data?.dashboard) return null;

  const header = (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-3"
    >
      Datuma
    </Link>
  );

  const actions = (
    <Link
      to="/"
      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors"
    >
      Create your own
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <DashboardView
        dashboard={data.dashboard}
        filename={data.filename}
        rowCount={data.rowCount}
        header={header}
        actions={actions}
      />
      <div className="max-w-[1400px] mx-auto mt-10 pt-6 border-t border-border text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Shared via{" "}
          <Link to="/" className="hover:text-foreground underline underline-offset-4">
            Datuma
          </Link>
        </p>
      </div>
    </div>
  );
}
