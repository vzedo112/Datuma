import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "../../lib/cn";

const trendStyles = {
  up: "text-emerald-700 bg-emerald-50",
  down: "text-rose-700 bg-rose-50",
  neutral: "text-muted-foreground bg-accent",
};
const trendIcons = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus };

export default function MetricCard({ label, value, trend, trendValue, computation, datasetTag }) {
  const Icon = trend ? trendIcons[trend] : null;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 lg:p-6 hover-lift">
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {trend && Icon && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md",
              trendStyles[trend]
            )}
          >
            <Icon className="w-3 h-3" />
            {trendValue}
          </span>
        )}
      </div>

      <p className="font-display text-3xl lg:text-4xl leading-none mb-3 tracking-tight">
        {value}
      </p>

      {computation && (
        <p className="text-xs text-muted-foreground leading-relaxed">{computation}</p>
      )}

      {datasetTag && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          {datasetTag}
        </p>
      )}
    </div>
  );
}
