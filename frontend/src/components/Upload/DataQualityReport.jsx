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
  Key,
  Link2,
  History as HistoryIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";

function formatRelative(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

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
    (q?.outliers?.length || 0) > 0 ||
    (q?.primaryKeyCandidates?.length || 0) > 0
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

function PKCandidatesSection({ rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <Section icon={Key} title="Likely identifier columns" count={`${rows.length} candidate${rows.length === 1 ? "" : "s"}`}>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
        Columns that look like unique IDs. Useful for spotting overlap between files or repeat uploads.
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {rows.map((r) => (
          <li
            key={r.column}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono",
              r.confidence === "high"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-accent text-foreground border border-border"
            )}
            title={`${(r.uniqueRatio * 100).toFixed(1)}% unique across ${r.nonNull.toLocaleString()} non-null rows`}
          >
            {r.column}
            <span className="text-muted-foreground/80">
              {(r.uniqueRatio * 100).toFixed(0)}%
            </span>
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
              <PKCandidatesSection rows={q.primaryKeyCandidates} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CrossFileBanner({ findings }) {
  if (!findings || findings.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <Link2 className="w-4 h-4 text-amber-700" />
        <h3 className="font-medium text-amber-900">Overlap between files</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-700 ml-auto">
          {findings.length} pair{findings.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-xs text-amber-900/80 leading-relaxed">
        Some rows appear in more than one of the files you uploaded. Datuma will keep
        them as separate datasets — duplicates are not removed. Review before generating.
      </p>
      <ul className="space-y-2">
        {findings.map((f, i) => (
          <li key={i} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              {f.between[0]}
            </span>
            <span className="text-amber-900/70">×</span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              {f.between[1]}
            </span>
            <span className="text-amber-900">
              {f.overlappingRows.toLocaleString()} shared row{f.overlappingRows === 1 ? "" : "s"}
              {typeof f.overlapPct === "number" ? ` · ${f.overlapPct}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CrossUploadBanner({ findings, parentDashboardId }) {
  if (!findings || findings.length === 0) return null;
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <HistoryIcon className="w-4 h-4 text-sky-700" />
        <h3 className="font-medium text-sky-900">
          {parentDashboardId ? "Update preview" : "Looks familiar"}
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-sky-700 ml-auto">
          {findings.length} match{findings.length === 1 ? "" : "es"}
        </span>
      </div>
      <p className="text-xs text-sky-900/80 leading-relaxed">
        {parentDashboardId
          ? "Datuma will append your new rows to the targeted dashboard, deduplicating exact matches. Nothing in the original revision will be overwritten."
          : "This upload overlaps with dashboards you've generated before. Datuma won't merge them automatically — generating now creates a new, independent dashboard."}
      </p>
      <ul className="space-y-2.5">
        {findings.map((f, i) => {
          const isTarget = parentDashboardId && f.priorDashboardId === parentDashboardId;
          return (
            <li key={i} className="text-sm">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium text-sky-900 truncate max-w-[260px]">
                  {f.priorDashboardName}
                </span>
                {isTarget && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-700 text-white text-[10px] font-mono uppercase tracking-widest">
                    Updating this
                  </span>
                )}
                <span className="font-mono text-[10px] uppercase tracking-widest text-sky-700">
                  {formatRelative(f.priorCreatedAt)}
                </span>
                <span className="ml-auto font-mono text-xs text-sky-900">
                  {f.matchPct}% sample match
                </span>
              </div>
              <p className="text-xs text-sky-900/80 mt-1 leading-relaxed">
                {f.matched} of {f.sampleSize} sampled rows from "{f.priorDataset}" appear in
                your "{f.currentDataset}" file.
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function DataQualityReport({
  datasets,
  crossFileFindings,
  crossUploadFindings,
  parentDashboardId,
  onBack,
  onProceed,
  generating,
}) {
  const hasOverlap =
    (crossFileFindings?.length || 0) > 0 || (crossUploadFindings?.length || 0) > 0;

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

      {hasOverlap && (
        <div className="space-y-3 mb-6">
          <CrossUploadBanner
            findings={crossUploadFindings}
            parentDashboardId={parentDashboardId}
          />
          <CrossFileBanner findings={crossFileFindings} />
        </div>
      )}

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
