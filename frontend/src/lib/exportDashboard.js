import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// ---------- shared helpers ----------

function safeFilename(name) {
  let base = (name || "dashboard").toString().trim();
  // Strip common file extensions if present at the end.
  base = base.replace(/\.(csv|xlsx|xls|json|txt|pdf|png)$/i, "");
  return (
    base
      .replace(/[^a-zA-Z0-9-_.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "dashboard"
  );
}

function dateSuffix() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function withDate(name, ext) {
  return `${safeFilename(name)}-${dateSuffix()}.${ext}`;
}

function getBackgroundColor() {
  if (typeof window === "undefined") return "#f6f4ee";
  const root = getComputedStyle(document.documentElement);
  const bg = root.getPropertyValue("--background")?.trim();
  return bg || "#f6f4ee";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- image capture (PNG/PDF) ----------

// Wait for any pending web fonts before capture so the screenshot uses
// Geist / Instrument Sans / JetBrains Mono instead of a fallback. Without
// this, the first render after a hard refresh sometimes captures with a
// system font and the export looks visibly off.
async function waitForFonts() {
  if (typeof document === "undefined") return;
  if (document.fonts && typeof document.fonts.ready?.then === "function") {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore — best effort */
    }
  }
}

async function captureNode(node) {
  if (!node) throw new Error("Nothing to export");
  await waitForFonts();
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 3, // bumped from 2 — crisper text when zoomed
    backgroundColor: getBackgroundColor(),
    style: { padding: "32px" },
    filter: (el) =>
      !(el instanceof HTMLElement && el.dataset?.exportHide === "true"),
  });
}

export async function exportPNG(node, name) {
  const dataUrl = await captureNode(node);
  downloadDataUrl(dataUrl, withDate(name, "png"));
}

export async function exportPDF(node, name) {
  const dataUrl = await captureNode(node);

  // Measure the PNG so we know the source aspect ratio.
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const scale = pageW / img.width;
  const scaledH = img.height * scale;

  if (scaledH <= pageH) {
    pdf.addImage(dataUrl, "PNG", 0, 0, pageW, scaledH);
  } else {
    const totalPages = Math.ceil(scaledH / pageH);
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, -i * pageH, pageW, scaledH);
    }
  }

  // Tag PDF metadata so the file is identifiable later.
  pdf.setProperties({
    title: safeFilename(name),
    author: "Datuma",
    creator: "Datuma",
    subject: "Data dashboard",
  });

  pdf.save(withDate(name, "pdf"));
}

// ---------- data export (CSV / JSON) ----------

// Escape a single CSV cell. Wraps in quotes if it contains comma, quote, or
// newline; doubles internal quotes per RFC 4180.
function csvCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values) {
  return values.map(csvCell).join(",");
}

// Build a CSV section per chart. Single-series charts get `x,y` columns;
// multi-series charts get `x, series1, series2, …` columns.
function chartToCsvSection(chart) {
  const data = chart.data ?? [];
  const series = chart.series;
  const isMulti = Array.isArray(series) && series.length > 0;

  const headerCols = isMulti
    ? ["x", ...series]
    : [chart.xAxis || "x", chart.yAxis || "y"];

  const rows = data.map((d) =>
    isMulti
      ? csvRow([d.x, ...series.map((k) => d[k] ?? "")])
      : csvRow([d.x, d.y])
  );

  const titleLine = `# ${chart.title || "Chart"} (${chart.type}${
    chart.aggregation ? `, ${chart.aggregation}` : ""
  })`;
  const explanationLine = chart.explanation ? `# ${chart.explanation}` : null;

  return [
    titleLine,
    explanationLine,
    csvRow(headerCols),
    ...rows,
  ]
    .filter(Boolean)
    .join("\n");
}

// Build a CSV section for the metrics block so the underlying numbers are
// captured even though they're not in the charts.
function metricsToCsvSection(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) return null;
  const rows = metrics.map((m) =>
    csvRow([m.label, m.value, m.trend ?? "", m.trendValue ?? "", m.computation ?? ""])
  );
  return [
    "# Headline metrics",
    csvRow(["label", "value", "trend", "trendValue", "computation"]),
    ...rows,
  ].join("\n");
}

export function exportCSV(dashboard, name) {
  if (!dashboard) throw new Error("No dashboard data to export");

  const sections = [];
  const metricsSection = metricsToCsvSection(dashboard.metrics);
  if (metricsSection) sections.push(metricsSection);

  (dashboard.charts || []).forEach((c) => {
    sections.push(chartToCsvSection(c));
  });

  const body = sections.join("\n\n");
  // Lead with a UTF-8 BOM so Excel opens it with the correct encoding.
  const blob = new Blob(["﻿" + body], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, withDate(name, "csv"));
}

export function exportJSON(dashboard, name) {
  if (!dashboard) throw new Error("No dashboard data to export");
  const body = JSON.stringify(dashboard, null, 2);
  const blob = new Blob([body], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, withDate(name, "json"));
}
