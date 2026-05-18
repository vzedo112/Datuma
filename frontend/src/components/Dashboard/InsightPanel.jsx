import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/cn";

const severityConfig = {
  warning: {
    Icon: AlertTriangle,
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    label: "Watch out",
  },
  success: {
    Icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Good signal",
  },
  info: {
    Icon: Info,
    badge: "bg-accent text-foreground border-border",
    label: "Note",
  },
};

export default function InsightPanel({ insights }) {
  if (!insights?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 lg:px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            What the data is telling you
          </p>
          <h2 className="font-display text-2xl lg:text-3xl mt-1">Insights</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {insights.length} item{insights.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {insights.map((ins, i) => {
          const cfg = severityConfig[ins.severity] ?? severityConfig.info;
          const Icon = cfg.Icon;
          return (
            <li key={i} className="p-5 lg:p-6 flex gap-4">
              <div
                className={cn(
                  "shrink-0 w-9 h-9 rounded-md flex items-center justify-center border",
                  cfg.badge
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-medium">{ins.title}</h3>
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border",
                      cfg.badge
                    )}
                  >
                    {cfg.label}
                  </span>
                  {ins.datasetTag && (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                      {ins.datasetTag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ins.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
