import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, Save, Sparkles } from "lucide-react";
import ChartPanel from "./ChartPanel";
import {
  CHART_TYPES,
  getChartTypeMeta,
  columnsByKind,
  categorizeColumns,
} from "../../lib/chartTypes";

// Smallest possible synthetic data so the preview renders something while the
// user is mid-configuration. Real aggregation runs server-side on save.
function previewData(meta) {
  if (meta?.key === "scatter") {
    return Array.from({ length: 12 }, (_, i) => ({
      x: i * 5 + Math.random() * 3,
      y: i * 3 + Math.random() * 5,
    }));
  }
  if (meta?.multiSeries) {
    return [
      { x: "Jan", "Series A": 120, "Series B": 80, "Series C": 60 },
      { x: "Feb", "Series A": 140, "Series B": 95, "Series C": 70 },
      { x: "Mar", "Series A": 160, "Series B": 110, "Series C": 85 },
      { x: "Apr", "Series A": 180, "Series B": 130, "Series C": 95 },
      { x: "May", "Series A": 200, "Series B": 150, "Series C": 110 },
    ];
  }
  return [
    { x: "A", y: 120 },
    { x: "B", y: 95 },
    { x: "C", y: 78 },
    { x: "D", y: 60 },
    { x: "E", y: 45 },
  ];
}

const BUCKETS = ["none", "day", "week", "month", "quarter", "year"];

export default function ChartPicker({
  datasets, // [{ name, schema, stats, rowCount }]
  initialChart, // chart object when editing, null when adding
  onSave,
  onClose,
}) {
  const isEdit = Boolean(initialChart);
  const [step, setStep] = useState(isEdit ? "configure" : "pick-type");
  const [draft, setDraft] = useState(
    initialChart
      ? { ...initialChart }
      : {
          type: "bar",
          title: "",
          explanation: "",
          aggregation: "sum",
          bucket: "none",
          datasetName: datasets[0]?.name || null,
        }
  );

  const meta = getChartTypeMeta(draft.type);
  const dataset =
    datasets.find((d) => d.name === draft.datasetName) || datasets[0];

  // When the user changes chart type, axes / groupBy may no longer be valid.
  // Auto-reset them so the form never sits in an impossible state.
  useEffect(() => {
    if (!meta || !dataset) return;
    setDraft((d) => {
      const next = { ...d };
      const xOptions = columnsByKind(dataset, meta.xKinds);
      const numericOptions = columnsByKind(dataset, ["numeric"]);
      const categoricalOptions = columnsByKind(dataset, ["categorical"]);

      if (!xOptions.includes(next.xAxis)) {
        next.xAxis = xOptions[0] || null;
      }
      const needsY = next.aggregation !== "count";
      if (needsY && !numericOptions.includes(next.yAxis)) {
        next.yAxis = numericOptions[0] || null;
      } else if (!needsY) {
        next.yAxis = null;
      }
      if (!meta.aggregations.includes(next.aggregation)) {
        next.aggregation = meta.aggregations[0];
      }
      if (meta.multiSeries) {
        if (!categoricalOptions.includes(next.groupBy)) {
          next.groupBy = categoricalOptions.find((c) => c !== next.xAxis) || null;
        }
      } else {
        next.groupBy = undefined;
      }
      // Bucket only when xAxis is a date and aggregation ≠ none.
      const xIsDate = dataset.stats?.[next.xAxis]?.type === "date";
      if (xIsDate && next.aggregation !== "none") {
        if (!BUCKETS.includes(next.bucket) || next.bucket === "none") {
          next.bucket = "month";
        }
      } else {
        next.bucket = "none";
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.type, draft.datasetName]);

  const valid = useMemo(() => validate(draft, dataset, meta), [draft, dataset, meta]);

  const handleSave = () => {
    if (!valid.ok) return;
    const clean = {
      ...draft,
      title: (draft.title || "").trim() || autoTitle(draft, dataset),
      explanation:
        (draft.explanation || "").trim() ||
        "Added in the dashboard editor — data points come from your uploaded dataset.",
    };
    // Strip undefined keys to avoid sending noise to the validator.
    Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
    onSave(clean);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {step === "configure" && !isEdit && (
              <button
                type="button"
                onClick={() => setStep("pick-type")}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                aria-label="Back to type picker"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {isEdit ? "Edit chart" : step === "pick-type" ? "Add a chart" : "Configure"}
              </p>
              <h2 className="font-display text-2xl tracking-tight">
                {step === "pick-type" ? "Pick a chart type" : meta?.name || "Chart"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {step === "pick-type" ? (
            <TypePicker
              onPick={(t) => {
                setDraft((d) => ({ ...d, type: t }));
                setStep("configure");
              }}
            />
          ) : (
            <Configure
              draft={draft}
              setDraft={setDraft}
              dataset={dataset}
              datasets={datasets}
              meta={meta}
              valid={valid}
            />
          )}
        </div>

        {step === "configure" && (
          <footer className="border-t border-border px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {valid.ok ? (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-brand" />
                  Ready to save — server re-aggregates with your real data.
                </span>
              ) : (
                <span className="text-rose-700">{valid.error}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-md border border-border text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!valid.ok}
                className="h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isEdit ? "Save changes" : "Add chart"}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

// --- Step 1: type picker ---

function TypePicker({ onPick }) {
  const families = {
    "time-series": CHART_TYPES.filter((t) => t.family === "time-series"),
    categorical: CHART_TYPES.filter((t) => t.family === "categorical"),
    proportion: CHART_TYPES.filter((t) => t.family === "proportion"),
    correlation: CHART_TYPES.filter((t) => t.family === "correlation"),
  };
  return (
    <div className="p-6 space-y-8">
      {Object.entries(families).map(([family, items]) => (
        <section key={family}>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            {family.replace("-", " ")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onPick(t.key)}
                  className="text-left rounded-xl border border-border bg-card p-4 hover:border-foreground/40 hover:bg-accent/40 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <Icon className="w-4 h-4" strokeWidth={1.6} />
                    </div>
                    {t.multiSeries && (
                      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-accent rounded text-muted-foreground">
                        Multi
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {t.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// --- Step 2: configure ---

function Configure({ draft, setDraft, dataset, datasets, meta, valid }) {
  const cats = categorizeColumns(dataset || {});
  const xOptions = columnsByKind(dataset, meta?.xKinds || []);
  const yOptions = columnsByKind(dataset, ["numeric"]);
  const groupOptions = columnsByKind(dataset, ["categorical"]).filter(
    (c) => c !== draft.xAxis
  );

  const xIsDate = dataset?.stats?.[draft.xAxis]?.type === "date";
  const showBucket = xIsDate && draft.aggregation !== "none";
  const needsY = draft.aggregation !== "count";

  // Preview chart — synthetic data when needed so users see *something*.
  const preview = useMemo(() => {
    return {
      ...draft,
      data: previewData(meta),
      series: meta?.multiSeries ? ["Series A", "Series B", "Series C"] : undefined,
    };
  }, [draft, meta]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-0 min-h-[480px]">
      {/* Left: live preview */}
      <div className="p-6 bg-accent/20 border-r border-border min-h-[320px]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Preview · synthetic data
        </p>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="h-72 lg:h-96">
            {valid.ok ? (
              <ChartPanel
                chart={{
                  ...preview,
                  title: draft.title || "Untitled chart",
                  explanation: null,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center max-w-xs mx-auto leading-relaxed">
                {valid.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: config form */}
      <div className="p-6 space-y-5">
        <Field label="Title">
          <input
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={autoTitle(draft, dataset)}
            maxLength={120}
            className="w-full bg-card border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:border-foreground"
          />
        </Field>

        {datasets.length > 1 && (
          <Field label="Dataset">
            <Select
              value={draft.datasetName}
              onChange={(v) => setDraft({ ...draft, datasetName: v })}
              options={datasets.map((d) => ({ value: d.name, label: d.name }))}
            />
          </Field>
        )}

        <Field label="X-axis" hint={hintForKinds(meta?.xKinds)}>
          <Select
            value={draft.xAxis || ""}
            onChange={(v) => setDraft({ ...draft, xAxis: v })}
            options={xOptions.map((c) => ({
              value: c,
              label: `${c}  ·  ${cats.date.includes(c) ? "date" : cats.numeric.includes(c) ? "numeric" : "categorical"}`,
            }))}
            placeholder="Pick an X column"
          />
        </Field>

        <Field label="Aggregation">
          <Select
            value={draft.aggregation}
            onChange={(v) => setDraft({ ...draft, aggregation: v })}
            options={(meta?.aggregations || []).map((a) => ({
              value: a,
              label: a,
            }))}
          />
        </Field>

        {needsY && (
          <Field
            label="Y-axis"
            hint={meta?.key === "scatter" ? "Numeric column (paired with X)" : "Numeric column to aggregate"}
          >
            <Select
              value={draft.yAxis || ""}
              onChange={(v) => setDraft({ ...draft, yAxis: v })}
              options={yOptions.map((c) => ({ value: c, label: c }))}
              placeholder="Pick a Y column"
            />
          </Field>
        )}

        {meta?.multiSeries && (
          <Field label="Group by" hint="Categorical column → one series per value">
            <Select
              value={draft.groupBy || ""}
              onChange={(v) => setDraft({ ...draft, groupBy: v })}
              options={groupOptions.map((c) => ({ value: c, label: c }))}
              placeholder="Pick a category column"
            />
          </Field>
        )}

        {showBucket && (
          <Field label="Bucket">
            <Select
              value={draft.bucket}
              onChange={(v) => setDraft({ ...draft, bucket: v })}
              options={BUCKETS.filter((b) => b !== "none").map((b) => ({
                value: b,
                label: b,
              }))}
            />
          </Field>
        )}

        <Field label="Explanation" hint="Shown beneath the chart on the dashboard">
          <textarea
            value={draft.explanation || ""}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            placeholder="Why this matters…"
            rows={2}
            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:border-foreground"
          />
        </Field>
      </div>
    </div>
  );
}

// --- form atoms ---

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full bg-card border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:border-foreground"
    >
      {!value && <option value="">{placeholder ?? "Pick one"}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// --- helpers ---

function hintForKinds(kinds = []) {
  if (kinds.length === 0) return null;
  return `Accepts: ${kinds.join(" or ")} column`;
}

function autoTitle(draft, dataset) {
  if (!draft.xAxis) return "Untitled chart";
  const y = draft.aggregation === "count" ? "count" : draft.yAxis || "value";
  const grp = draft.groupBy ? ` by ${draft.groupBy}` : "";
  return `${y} by ${draft.xAxis}${grp}`;
}

function validate(draft, dataset, meta) {
  if (!meta) return { ok: false, error: "Pick a chart type." };
  if (!dataset) return { ok: false, error: "Pick a dataset." };
  if (!draft.xAxis) return { ok: false, error: "Pick an X-axis column." };
  if (draft.aggregation !== "count" && !draft.yAxis) {
    return { ok: false, error: "Pick a Y-axis column." };
  }
  if (meta.multiSeries && !draft.groupBy) {
    return { ok: false, error: "Multi-series charts need a Group-by column." };
  }
  if (meta.multiSeries && draft.aggregation === "none") {
    return { ok: false, error: "Multi-series charts can't use 'none' aggregation." };
  }
  if (meta.key === "scatter" && draft.aggregation !== "none") {
    return { ok: false, error: "Scatter requires aggregation 'none'." };
  }
  const xType = dataset?.stats?.[draft.xAxis]?.type;
  if (xType === "date" && draft.aggregation !== "none" && draft.bucket === "none") {
    return { ok: false, error: "Date X-axis needs a bucket (day/week/month/…)." };
  }
  return { ok: true };
}
