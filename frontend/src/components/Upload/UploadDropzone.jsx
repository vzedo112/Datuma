import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";
import { cn } from "../../lib/cn";

const ACCEPT = ".csv,.xlsx,.xls";

export default function UploadDropzone({ file, onFile, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!file ? (
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
              Drop your spreadsheet here
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="underline underline-offset-4">browse</span> from your computer. CSV, XLSX, XLS up to 60 MB.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            <span className="w-6 h-px bg-foreground/30" />
            Max 1.2M rows
            <span className="w-6 h-px bg-foreground/30" />
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-accent">
              <FileSpreadsheet className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs font-mono text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={disabled}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
