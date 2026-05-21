import { useMemo, useState } from "react";
import { FileSpreadsheet, Layers } from "lucide-react";
import MetricCard from "./MetricCard";
import ChartPanel from "./ChartPanel";
import InsightPanel from "./InsightPanel";
import DrillDownModal from "./DrillDownModal";

function formatDatasetTag(name, multi) {
  if (!multi) return null;
  if (!name) return null;
  if (name === "all") return "All datasets";
  if (name === "comparison") return "Comparison";
  return name;
}

// Drill-down only works when the dashboard carries source rows
// (analysisContext.datasets[].rows). Public share strips this for privacy,
// so the click handlers should no-op there.
function buildRowsIndex(dashboard) {
  const ctx = dashboard?.analysisContext?.datasets;
  if (!Array.isArray(ctx)) return null;
  const map = {};
  for (const d of ctx) {
    if (Array.isArray(d.rows) && d.rows.length > 0) {
      map[d.name] = {
        rows: d.rows,
        columns: (d.schema ?? []).map((c) => c.name),
      };
    }
  }
  return Object.keys(map).length > 0 ? map : null;
}

export default function DashboardView({ dashboard, filename, rowCount, header, actions, viewRef }) {
  const datasets = dashboard?.datasets ?? [];
  const multi = datasets.length > 1;

  const rowsIndex = useMemo(() => buildRowsIndex(dashboard), [dashboard]);
  const [drill, setDrill] = useState(null); // { datasetName, filter, title }

  const taggedInsights = (dashboard.insights ?? []).map((ins) => ({
    ...ins,
    datasetTag: formatDatasetTag(ins.datasetName, multi),
  }));

  // Resolve which dataset a metric/chart belongs to. Falls back to the only
  // available dataset for single-file dashboards where datasetName may be unset.
  const resolveDataset = (datasetName) => {
    if (!rowsIndex) return null;
    if (datasetName && rowsIndex[datasetName]) return datasetName;
    const keys = Object.keys(rowsIndex);
    return keys.length === 1 ? keys[0] : null;
  };

  const openMetricDrill = (metric) => {
    const ds = resolveDataset(metric.datasetName);
    if (!ds) return;
    setDrill({ datasetName: ds, filter: null, title: metric.label });
  };

  const openChartDrill = (chart, point) => {
    const ds = resolveDataset(chart.datasetName);
    if (!ds || !chart.xAxis) return;
    setDrill({
      datasetName: ds,
      filter: { column: chart.xAxis, value: point.x },
      title: `${chart.title} — ${point.x}`,
    });
  };

  return (
    <div ref={viewRef} className="max-w-[1400px] mx-auto pb-16">
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

          {datasets.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
              {multi && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-foreground text-background uppercase tracking-widest text-[10px]">
                  <Layers className="w-3 h-3" />
                  {datasets.length} datasets
                </span>
              )}
              {datasets.map((d) => (
                <span
                  key={d.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent max-w-xs"
                  title={`${d.filename} · ${Number(d.rowCount).toLocaleString()} rows`}
                >
                  <FileSpreadsheet className="w-3 h-3 shrink-0" />
                  <span className="truncate">{d.name}</span>
                  <span className="text-muted-foreground/80 shrink-0">
                    · {Number(d.rowCount).toLocaleString()}
                  </span>
                </span>
              ))}
              {dashboard.domain && (
                <span className="px-2.5 py-1 rounded-md bg-accent max-w-md truncate">
                  {dashboard.domain}
                </span>
              )}
            </div>
          ) : (
            (filename || rowCount) && (
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
            )
          )}
        </div>

        {actions && (
          <div
            data-export-hide="true"
            className="flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            {actions}
          </div>
        )}
      </div>

      {dashboard.metrics?.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboard.metrics.map((m, i) => (
              <MetricCard
                key={i}
                {...m}
                datasetTag={formatDatasetTag(m.datasetName, multi)}
                onDrillDown={
                  rowsIndex && resolveDataset(m.datasetName)
                    ? () => openMetricDrill(m)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {dashboard.charts?.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard.charts.map((c, i) => (
              <ChartPanel
                key={i}
                chart={c}
                primary={i === 0}
                datasetTag={formatDatasetTag(c.datasetName, multi)}
                onPointClick={
                  rowsIndex && resolveDataset(c.datasetName)
                    ? (point) => openChartDrill(c, point)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {taggedInsights.length > 0 && (
        <section>
          <InsightPanel insights={taggedInsights} />
        </section>
      )}

      {drill && rowsIndex?.[drill.datasetName] && (
        <DrillDownModal
          open={Boolean(drill)}
          onClose={() => setDrill(null)}
          datasetName={drill.datasetName}
          rows={rowsIndex[drill.datasetName].rows}
          columns={rowsIndex[drill.datasetName].columns}
          filter={drill.filter}
          title={drill.title}
        />
      )}
    </div>
  );
}
