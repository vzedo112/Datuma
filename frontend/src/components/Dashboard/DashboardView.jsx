import { FileSpreadsheet } from "lucide-react";
import MetricCard from "./MetricCard";
import ChartPanel from "./ChartPanel";
import InsightPanel from "./InsightPanel";

export default function DashboardView({ dashboard, filename, rowCount, header, actions }) {
  return (
    <div className="max-w-[1400px] mx-auto pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div className="min-w-0">
          {header}
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

        {actions && (
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            {actions}
          </div>
        )}
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
