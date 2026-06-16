import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import ChartPanel from "./ChartPanel";

// Wraps a single ChartPanel so it can be reordered via drag-and-drop and gets
// per-card edit/delete affordances. Only renders the action layer when the
// parent is in edit mode.
export default function SortableChart({
  chart,
  index,
  primary,
  datasetTag,
  editing,
  onEdit,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `chart-${index}`,
    disabled: !editing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${primary ? "lg:col-span-2" : ""} ${
        isDragging ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background rounded-xl" : ""
      }`}
    >
      <ChartPanel chart={chart} primary={primary} datasetTag={datasetTag} />

      {editing && (
        <div
          data-export-hide="true"
          className="absolute top-3 right-3 flex items-center gap-1 z-10"
        >
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-md bg-card/95 backdrop-blur border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit chart"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md bg-card/95 backdrop-blur border border-border shadow-sm text-muted-foreground hover:text-rose-700 transition-colors"
            aria-label="Remove chart"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {editing && (
        <button
          type="button"
          data-export-hide="true"
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 p-1.5 rounded-md bg-card/95 backdrop-blur border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing z-10"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
