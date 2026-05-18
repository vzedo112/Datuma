import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

const ACCEPT = ".csv,.xlsx,.xls";

function defaultDatasetName(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

export default function UploadDropzone({
  files = [],
  datasetNames = {},
  onFilesChange,
  onNameChange,
  disabled,
  maxFiles = 5,
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const moreInputRef = useRef(null);

  const handleFiles = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const list = Array.from(incoming).slice(0, maxFiles - files.length);
    if (list.length === 0) return;
    onFilesChange?.([...files, ...list]);
  };

  const removeFile = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onFilesChange?.(next);
  };

  const canAddMore = files.length < maxFiles;

  if (files.length === 0) {
    return (
      <div className="w-full">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "w-full text-left flex flex-col items-center justify-center gap-4 px-8 py-16 lg:py-24 rounded-2xl border border-dashed transition-all",
            "bg-card hover:bg-accent/30",
            dragOver ? "border-foreground bg-accent/40" : "border-foreground/25",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="p-4 rounded-full bg-background border border-border">
            <UploadCloud className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="font-display text-2xl lg:text-3xl mb-2">
              Drop your spreadsheets here
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="underline underline-offset-4">browse</span> from your computer. CSV, XLSX, XLS — up to {maxFiles} file{maxFiles === 1 ? "" : "s"}, 60 MB each.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            <span className="w-6 h-px bg-foreground/30" />
            Multi-file dashboards · max 1.2M rows
            <span className="w-6 h-px bg-foreground/30" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        ref={moreInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <ul className="space-y-2.5">
        {files.map((file, idx) => {
          const currentName =
            datasetNames[file.name] ?? defaultDatasetName(file.name);
          return (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border"
            >
              <div className="p-2 rounded-md bg-accent shrink-0">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="min-w-0 sm:flex-1">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => onNameChange?.(file.name, e.target.value)}
                    disabled={disabled}
                    className="w-full bg-transparent font-medium text-sm focus:outline-none focus:bg-accent/40 px-1 -mx-1 rounded"
                    placeholder="Dataset name"
                    aria-label={`Dataset name for ${file.name}`}
                  />
                  <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                disabled={disabled}
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {canAddMore ? (
        <button
          type="button"
          onClick={() => moreInputRef.current?.click()}
          disabled={disabled}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-foreground/25 text-sm hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add another file
          <span className="font-mono text-[10px] uppercase tracking-widest ml-2">
            {files.length} / {maxFiles}
          </span>
        </button>
      ) : (
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {files.length} of {maxFiles} files — plan limit reached
        </p>
      )}
    </div>
  );
}
