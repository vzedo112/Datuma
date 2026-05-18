import { useEffect, useRef, useState } from "react";
import { Share2, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { createShareLink, revokeShareLink } from "../../services/api";

export default function ShareMenu({ dashboardId, shareToken, onTokenChange }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  const handleCreate = async () => {
    if (!dashboardId) {
      setError("Save the dashboard first by uploading a file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { token } = await createShareLink(dashboardId);
      onTokenChange?.(token);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create link.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!dashboardId) return;
    setBusy(true);
    setError(null);
    try {
      await revokeShareLink(dashboardId);
      onTokenChange?.(null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to revoke link.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-20 rounded-lg border border-border bg-background shadow-lg p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Share this dashboard
          </p>

          {!dashboardId && (
            <p className="text-sm text-muted-foreground">
              This dashboard isn't saved yet. Sharing is available for dashboards in your history.
            </p>
          )}

          {dashboardId && !shareToken && (
            <>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Anyone with the link can view this dashboard. You can revoke it anytime.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                Create share link
              </button>
            </>
          )}

          {dashboardId && shareToken && (
            <>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-accent/40 px-2 py-1.5 mb-3">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 bg-transparent text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded hover:bg-foreground/10"
                  aria-label="Copy link"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={busy}
                className="text-xs text-muted-foreground hover:text-rose-700 underline underline-offset-4 disabled:opacity-60"
              >
                {busy ? "Revoking…" : "Revoke link"}
              </button>
            </>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
