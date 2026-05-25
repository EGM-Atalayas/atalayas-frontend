// ============================================================
// statsExport — exportador genérico de estadísticas a PDF / CSV / XML
//
// Reutilizable desde cualquier pantalla de stats (admin empresa,
// superadmin, etc.). Recibe un conjunto de "secciones" tabulares y
// genera los tres formatos sin lógica acoplada al dominio.
// ============================================================

export interface StatsSection {
  /** Identificador único, usado como tag XML */
  id: string;
  /** Título legible mostrado en PDF y como cabecera CSV */
  title: string;
  /** Cabeceras de la tabla */
  headers: string[];
  /** Filas de datos */
  rows: (string | number)[][];
}

export interface ExportStatsOptions {
  /** Título del documento */
  title: string;
  /** Subtítulo opcional (ej. nombre de la empresa) */
  subtitle?: string;
  /** Línea que describe los filtros activos */
  filtros?: string;
  /** Nombre base del archivo (sin extensión) */
  fileName: string;
  /** Secciones tabulares a exportar */
  sections: StatsSection[];
}

export type ExportFormat = "pdf" | "csv" | "xml";

// ─── Helpers privados ────────────────────────────────────────────────────────

function descargar(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeXml(v: unknown): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsv(v: unknown): string {
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeHtml(v: unknown): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─── Exportadores por formato ────────────────────────────────────────────────

export function exportStatsCsv(opts: ExportStatsOptions) {
  const lines: string[] = [];
  lines.push(`# ${opts.title}`);
  if (opts.subtitle) lines.push(`# ${opts.subtitle}`);
  if (opts.filtros)  lines.push(`# Filtros: ${opts.filtros}`);
  lines.push(`# Generado: ${new Date().toLocaleString("es-ES")}`);
  lines.push("");

  for (const s of opts.sections) {
    lines.push(`## ${s.title}`);
    lines.push(s.headers.map(escapeCsv).join(","));
    for (const row of s.rows) {
      lines.push(row.map(escapeCsv).join(","));
    }
    lines.push("");
  }

  descargar(lines.join("\n"), `${opts.fileName}.csv`, "text/csv;charset=utf-8");
}

export function exportStatsXml(opts: ExportStatsOptions) {
  const sectionsXml = opts.sections.map((s) => {
    const filas = s.rows.map((row) => {
      const cols = s.headers.map((h, i) =>
        `      <col name="${escapeXml(h)}">${escapeXml(row[i] ?? "")}</col>`
      ).join("\n");
      return `    <row>\n${cols}\n    </row>`;
    }).join("\n");
    return `  <section id="${escapeXml(s.id)}" title="${escapeXml(s.title)}">\n${filas}\n  </section>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<reporte>
  <meta>
    <titulo>${escapeXml(opts.title)}</titulo>${opts.subtitle ? `\n    <subtitulo>${escapeXml(opts.subtitle)}</subtitulo>` : ""}${opts.filtros ? `\n    <filtros>${escapeXml(opts.filtros)}</filtros>` : ""}
    <generado>${new Date().toISOString()}</generado>
  </meta>
${sectionsXml}
</reporte>`;

  descargar(xml, `${opts.fileName}.xml`, "application/xml;charset=utf-8");
}

export async function exportStatsPdf(opts: ExportStatsOptions) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const fecha = new Date().toLocaleString("es-ES");
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 14;

  // ── Cabecera ──
  doc.setFillColor(27, 63, 126);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(opts.title, MARGIN, 14);

  if (opts.subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(opts.subtitle, W - MARGIN, 14, { align: "right" });
  }

  // ── Meta ──
  let y = 28;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (opts.filtros) {
    doc.text(`Filtros: ${opts.filtros}`, MARGIN, y);
    y += 5;
  }
  doc.text(`Generado: ${fecha}`, MARGIN, y);
  y += 7;

  // ── Secciones ──
  for (const s of opts.sections) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(s.title, MARGIN, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [s.headers],
      body: s.rows.map(r => r.map(String)),
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 8, cellPadding: 3, textColor: [15, 23, 42] },
      headStyles: { fillColor: [27, 63, 126], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [203, 213, 225],
      tableLineWidth: 0.1,
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 16;
    }
  }

  doc.save(`${opts.fileName}.pdf`);
}

// ─── Función unificada ───────────────────────────────────────────────────────

export async function exportStats(format: ExportFormat, opts: ExportStatsOptions) {
  switch (format) {
    case "pdf": return exportStatsPdf(opts);
    case "csv": return exportStatsCsv(opts);
    case "xml": return exportStatsXml(opts);
  }
}
