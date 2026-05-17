import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Share2, RefreshCw, FileSpreadsheet, ArrowLeft } from "lucide-react";
import MetricCard from "../components/Dashboard/MetricCard";
import ChartPanel from "../components/Dashboard/ChartPanel";
import InsightPanel from "../components/Dashboard/InsightPanel";
import { useDashboard } from "../context/DashboardContext";
import mockDashboard from "../services/mockDashboard";

export default function Dashboard() {
  const { dashboard, filename, rowCount, setResult } = useDashboard();
  const navigate = useNavigate();

  // Convenience: if the user navigates directly to /app/dashboard
  // without uploading, seed with mock data so the design is testable.
  useEffect(() => {
    if (!dashboard) setResult(mockDashboard);
  }, [dashboard, setResult]);

  if (!dashboard) return null;

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

        <div className="flex flex-wrap items-center gap-2">
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
