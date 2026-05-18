import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

function safeFilename(name) {
  return (name || "dashboard")
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-_.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "dashboard";
}

function getBackgroundColor() {
  if (typeof window === "undefined") return "#f6f4ee";
  const root = getComputedStyle(document.documentElement);
  const bg = root.getPropertyValue("--background")?.trim();
  return bg || "#f6f4ee";
}

async function captureNode(node) {
  if (!node) throw new Error("Nothing to export");
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: getBackgroundColor(),
    style: { padding: "32px" },
    filter: (el) =>
      !(el instanceof HTMLElement && el.dataset?.exportHide === "true"),
  });
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPNG(node, name) {
  const dataUrl = await captureNode(node);
  downloadDataUrl(dataUrl, `${safeFilename(name)}.png`);
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

  // Fit the image to the page width and slice it into pageH-tall chunks.
  const scale = pageW / img.width;
  const scaledH = img.height * scale;

  if (scaledH <= pageH) {
    pdf.addImage(dataUrl, "PNG", 0, 0, pageW, scaledH);
  } else {
    // Multi-page: render full image, offset by -(pageH * pageIndex) each iteration.
    const totalPages = Math.ceil(scaledH / pageH);
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, -i * pageH, pageW, scaledH);
    }
  }

  pdf.save(`${safeFilename(name)}.pdf`);
}
