import { useEffect, useRef, useState } from "react";
import { Download, FileImage, FileText, Loader2, AlertCircle } from "lucide-react";
import { exportPDF, exportPNG } from "../../lib/exportDashboard";

export default function ExportMenu({ getNode, filename }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null); // 'pdf' | 'png' | null
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const run = async (kind) => {
    const node = getNode?.();
    if (!node) {
      setError("Nothing to export yet.");
      return;
    }
    setBusy(kind);
    setError(null);
    setOpen(false);
    
    // Give React a tick to close the menu in the DOM, so it definitely
    // doesn't cause any layout shift/clipping bugs during capture.
    await new Promise((r) => setTimeout(r, 50));

    try {
      if (kind === "pdf") await exportPDF(node, filename);
      else await exportPNG(node, filename);
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
        <div className="absolute right-0 mt-2 w-56 z-20 rounded-lg border border-border bg-background shadow-lg py-1">
          <button
            type="button"
            onClick={() => run("pdf")}
            disabled={busy !== null}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-accent disabled:opacity-60"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1">Export as PDF</span>
          </button>
          <button
            type="button"
            onClick={() => run("png")}
            disabled={busy !== null}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-accent disabled:opacity-60"
          >
            <FileImage className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1">Export as PNG</span>
          </button>

          {error && (
            <div className="px-3 pt-2 pb-2.5 flex items-start gap-2 text-xs text-rose-800 border-t border-border mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
