import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  FileSpreadsheet,
  Database,
  Copy,
  CalendarClock,
  Layers,
  Sigma,
} from "lucide-react";
import { cn } from "../../lib/cn";

const SEVERITY = {
  ok: {
    label: "Looks clean",
    Icon: ShieldCheck,
    chipClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    borderClass: "border-emerald-200",
  },
  warn: {
    label: "Minor flags",
    Icon: AlertTriangle,
    chipClass: "bg-amber-50 text-amber-800 border-amber-200",
    borderClass: "border-amber-200",
  },
  critical: {
    label: "Worth a look",
    Icon: AlertCircle,
    chipClass: "bg-rose-50 text-rose-800 border-rose-200",
    borderClass: "border-rose-200",
  },
};

function hasFindings(q) {
  return (
    (q?.nullCounts?.length || 0) > 0 ||
    (q?.duplicateRows?.count || 0) > 0 ||
    (q?.dateFormats?.length || 0) > 0 ||
    (q?.mixedTypes?.length || 0) > 0 ||
    (q?.outliers?.length || 0) > 0
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-sm font-medium">{title}</h4>
        {count !== undefined && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function NullSection({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <Section icon={Database} title="Missing values" count={`${rows.length} column${rows.length === 1 ? "" : "s"}`}>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.column} className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs min-w-0 flex-1 truncate">{r.column}</span>
            <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden max-w-[160px]">
              <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, r.percentage)}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground shrink-0 w-24 text-right">
              {r.count.toLocaleString()} ({r.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DuplicateSection({ dup }) {
  if (!dup || dup.count === 0) return null;
  return (
    <Section icon={Copy} title="Duplicate rows" count={`${dup.count.toLocaleString()} row${dup.count === 1 ? "" : "s"}`}>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Identical rows appear more than once. This can over-count totals. Datuma does not de-duplicate for you — review and decide.
      </p>
    </Section>
  );
}

function DateFormatSection({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <Section icon={CalendarClock} title="Inconsistent date formats" count={`${rows.length} column${rows.length === 1 ? "" : "s"}`}>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.column} className="text-sm">
            <span className="font-mono text-xs">{r.column}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {r.formats.join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function MixedTypesSection({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <Section icon={Layers} title="Mixed-type columns" count={`${rows.length} column${rows.length === 1 ? "" : "s"}`}>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.column} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{r.column}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {r.types.join(" + ")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {r.samples?.map(({ type, examples }) =>
                examples.map((ex, i) => (
                  <span
                    key={`${type}-${i}`}
                    className="px-1.5 py-0.5 rounded bg-accent font-mono text-[10px]"
                    title={type}
                  >
                    {String(ex).slice(0, 24)}
                  </span>
                ))
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function OutliersSection({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <Section icon={Sigma} title="Outliers (>3σ from mean)" count={`${rows.length} column${rows.length === 1 ? "" : "s"}`}>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.column} className="text-sm flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-xs">{r.column}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {r.count.toLocaleString()} value{r.count === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-muted-foreground">
              e.g. {r.examples.slice(0, 3).map((v) => Number(v).toLocaleString()).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DatasetCard({ ds, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const q = ds.quality || {};
  const sev = SEVERITY[q.severity] || SEVERITY.ok;
  const hasAny = hasFindings(q);

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", sev.borderClass)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="p-2 rounded-md bg-accent shrink-0">
          <FileSpreadsheet className="w-4 h-4" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{ds.name}</p>
          <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
            {ds.filename} · {Number(ds.rowCount).toLocaleString()} rows
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium shrink-0",
            sev.chipClass
          )}
        >
          <sev.Icon className="w-3.5 h-3.5" />
          {sev.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-5 border-t border-border/60">
          {!hasAny ? (
            <p className="text-sm text-muted-foreground py-2">
              No quality flags detected in this file.
            </p>
          ) : (
            <>
              <NullSection rows={q.nullCounts} />
              <DuplicateSection dup={q.duplicateRows} />
              <DateFormatSection rows={q.dateFormats} />
              <MixedTypesSection rows={q.mixedTypes} />
              <OutliersSection rows={q.outliers} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DataQualityReport({ datasets, onBack, onProceed, generating }) {
  return (
    <div className="max-w-3xl mx-auto pt-2 pb-16">
      <div className="mb-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
          Pre-flight
        </span>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
          Data quality report
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Before we hand your files to Claude, here's what we noticed. Datuma does not
          modify your data — these checks are read-only.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {datasets.map((ds, i) => (
          <DatasetCard key={ds.filename + i} ds={ds} defaultOpen={datasets.length === 1} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-foreground/20 hover:bg-foreground/5 text-sm disabled:opacity-60"
        >
          Back to upload
        </button>
        <button
          type="button"
          onClick={onProceed}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate dashboard"}
        </button>
      </div>
    </div>
  );
}
