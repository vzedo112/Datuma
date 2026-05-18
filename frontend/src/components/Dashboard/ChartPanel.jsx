import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

function renderChart(chart) {
  const data = chart.data ?? [];
  if (data.length === 0) return <Empty />;
  const angle = shouldAngleLabels(data);

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
          <Bar dataKey="y" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<TooltipBody />} />
          <Pie
            data={data}
            dataKey="y"
            nameKey="x"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="var(--background)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return <Empty />;
}

export default function ChartPanel({ chart, primary = false, datasetTag = null }) {
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
            {chart.type} · {chart.aggregation}{" "}
            {chart.bucket && chart.bucket !== "none" ? `· ${chart.bucket}` : ""}
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
        {renderChart(chart)}
      </div>

      {chart.type === "pie" && data.length > 0 && (
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
