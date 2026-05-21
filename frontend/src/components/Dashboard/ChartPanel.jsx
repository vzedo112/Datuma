import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
} from "recharts";

// Coordinated warm-earth palette — all colors share value/chroma range
// so they feel like one family even at the rainbow extremes.
const PALETTE = [
  "#7d3d5b", // plum (anchor / brand)
  "#b8533d", // terracotta
  "#b8722d", // ochre
  "#3d756a", // teal
  "#8a7c2e", // olive
  "#4f5d8a", // slate blue
  "#c89554", // sand
];

function compact(n) {
  if (typeof n !== "number" || !isFinite(n)) return String(n ?? "");
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function TooltipBody({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const name = payload[0]?.payload?.x ?? label;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs font-medium">{name}</p>
      <p className="font-mono text-xs text-muted-foreground mt-1">{compact(value)}</p>
    </div>
  );
}

// Tooltip for multi-series charts: lists every series value at the hovered x.
function MultiSeriesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm min-w-[160px]">
      <p className="text-xs font-medium mb-1.5">{label}</p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li
            key={p.dataKey}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: p.color }}
              />
              <span className="text-muted-foreground truncate">
                {p.dataKey}
              </span>
            </span>
            <span className="font-mono text-foreground">{compact(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeriesLegend({ series }) {
  if (!series || series.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {series.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ background: PALETTE[i % PALETTE.length] }}
          />
          <span className="text-muted-foreground">{s}</span>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
      No data to chart.
    </div>
  );
}

function shouldAngleLabels(data) {
  return data.length > 6 || data.some((d) => String(d.x).length > 8);
}

function truncate(s, n = 14) {
  const str = String(s);
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function renderChart(chart, onPointClick) {
  const data = chart.data ?? [];
  if (data.length === 0) return <Empty />;
  const angle = shouldAngleLabels(data);
  // Recharts Bar/Pie onClick receives the data point object directly — we
  // just need the `x` value to drive the drill-down filter.
  const handlePoint = onPointClick
    ? (d) => {
        if (d && d.x !== undefined) onPointClick({ x: d.x });
      }
    : undefined;

  if (chart.type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => truncate(v, 12)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 60 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<TooltipBody />} cursor={{ stroke: "rgba(20,17,13,0.2)" }} />
          <Line
            type="monotone"
            dataKey="y"
            stroke={PALETTE[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: PALETTE[0] }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" vertical={false} />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(v) => truncate(v, 14)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 70 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<TooltipBody />} cursor={{ fill: "rgba(20,17,13,0.06)" }} />
          <Bar
            dataKey="y"
            radius={[4, 4, 0, 0]}
            onClick={handlePoint}
            style={handlePoint ? { cursor: "pointer" } : undefined}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie" || chart.type === "donut") {
    const isDonut = chart.type === "donut";
    const total = data.reduce((sum, d) => sum + (Number(d.y) || 0), 0);
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<TooltipBody />} />
          <Pie
            data={data}
            dataKey="y"
            nameKey="x"
            innerRadius={isDonut ? "62%" : "55%"}
            outerRadius="82%"
            paddingAngle={2}
            stroke="var(--background)"
            onClick={handlePoint}
            style={handlePoint ? { cursor: "pointer" } : undefined}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
            {isDonut && (
              <Label
                position="center"
                content={() => (
                  <g>
                    <text
                      x="50%"
                      y="48%"
                      textAnchor="middle"
                      className="font-display"
                      style={{ fontSize: "1.5rem", fill: "var(--foreground)" }}
                    >
                      {compact(total)}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      style={{
                        fontSize: "0.625rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        fill: "var(--muted-foreground)",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      Total
                    </text>
                  </g>
                )}
              />
            )}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <defs>
            <linearGradient id={`area-${chart.title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => truncate(v, 12)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 60 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<TooltipBody />} cursor={{ stroke: "rgba(20,17,13,0.2)" }} />
          <Area
            type="monotone"
            dataKey="y"
            stroke={PALETTE[0]}
            strokeWidth={2}
            fill={`url(#area-${chart.title})`}
            dot={{ r: 2.5, fill: PALETTE[0] }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "horizontal-bar") {
    // Recharts vertical layout: numeric axis is X, categorical is Y.
    const longest = data.reduce((m, d) => Math.max(m, String(d.x).length), 0);
    const yWidth = Math.min(160, Math.max(60, longest * 7));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={compact}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="x"
            tickLine={false}
            axisLine={false}
            width={yWidth}
            tickFormatter={(v) => truncate(v, 18)}
            interval={0}
          />
          <Tooltip content={<TooltipBody />} cursor={{ fill: "rgba(20,17,13,0.06)" }} />
          <Bar
            dataKey="y"
            radius={[0, 4, 4, 0]}
            onClick={handlePoint}
            style={handlePoint ? { cursor: "pointer" } : undefined}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "multi-line") {
    const series = chart.series ?? [];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => truncate(v, 12)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 60 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<MultiSeriesTooltip />} cursor={{ stroke: "rgba(20,17,13,0.2)" }} />
          {series.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2.5, fill: PALETTE[i % PALETTE.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "stacked-area") {
    const series = chart.series ?? [];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => truncate(v, 12)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 60 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<MultiSeriesTooltip />} cursor={{ stroke: "rgba(20,17,13,0.2)" }} />
          {series.map((s, i) => (
            <Area
              key={s}
              type="monotone"
              dataKey={s}
              stackId="a"
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.7}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "stacked-bar" || chart.type === "grouped-bar") {
    const series = chart.series ?? [];
    const stacked = chart.type === "stacked-bar";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: angle ? 24 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" vertical={false} />
          <XAxis
            dataKey="x"
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(v) => truncate(v, 14)}
            angle={angle ? -30 : 0}
            textAnchor={angle ? "end" : "middle"}
            height={angle ? 70 : 30}
          />
          <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<MultiSeriesTooltip />} cursor={{ fill: "rgba(20,17,13,0.06)" }} />
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              stackId={stacked ? "a" : undefined}
              fill={PALETTE[i % PALETTE.length]}
              radius={
                stacked
                  ? i === series.length - 1
                    ? [4, 4, 0, 0]
                    : [0, 0, 0, 0]
                  : [4, 4, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,17,13,0.08)" />
          <XAxis
            type="number"
            dataKey="x"
            tickLine={false}
            axisLine={false}
            tickFormatter={compact}
            name={chart.xAxis || "x"}
          />
          <YAxis
            type="number"
            dataKey="y"
            tickLine={false}
            axisLine={false}
            tickFormatter={compact}
            width={56}
            name={chart.yAxis || "y"}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]?.payload;
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {chart.xAxis} / {chart.yAxis}
                  </p>
                  <p className="font-mono text-xs mt-1">
                    {compact(p?.x)}, {compact(p?.y)}
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill={PALETTE[0]}
            fillOpacity={0.55}
            stroke={PALETTE[0]}
            strokeWidth={0.5}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  return <Empty />;
}

export default function ChartPanel({ chart, primary = false, datasetTag = null, onPointClick = null }) {
  // Only chart types that have a natural categorical xAxis support drill-down.
  // Skip line/area/scatter/multi-series — time-bucket and per-point filtering
  // would need extra logic; we'll add later if users ask.
  const drillable =
    onPointClick &&
    ["bar", "horizontal-bar", "pie", "donut"].includes(chart.type);
  const effectiveClick = drillable ? onPointClick : null;
  const data = chart.data ?? [];

  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-card p-5 lg:p-6 ${
        primary ? "lg:col-span-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            {chart.type} · {chart.aggregation}
            {chart.bucket && chart.bucket !== "none" ? ` · ${chart.bucket}` : ""}
            {chart.groupBy ? ` · by ${chart.groupBy}` : ""}
          </p>
          <h3 className="font-display text-xl lg:text-2xl tracking-tight">
            {chart.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {primary && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-brand text-brand-foreground rounded-md">
              Primary
            </span>
          )}
          {datasetTag && (
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-accent rounded-md max-w-[160px] truncate">
              {datasetTag}
            </span>
          )}
        </div>
      </div>

      <div className={`w-full ${primary ? "h-80 lg:h-96" : "h-64"}`}>
        {renderChart(chart, effectiveClick)}
      </div>
      {drillable && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          Click a {chart.type === "pie" || chart.type === "donut" ? "slice" : "bar"} to see source rows
        </p>
      )}

      {Array.isArray(chart.series) && chart.series.length > 0 && (
        <SeriesLegend series={chart.series} />
      )}

      {(chart.type === "pie" || chart.type === "donut") && data.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
          {data.map((d, i) => (
            <div key={d.x} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate text-muted-foreground">{d.x}</span>
              <span className="ml-auto font-mono text-foreground">{compact(d.y)}</span>
            </div>
          ))}
        </div>
      )}

      {chart.explanation && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {chart.explanation}
        </p>
      )}
    </div>
  );
}
