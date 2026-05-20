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
  Folder,
  FolderPlus,
  FolderOpen,
  FolderX,
  FolderInput,
  Inbox,
  LayoutGrid,
  Check,
  X as XIcon,
} from "lucide-react";
import {
  getDashboardById,
  renameDashboard,
  deleteDashboard,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveDashboardToFolder,
  listDashboardsInFolder,
} from "../services/api";
import { useDashboard } from "../context/DashboardContext";

const ALL = "all";
const UNFILED = "unfiled";

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

// --- Folders rail ---

function FoldersRail({
  folders,
  unfiled,
  selected,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  totalCount,
}) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const commit = async () => {
    const name = draft.trim();
    if (!name) {
      setCreating(false);
      setDraft("");
      return;
    }
    await onCreate(name);
    setDraft("");
    setCreating(false);
  };

  const items = [
    {
      key: ALL,
      label: "All dashboards",
      count: totalCount,
      icon: LayoutGrid,
    },
    {
      key: UNFILED,
      label: "Unfiled",
      count: unfiled,
      icon: Inbox,
    },
  ];

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Folders
        </span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="New folder"
          title="New folder"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      <ul className="space-y-1">
        {items.map(({ key, label, count, icon: Icon }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                selected === key
                  ? "bg-foreground text-background"
                  : "text-foreground/80 hover:bg-accent"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{label}</span>
              <span
                className={`text-[10px] font-mono ${
                  selected === key ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          </li>
        ))}

        {folders.map((f) => (
          <FolderRow
            key={f.id}
            folder={f}
            isSelected={selected === f.id}
            onSelect={() => onSelect(f.id)}
            onRename={(newName) => onRename(f.id, newName)}
            onDelete={() => onDelete(f.id)}
          />
        ))}

        {creating && (
          <li className="px-3 py-2 flex items-center gap-2 text-sm">
            <Folder className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft("");
                  setCreating(false);
                }
              }}
              onBlur={commit}
              maxLength={60}
              placeholder="Folder name"
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-foreground"
            />
          </li>
        )}
      </ul>
    </aside>
  );
}

function FolderRow({ folder, isSelected, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folder.name);
  const [hover, setHover] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = async () => {
    const name = draft.trim();
    if (name && name !== folder.name) {
      await onRename(name);
    }
    setEditing(false);
  };

  const confirmDelete = async () => {
    if (
      window.confirm(
        `Delete folder "${folder.name}"? Dashboards inside will fall back to "Unfiled".`
      )
    ) {
      await onDelete();
    }
  };

  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative"
    >
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
          isSelected
            ? "bg-foreground text-background"
            : "text-foreground/80 hover:bg-accent"
        }`}
      >
        {isSelected ? (
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 shrink-0" />
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(folder.name);
                setEditing(false);
              }
            }}
            onBlur={commit}
            onClick={(e) => e.stopPropagation()}
            maxLength={60}
            className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-sm focus:outline-none focus:border-foreground text-foreground"
          />
        ) : (
          <span className="truncate flex-1">{folder.name}</span>
        )}
        <span
          className={`text-[10px] font-mono ${
            isSelected ? "text-background/70" : "text-muted-foreground"
          }`}
        >
          {folder.dashboard_count ?? 0}
        </span>
      </button>

      {hover && !editing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
            aria-label="Rename folder"
            title="Rename"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete();
            }}
            className="p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-700"
            aria-label="Delete folder"
            title="Delete"
          >
            <FolderX className="w-3 h-3" />
          </button>
        </div>
      )}
    </li>
  );
}

// --- Row + row menu ---

function RowMenu({ folders, currentFolderId, onMove, onRename, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [movingOpen, setMovingOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setMovingOpen(false);
      }
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
        <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-border bg-background shadow-md py-1">
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
              setMovingOpen((v) => !v);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
          >
            <FolderInput className="w-3.5 h-3.5" />
            Move to folder…
          </button>
          {movingOpen && (
            <div className="border-t border-border bg-background py-1 max-h-56 overflow-y-auto">
              <MoveTarget
                label="Unfiled"
                active={!currentFolderId}
                onClick={() => {
                  setOpen(false);
                  setMovingOpen(false);
                  onMove(null);
                }}
              />
              {folders.map((f) => (
                <MoveTarget
                  key={f.id}
                  label={f.name}
                  active={currentFolderId === f.id}
                  onClick={() => {
                    setOpen(false);
                    setMovingOpen(false);
                    onMove(f.id);
                  }}
                />
              ))}
              {folders.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No folders yet — create one in the sidebar.
                </p>
              )}
            </div>
          )}

          <div className="my-1 border-t border-border" />
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

function MoveTarget({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
    >
      <Folder className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {active && <Check className="w-3 h-3 text-foreground" />}
    </button>
  );
}

function HistoryRow({
  item,
  revisionLabel,
  folders,
  onOpen,
  onUpdate,
  onRenamed,
  onDeleted,
  onMoved,
  onError,
}) {
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

  const handleMove = async (folderId) => {
    setBusy(true);
    try {
      await moveDashboardToFolder(item.id, folderId);
      onMoved(item.id, folderId);
    } catch (err) {
      onError(err?.response?.data?.error || err?.message || "Couldn't move.");
    } finally {
      setBusy(false);
    }
  };

  const folderLabel = item.folder_id
    ? folders.find((f) => f.id === item.folder_id)?.name
    : null;

  return (
    <li className="first:rounded-t-xl last:rounded-b-xl overflow-visible">
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
                {folderLabel && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent text-foreground/70 text-[10px] font-mono uppercase tracking-widest">
                    <Folder className="w-2.5 h-2.5" />
                    {folderLabel}
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
              folders={folders}
              currentFolderId={item.folder_id}
              onRename={() => setRenaming(true)}
              onUpdate={() => onUpdate(item.id)}
              onDelete={() => setConfirmingDelete(true)}
              onMove={handleMove}
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

// --- Page ---

export default function History() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [unfiledCount, setUnfiledCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setResult } = useDashboard();
  const navigate = useNavigate();

  // Convert UI selection into a query param for the items fetch.
  const folderQueryFor = (sel) => {
    if (sel === ALL) return undefined;
    if (sel === UNFILED) return null;
    return sel;
  };

  // Fetch folders + items together on mount and whenever selection changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [fldData, itemsList] = await Promise.all([
          listFolders().catch(() => ({ items: [], unfiled: 0 })),
          listDashboardsInFolder(folderQueryFor(selected)),
        ]);
        if (cancelled) return;
        setFolders(fldData.items ?? []);
        setUnfiledCount(fldData.unfiled ?? 0);
        setItems(itemsList);
        // Total = sum of all folder counts + unfiled
        const total =
          (fldData.items ?? []).reduce(
            (sum, f) => sum + (f.dashboard_count ?? 0),
            0
          ) + (fldData.unfiled ?? 0);
        setTotalCount(total);
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
  }, [selected]);

  // Refresh folder counts (without touching the items list).
  const refreshFolderCounts = async () => {
    try {
      const fldData = await listFolders();
      setFolders(fldData.items ?? []);
      setUnfiledCount(fldData.unfiled ?? 0);
      const total =
        (fldData.items ?? []).reduce(
          (sum, f) => sum + (f.dashboard_count ?? 0),
          0
        ) + (fldData.unfiled ?? 0);
      setTotalCount(total);
    } catch {
      // non-fatal — counts are cosmetic.
    }
  };

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
    refreshFolderCounts();
  };

  const handleMoved = (id, folderId) => {
    setItems((prev) => {
      // If we're viewing a specific folder/unfiled, the item leaves the visible list.
      if (selected === ALL) {
        return prev.map((it) =>
          it.id === id ? { ...it, folder_id: folderId } : it
        );
      }
      return prev.filter((it) => it.id !== id);
    });
    refreshFolderCounts();
  };

  const handleCreateFolder = async (name) => {
    try {
      const result = await createFolder(name);
      if (result?.folder) {
        setFolders((prev) =>
          [...prev, result.folder].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't create folder.");
    }
  };

  const handleRenameFolder = async (id, name) => {
    try {
      await renameFolder(id, name);
      setFolders((prev) =>
        prev
          .map((f) => (f.id === id ? { ...f, name } : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't rename folder.");
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (selected === id) setSelected(ALL);
      refreshFolderCounts();
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't delete folder.");
    }
  };

  // Compute per-row revision labels.
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

  const selectedFolderName =
    typeof selected === "number"
      ? folders.find((f) => f.id === selected)?.name
      : null;

  return (
    <div className="max-w-[1280px] mx-auto pb-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
            History
          </span>
          <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
            Past dashboards
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Every spreadsheet you've turned into a brief. Organise with folders on the
            left, click any row to re-open it.
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
            className="text-rose-700 hover:text-rose-900"
            aria-label="Dismiss"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
        <FoldersRail
          folders={folders}
          unfiled={unfiledCount}
          totalCount={totalCount}
          selected={selected}
          onSelect={setSelected}
          onCreate={handleCreateFolder}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
        />

        <section className="min-w-0">
          {selected !== ALL && (
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              {selected === UNFILED
                ? `Unfiled · ${items.length} dashboard${
                    items.length === 1 ? "" : "s"
                  }`
                : `${selectedFolderName ?? "Folder"} · ${items.length} dashboard${
                    items.length === 1 ? "" : "s"
                  }`}
            </p>
          )}

          {loading ? (
            <div className="rounded-xl border border-border bg-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Loading…
              </span>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-foreground/20 bg-card/40 p-10 lg:p-14 text-center">
              <div className="inline-flex p-4 rounded-xl border border-border bg-background mb-6">
                <HistoryIcon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl lg:text-3xl tracking-tight mb-3">
                {selected === ALL
                  ? "No dashboards yet"
                  : selected === UNFILED
                  ? "Everything's filed"
                  : "This folder is empty"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                {selected === ALL
                  ? "Upload your first spreadsheet and it'll show up here, along with every one after."
                  : "Move dashboards into this folder using the row menu, or upload a new one."}
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 rounded-full text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                New upload
              </Link>
            </div>
          ) : (
            <ul className="rounded-xl border border-border bg-card divide-y divide-border">
              {items.map((item) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  revisionLabel={revisionLabels.get(item.id)}
                  folders={folders}
                  onOpen={openDashboard}
                  onUpdate={updateDashboard}
                  onRenamed={handleRenamed}
                  onDeleted={handleDeleted}
                  onMoved={handleMoved}
                  onError={setError}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
