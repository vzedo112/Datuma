import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileImage,
  FileText,
  FileSpreadsheet,
  FileJson,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  exportPDF,
  exportPNG,
  exportCSV,
  exportJSON,
} from "../../lib/exportDashboard";

const FORMATS = {
  pdf: { label: "Export as PDF", icon: FileText, kind: "image" },
  png: { label: "Export as PNG", icon: FileImage, kind: "image" },
  csv: { label: "Export data as CSV", icon: FileSpreadsheet, kind: "data" },
  json: { label: "Export raw JSON", icon: FileJson, kind: "data" },
};

export default function ExportMenu({ getNode, dashboard, filename }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // format key | null
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { format } | null
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const run = async (kind) => {
    setError(null);
    setBusy(kind);
    setOpen(false);

    // Image exports need the rendered DOM; data exports just need the dashboard.
    const isImage = FORMATS[kind].kind === "image";
    const node = isImage ? getNode?.() : null;
    if (isImage && !node) {
      setError("Nothing to capture yet — wait for the dashboard to render.");
      setOpen(true);
      setBusy(null);
      return;
    }
    if (!isImage && !dashboard) {
      setError("Nothing to export yet.");
      setOpen(true);
      setBusy(null);
      return;
    }

    // Give the menu a tick to close so it doesn't appear in the capture.
    await new Promise((r) => setTimeout(r, 50));

    try {
      if (kind === "pdf") await exportPDF(node, filename);
      else if (kind === "png") await exportPNG(node, filename);
      else if (kind === "csv") exportCSV(dashboard, filename);
      else if (kind === "json") exportJSON(dashboard, filename);
      setToast({ format: kind });
    } catch (err) {
      setError(err?.message || "Export failed.");
      setOpen(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors disabled:opacity-70"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 z-20 rounded-lg border border-border bg-background shadow-lg py-1">
          <MenuLabel>Picture</MenuLabel>
          <FormatItem
            kind="pdf"
            disabled={busy !== null}
            onSelect={() => run("pdf")}
          />
          <FormatItem
            kind="png"
            disabled={busy !== null}
            onSelect={() => run("png")}
          />

          <div className="my-1 border-t border-border" />

          <MenuLabel>Data</MenuLabel>
          <FormatItem
            kind="csv"
            disabled={busy !== null || !dashboard}
            onSelect={() => run("csv")}
            hint="Metrics + chart data, one row per point."
          />
          <FormatItem
            kind="json"
            disabled={busy !== null || !dashboard}
            onSelect={() => run("json")}
            hint="Full dashboard structure for archival."
          />

          {error && (
            <div className="px-3 pt-2 pb-2.5 flex items-start gap-2 text-xs text-rose-800 border-t border-border mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {toast && <SuccessToast format={toast.format} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function MenuLabel({ children }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

function FormatItem({ kind, disabled, onSelect, hint }) {
  const { label, icon: Icon } = FORMATS[kind];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full flex items-start gap-2.5 px-3 py-2 text-sm text-left hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
    >
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block">{label}</span>
        {hint && (
          <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

function SuccessToast({ format, onDismiss }) {
  const { label } = FORMATS[format] ?? { label: "Exported" };
  return (
    <div
      role="status"
      className="absolute right-0 top-full mt-2 z-30 inline-flex items-center gap-2 rounded-md bg-foreground text-background text-xs px-3 py-2 shadow-lg animate-fade-in"
    >
      <Check className="w-3.5 h-3.5" />
      <span>{label.replace("Export ", "Saved ")}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 text-background/70 hover:text-background"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
