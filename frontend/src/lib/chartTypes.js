// Single source of truth for chart-type metadata used by the chart picker.
// Mirrors the rules baked into backend/src/services/validator.js so the
// frontend can guide users to a valid spec before the server rejects it.

import {
  LineChart as LineIcon,
  BarChart3,
  PieChart as PieIcon,
  AreaChart,
  ScatterChart as ScatterIcon,
  BarChart2,
  Layers,
  LayoutGrid,
  CircleDot,
  TrendingUp,
} from "lucide-react";

export const CHART_TYPES = [
  {
    key: "line",
    name: "Line",
    icon: LineIcon,
    summary: "Trend over time",
    family: "time-series",
    xKinds: ["date", "numeric"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max", "none"],
    bucketWhenDate: true,
    multiSeries: false,
  },
  {
    key: "area",
    name: "Area",
    icon: AreaChart,
    summary: "Volume over time",
    family: "time-series",
    xKinds: ["date", "numeric"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max", "none"],
    bucketWhenDate: true,
    multiSeries: false,
  },
  {
    key: "bar",
    name: "Bar",
    icon: BarChart3,
    summary: "Compare a few categories",
    family: "categorical",
    xKinds: ["categorical", "date"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max", "none"],
    bucketWhenDate: true,
    multiSeries: false,
  },
  {
    key: "horizontal-bar",
    name: "Horizontal bar",
    icon: BarChart2,
    summary: "Many categories or long labels",
    family: "categorical",
    xKinds: ["categorical"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max"],
    bucketWhenDate: false,
    multiSeries: false,
  },
  {
    key: "pie",
    name: "Pie",
    icon: PieIcon,
    summary: "Shares of a total (≤6 slices)",
    family: "proportion",
    xKinds: ["categorical"],
    yKinds: ["numeric"],
    aggregations: ["sum", "count"],
    bucketWhenDate: false,
    multiSeries: false,
  },
  {
    key: "donut",
    name: "Donut",
    icon: CircleDot,
    summary: "Shares with a centered total",
    family: "proportion",
    xKinds: ["categorical"],
    yKinds: ["numeric"],
    aggregations: ["sum", "count"],
    bucketWhenDate: false,
    multiSeries: false,
  },
  {
    key: "scatter",
    name: "Scatter",
    icon: ScatterIcon,
    summary: "Correlation between two numbers",
    family: "correlation",
    xKinds: ["numeric"],
    yKinds: ["numeric"],
    aggregations: ["none"],
    bucketWhenDate: false,
    multiSeries: false,
  },
  {
    key: "multi-line",
    name: "Multi-line",
    icon: TrendingUp,
    summary: "Trend split by category",
    family: "time-series",
    xKinds: ["date", "numeric"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max"],
    bucketWhenDate: true,
    multiSeries: true,
  },
  {
    key: "stacked-area",
    name: "Stacked area",
    icon: Layers,
    summary: "Total volume + breakdown over time",
    family: "time-series",
    xKinds: ["date", "numeric"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max"],
    bucketWhenDate: true,
    multiSeries: true,
  },
  {
    key: "stacked-bar",
    name: "Stacked bar",
    icon: Layers,
    summary: "Per-category totals + breakdown",
    family: "categorical",
    xKinds: ["categorical", "date"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max"],
    bucketWhenDate: true,
    multiSeries: true,
  },
  {
    key: "grouped-bar",
    name: "Grouped bar",
    icon: LayoutGrid,
    summary: "Side-by-side category comparisons",
    family: "categorical",
    xKinds: ["categorical", "date"],
    yKinds: ["numeric"],
    aggregations: ["sum", "avg", "count", "min", "max"],
    bucketWhenDate: true,
    multiSeries: true,
  },
];

export function getChartTypeMeta(key) {
  return CHART_TYPES.find((t) => t.key === key) ?? null;
}

// Pull stats off the dataset (preferred source of truth) or fall back to the
// schema's declared type. Returns { numeric: [...], categorical: [...], date: [...] }
export function categorizeColumns(dataset) {
  const out = { numeric: [], categorical: [], date: [] };
  if (!dataset) return out;
  const stats = dataset.stats || {};
  const schema = dataset.schema || [];
  for (const col of schema) {
    const t = stats[col.name]?.type;
    if (t === "numeric") out.numeric.push(col.name);
    else if (t === "date") out.date.push(col.name);
    else out.categorical.push(col.name);
  }
  return out;
}

// Filters a column list to columns whose type is in `allowed`.
export function columnsByKind(dataset, allowedKinds) {
  const cats = categorizeColumns(dataset);
  const set = new Set();
  for (const kind of allowedKinds) {
    for (const col of cats[kind] || []) set.add(col);
  }
  return Array.from(set);
}
