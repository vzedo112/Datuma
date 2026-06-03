import { useState } from "react";
import {
  Lock,
  Check,
  Database,
  Cpu,
  HardDrive,
  Cloud,
  Archive,
  BarChart3,
} from "lucide-react";
import { recordConnectorInterest } from "../../services/api";

// Each card maps a stable key (sent to the backend) to a display name + icon.
// Keep these keys in sync with VALID_SOURCES in backend/src/routes/connectors.js.
const SOURCES = [
  {
    key: "google-drive",
    name: "Google Drive",
    kind: "Files",
    icon: HardDrive,
    accent: "from-amber-500/10 to-amber-500/0",
  },
  {
    key: "onedrive",
    name: "OneDrive",
    kind: "Files",
    icon: Cloud,
    accent: "from-sky-500/10 to-sky-500/0",
  },
  {
    key: "dropbox",
    name: "Dropbox",
    kind: "Files",
    icon: Archive,
    accent: "from-indigo-500/10 to-indigo-500/0",
  },
  {
    key: "snowflake",
    name: "Snowflake",
    kind: "Warehouse",
    icon: Database,
    accent: "from-cyan-500/10 to-cyan-500/0",
  },
  {
    key: "databricks",
    name: "Databricks",
    kind: "Warehouse",
    icon: Cpu,
    accent: "from-rose-500/10 to-rose-500/0",
  },
  {
    key: "bigquery",
    name: "BigQuery",
    kind: "Warehouse",
    icon: BarChart3,
    accent: "from-blue-500/10 to-blue-500/0",
  },
];

const STORAGE_KEY = "datuma_connector_interest";

function loadClicked() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function persistClicked(set) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* sessionStorage disabled / quota — non-fatal */
  }
}

export default function ConnectorsTeaser() {
  const [clicked, setClicked] = useState(loadClicked);

  const record = async (key) => {
    if (clicked.has(key)) return;
    const next = new Set(clicked);
    next.add(key);
    setClicked(next);
    persistClicked(next);
    try {
      await recordConnectorInterest(key);
    } catch {
      // Best-effort telemetry. Don't roll back the UI on failure — the user
      // expressed interest, and we don't want a network blip to look like the
      // button didn't work.
    }
  };

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Connect a source
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-accent rounded text-muted-foreground">
          Coming soon
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5 max-w-xl leading-relaxed">
        Plug Datuma into the place your data already lives. We're building these
        next — click "I want this" and we'll prioritise the ones with the most
        demand.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SOURCES.map((s) => (
          <ConnectorCard
            key={s.key}
            source={s}
            clicked={clicked.has(s.key)}
            onClick={() => record(s.key)}
          />
        ))}
      </div>
    </section>
  );
}

function ConnectorCard({ source, clicked, onClick }) {
  const Icon = source.icon;
  return (
    <div
      className={`relative rounded-xl border border-border bg-card/60 p-4 flex flex-col gap-3 overflow-hidden transition-colors ${
        clicked ? "border-brand/40" : ""
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${source.accent} pointer-events-none`}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <div className="p-2 rounded-lg bg-background border border-border">
          <Icon className="w-4 h-4" strokeWidth={1.6} />
        </div>
        <Lock className="w-3 h-3 text-muted-foreground" />
      </div>

      <div className="relative">
        <p className="font-medium text-sm">{source.name}</p>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
          {source.kind}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={clicked}
        className={`relative text-xs h-8 rounded-md transition-colors ${
          clicked
            ? "bg-brand/10 text-brand cursor-default font-medium"
            : "border border-border bg-background hover:bg-accent text-foreground/80 hover:text-foreground"
        }`}
      >
        {clicked ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            <Check className="w-3 h-3" />
            We'll prioritise it
          </span>
        ) : (
          "I want this →"
        )}
      </button>
    </div>
  );
}
