import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertCircle,
  History as HistoryIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  listDashboards,
  getDashboardById,
  renameDashboard,
  deleteDashboard,
} from "../services/api";
import { useDashboard } from "../context/DashboardContext";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(item) {
  return item.name || item.title || item.filename;
}

function RowMenu({ onRename, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="p-2 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg border border-border bg-background shadow-md py-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onUpdate();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Update with new data
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onRename();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-rose-50 text-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ item, revisionLabel, onOpen, onUpdate, onRenamed, onDeleted, onError }) {
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(displayName(item));

  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const saveRename = async () => {
    const trimmed = draft.trim().slice(0, 120);
    if (trimmed === displayName(item)) {
      setRenaming(false);
      return;
    }
    setBusy(true);
    try {
      await renameDashboard(item.id, trimmed);
      onRenamed(item.id, trimmed);
      setRenaming(false);
    } catch (err) {
      onError(err?.response?.data?.error || err?.message || "Couldn't rename.");
    } finally {
      setBusy(false);
    }
  };

  const cancelRename = () => {
    setDraft(displayName(item));
    setRenaming(false);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteDashboard(item.id);
      onDeleted(item.id);
    } catch (err) {
      onError(err?.response?.data?.error || err?.message || "Couldn't delete.");
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <li>
      <div
        className={`group w-full text-left px-5 py-4 flex items-center gap-4 transition-colors ${
          confirmingDelete ? "bg-rose-50/50" : "hover:bg-accent/50"
        }`}
      >
        <div className="p-2 rounded-md bg-accent shrink-0">
          <FileSpreadsheet className="w-4 h-4" strokeWidth={1.7} />
        </div>

        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename();
                if (e.key === "Escape") cancelRename();
              }}
              onBlur={saveRename}
              disabled={busy}
              maxLength={120}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-foreground"
            />
          ) : (
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="text-left w-full min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-medium truncate">{displayName(item)}</p>
                {revisionLabel && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-mono uppercase tracking-widest">
                    {revisionLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.filename} · {Number(item.row_count).toLocaleString()} rows
                {item.domain ? ` · ${item.domain}` : ""}
              </p>
            </button>
          )}
        </div>

        <span className="font-mono text-[11px] text-muted-foreground hidden sm:block shrink-0">
          {formatDate(item.created_at)}
        </span>

        {!renaming && !confirmingDelete && (
          <>
            <RowMenu
              onRename={() => setRenaming(true)}
              onUpdate={() => onUpdate(item.id)}
              onDelete={() => setConfirmingDelete(true)}
            />
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Open dashboard"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {confirmingDelete && (
        <div className="px-5 pb-4 -mt-1 flex items-center justify-end gap-3 bg-rose-50/50">
          <span className="mr-auto text-sm text-rose-900">
            Delete this dashboard? This can't be undone.
          </span>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={busy}
            className="px-3 h-8 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className="px-3 h-8 rounded-md text-sm bg-rose-700 text-background hover:bg-rose-800 disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setResult } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const list = await listDashboards();
        if (!cancelled) setItems(list);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.error ||
            (err?.code === "ERR_NETWORK"
              ? "Can't reach the server."
              : err?.message) ||
            "Failed to load history.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDashboard = async (id) => {
    try {
      const data = await getDashboardById(id);
      setResult(data);
      navigate(`/app/dashboard/${id}`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open dashboard.");
    }
  };

  const updateDashboard = (id) => {
    navigate(`/app?parent=${id}`);
  };

  const handleRenamed = (id, name) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, name } : it)));
  };

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Compute per-row revision labels. For each row that has a parent, walk the
  // chain via parent_id to determine its version number within its family.
  const revisionLabels = (() => {
    const byId = new Map(items.map((it) => [it.id, it]));
    const labels = new Map();
    for (const it of items) {
      if (!it.parent_id) continue;
      let depth = 1;
      let cursor = byId.get(it.parent_id);
      while (cursor && cursor.parent_id && depth < 10) {
        depth++;
        cursor = byId.get(cursor.parent_id);
      }
      labels.set(it.id, `v${depth + 1}`);
    }
    return labels;
  })();

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
            History
          </span>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
            Past dashboards
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Every spreadsheet you've turned into a brief — newest first. Click any row to
            re-open it, or use the menu to rename or delete.
          </p>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          New upload
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-rose-900">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 text-xs uppercase font-mono tracking-widest"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 bg-card/40 p-10 lg:p-14 text-center">
          <div className="inline-flex p-4 rounded-xl border border-border bg-background mb-6">
            <HistoryIcon className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-display text-2xl lg:text-3xl tracking-tight mb-3">
            No dashboards yet
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Upload your first spreadsheet and it'll show up here, along with every one
            after.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Upload your first file
          </Link>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              revisionLabel={revisionLabels.get(item.id)}
              onOpen={openDashboard}
              onUpdate={updateDashboard}
              onRenamed={handleRenamed}
              onDeleted={handleDeleted}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
