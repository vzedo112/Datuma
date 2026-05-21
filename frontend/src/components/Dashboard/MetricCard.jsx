import { ArrowUpRight, ArrowDownRight, Minus, Maximize2 } from "lucide-react";
import { cn } from "../../lib/cn";

const trendStyles = {
  up: "text-emerald-700 bg-emerald-50",
  down: "text-rose-700 bg-rose-50",
  neutral: "text-muted-foreground bg-accent",
};
const trendIcons = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus };

export default function MetricCard({ label, value, trend, trendValue, computation, datasetTag, onDrillDown }) {
  const Icon = trend ? trendIcons[trend] : null;
  const clickable = Boolean(onDrillDown);

  const handleClick = clickable ? onDrillDown : undefined;
  const handleKey = clickable
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDrillDown();
        }
      }
    : undefined;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-5 lg:p-6 hover-lift",
        clickable && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-foreground/30"
      )}
      onClick={handleClick}
      onKeyDown={handleKey}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View source rows for ${label}` : undefined}
    >
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

      {clickable && (
        <Maximize2
          className="absolute bottom-3 right-3 w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
