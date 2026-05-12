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

export function exportStatsPdf(opts: ExportStatsOptions) {
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;
  const fecha = new Date().toLocaleString("es-ES");

  const sectionsHtml = opts.sections.map((s) => {
    const headRow = s.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const bodyRows = s.rows.map((row) =>
      `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
    ).join("");
    return `
      <h2>${escapeHtml(s.title)}</h2>
      <table><thead><tr>${headRow}</tr></thead><tbody>${bodyRows}</tbody></table>
    `;
  }).join("");

  w.document.write(`
    <html>
      <head>
        <title>${escapeHtml(opts.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
          h1   { font-size: 22px; margin-bottom: 4px; }
          h2   { margin-top: 28px; font-size: 16px; color: #1e293b; }
          p    { color: #475569; margin: 2px 0; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          th   { background: #f8fafc; font-weight: 600; }
          .meta { margin-bottom: 18px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(opts.title)}</h1>
        <div class="meta">
          ${opts.subtitle ? `<p><strong>${escapeHtml(opts.subtitle)}</strong></p>` : ""}
          ${opts.filtros ? `<p>Filtros: ${escapeHtml(opts.filtros)}</p>` : ""}
          <p>Generado: ${escapeHtml(fecha)}</p>
        </div>
        ${sectionsHtml}
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  // Pequeño retardo para asegurar que el documento se ha pintado
  setTimeout(() => w.print(), 250);
}

// ─── Función unificada ───────────────────────────────────────────────────────

export function exportStats(format: ExportFormat, opts: ExportStatsOptions) {
  switch (format) {
    case "pdf": return exportStatsPdf(opts);
    case "csv": return exportStatsCsv(opts);
    case "xml": return exportStatsXml(opts);
  }
}
