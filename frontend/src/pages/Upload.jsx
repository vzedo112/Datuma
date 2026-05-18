import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  Database,
  Zap,
  Wand2,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import UploadDropzone from "../components/Upload/UploadDropzone";
import DataQualityReport from "../components/Upload/DataQualityReport";
import { useDashboard } from "../context/DashboardContext";
import {
  analyzeUpload,
  generateDashboardFromUpload,
  getUsage,
} from "../services/api";

const ANALYZE_STAGES = [
  { label: "Parsing rows", icon: Database },
  { label: "Profiling columns", icon: Zap },
  { label: "Running quality checks", icon: ShieldCheck },
];

const GENERATE_STAGES = [
  { label: "Briefing the analyst", icon: Wand2 },
  { label: "Building your dashboard", icon: Sparkles },
];

const MAX_SIZE_BYTES = 60 * 1024 * 1024;

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [datasetNames, setDatasetNames] = useState({});
  const [step, setStep] = useState("pick"); // "pick" | "report" | "generating"
  const [stage, setStage] = useState(0);
  const [stageBank, setStageBank] = useState(ANALYZE_STAGES);
  const [uploadResult, setUploadResult] = useState(null); // { uploadId, datasets: [...] }
  const [planFileLimit, setPlanFileLimit] = useState(5);

  const { loading, error, setLoading, setError, setResult } = useDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const usage = await getUsage();
        if (cancelled) return;
        const fileLimit = usage?.plan?.fileLimit;
        if (typeof fileLimit === "number" && fileLimit > 0) {
          setPlanFileLimit(fileLimit);
        }
      } catch {
        // Plan info unavailable — fall back to default cap.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNameChange = (filename, name) => {
    setDatasetNames((prev) => ({ ...prev, [filename]: name }));
  };

  const oversize = files.find((f) => f.size > MAX_SIZE_BYTES);

  const startAnalyze = async () => {
    if (files.length === 0) return;
    if (oversize) {
      setError(
        `${oversize.name} is ${(oversize.size / 1024 / 1024).toFixed(1)} MB. Max per file is 60 MB.`
      );
      return;
    }

    setError(null);
    setLoading(true);
    setStageBank(ANALYZE_STAGES);
    setStage(0);

    const interval = setInterval(
      () => setStage((s) => Math.min(s + 1, ANALYZE_STAGES.length - 1)),
      900
    );

    const names = files.map((f) => ({
      filename: f.name,
      name: datasetNames[f.name] || f.name.replace(/\.[^.]+$/, ""),
    }));

    try {
      const result = await analyzeUpload(files, names);
      clearInterval(interval);
      setUploadResult(result);
      setLoading(false);
      setStep("report");
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setStage(0);
      const data = err?.response?.data;
      let message;
      if (data?.code === "QUOTA_EXCEEDED") {
        message = `${data.error} Visit Pricing to upgrade your plan.`;
      } else if (data?.code === "ROW_LIMIT_EXCEEDED") {
        message = data.error;
      } else if (data?.code === "FILE_LIMIT_EXCEEDED") {
        message = data.error;
      } else if (data?.code === "EMPTY_FILE") {
        message = data.error;
      } else {
        message =
          data?.error ||
          (err?.code === "ERR_NETWORK"
            ? "Couldn't reach the server. Is the backend running?"
            : err?.message) ||
          "Upload failed.";
      }
      setError(message);
    }
  };

  const startGenerate = async () => {
    if (!uploadResult?.uploadId) return;
    setError(null);
    setLoading(true);
    setStep("generating");
    setStageBank(GENERATE_STAGES);
    setStage(0);

    const interval = setInterval(
      () => setStage((s) => Math.min(s + 1, GENERATE_STAGES.length - 1)),
      4000
    );

    const names = files.map((f) => ({
      filename: f.name,
      name: datasetNames[f.name] || f.name.replace(/\.[^.]+$/, ""),
    }));

    try {
      const result = await generateDashboardFromUpload(uploadResult.uploadId, names);
      clearInterval(interval);
      setResult(result);
      setLoading(false);
      navigate("/app/dashboard");
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setStage(0);
      setStep("report");
      const data = err?.response?.data;
      if (data?.code === "SESSION_EXPIRED") {
        setError("Your upload expired. Please re-upload your files.");
        setUploadResult(null);
        setStep("pick");
        return;
      }
      setError(
        data?.error ||
          err?.message ||
          "Dashboard generation failed. Try again."
      );
    }
  };

  const backToPick = () => {
    setStep("pick");
    setUploadResult(null);
  };

  if (step === "report" && uploadResult) {
    return (
      <DataQualityReport
        datasets={uploadResult.datasets}
        onBack={backToPick}
        onProceed={startGenerate}
        generating={false}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-16">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
          New upload
        </span>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tight mb-3">
          Drop one or more spreadsheets.
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Datuma reads your files, runs a quality pre-flight, then hands you a one-page
          dashboard that ties them together.
        </p>
      </div>

      <UploadDropzone
        files={files}
        datasetNames={datasetNames}
        onFilesChange={setFiles}
        onNameChange={handleNameChange}
        disabled={loading}
        maxFiles={planFileLimit}
      />

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-rose-900">Upload failed</p>
            <p className="text-sm text-rose-800 mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 p-1 -m-1"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {files.length > 0 && !loading && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={startAnalyze}
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-12 rounded-full text-sm font-medium group"
          >
            <Sparkles className="w-4 h-4" />
            Run pre-flight & analyse
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-10 rounded-xl border border-border bg-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              {step === "generating"
                ? "Generating dashboard"
                : `Profiling ${files.length} file${files.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <ul className="space-y-3">
            {stageBank.map((s, i) => {
              const Icon = s.icon;
              const done = i < stage;
              const current = i === stage;
              return (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 text-sm transition-colors ${
                    done || current ? "text-foreground" : "text-muted-foreground/60"
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
                  {done && (
                    <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">
                      done
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            {step === "generating"
              ? "Claude is reading your data and writing the brief. Don't close this tab."
              : "Pre-flight checks run locally on the server — no AI yet."}
          </p>
        </div>
      )}

      <div className="mt-16 grid sm:grid-cols-3 gap-px bg-foreground/10 border border-foreground/10 rounded-xl overflow-hidden">
        {[
          { label: "Formats", value: "CSV, XLSX, XLS" },
          { label: "Files per dashboard", value: `${planFileLimit}` },
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
