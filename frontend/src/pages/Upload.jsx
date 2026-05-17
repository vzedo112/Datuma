import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Loader2, Database, Zap, Wand2 } from "lucide-react";
import UploadDropzone from "../components/Upload/UploadDropzone";
import { useDashboard } from "../context/DashboardContext";
import mockDashboard from "../services/mockDashboard";

const STAGES = [
  { label: "Parsing rows", icon: Database },
  { label: "Profiling columns", icon: Zap },
  { label: "Briefing the analyst", icon: Wand2 },
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(0);
  const { loading, setLoading, setResult } = useDashboard();
  const navigate = useNavigate();

  const start = async () => {
    if (!file) return;
    setLoading(true);
    setStage(0);

    for (let i = 1; i < STAGES.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setStage(i);
    }
    await new Promise((r) => setTimeout(r, 800));

    setResult({ ...mockDashboard, filename: file.name });
    setLoading(false);
    navigate("/app/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
          New upload
        </span>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
          Drop a file. Get a brief.
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Datuma reads your spreadsheet, picks the most important business question,
          and answers it with a one-page dashboard.
        </p>
      </div>

      <UploadDropzone file={file} onFile={setFile} disabled={loading} />

      {file && !loading && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-12 rounded-full text-sm font-medium group"
          >
            <Sparkles className="w-4 h-4" />
            Generate dashboard
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-10 rounded-xl border border-border bg-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Working on {file?.name}
            </p>
          </div>
          <ul className="space-y-3">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const done = i < stage;
              const current = i === stage;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 text-sm transition-colors ${
                    done
                      ? "text-foreground"
                      : current
                      ? "text-foreground"
                      : "text-muted-foreground/60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                      done
                        ? "bg-foreground text-background border-foreground"
                        : current
                        ? "bg-accent border-foreground/30"
                        : "bg-background border-border"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{s.label}</span>
                  {current && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin" />}
                  {done && <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">done</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-16 grid sm:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
        {[
          { label: "Formats", value: "CSV, XLSX, XLS" },
          { label: "Max rows", value: "1.2M / file" },
          { label: "Avg time", value: "28 seconds" },
        ].map((s) => (
          <div key={s.label} className="bg-background p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {s.label}
            </p>
            <p className="font-display text-2xl">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
