import { Edit3, Plus, Save, X, Loader2, Undo2 } from "lucide-react";

export default function EditorToolbar({
  editing,
  dirty,
  saving,
  canEdit,
  onStart,
  onCancel,
  onSave,
  onReset,
  onAdd,
  cardCount,
  maxCards = 12,
}) {
  if (!canEdit) return null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border text-sm hover:bg-accent transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Edit
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-foreground/20 bg-foreground/5 p-1">
      <button
        type="button"
        onClick={onAdd}
        disabled={cardCount >= maxCards || saving}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium hover:bg-background transition-colors disabled:opacity-50"
        title={cardCount >= maxCards ? `Max ${maxCards} charts` : "Add a chart"}
      >
        <Plus className="w-3.5 h-3.5" />
        Add chart
      </button>
      <span className="w-px h-5 bg-foreground/15" />
      <button
        type="button"
        onClick={onReset}
        disabled={!dirty || saving}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium hover:bg-background transition-colors disabled:opacity-50"
        title="Discard unsaved changes"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Reset
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium hover:bg-background transition-colors disabled:opacity-50"
      >
        <X className="w-3.5 h-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        Save
      </button>
    </div>
  );
}
