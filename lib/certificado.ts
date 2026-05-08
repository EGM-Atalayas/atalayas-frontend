import jsPDF from "jspdf";

interface CertificadoData {
  nombreEmpleado: string;
  apellidosEmpleado?: string;
  nombreModulo: string;
  tipoModulo?: string;
  nombreEmpresa?: string;
  fechaCompletado: Date;
}

export function generarCertificadoPDF(data: CertificadoData): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Fondo blanco ─────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── Borde exterior doble ─────────────────────────────────────
  doc.setDrawColor(27, 63, 126);
  doc.setLineWidth(2);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.5);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // ── Líneas decorativas doradas ───────────────────────────────
  doc.setDrawColor(184, 157, 86);
  doc.setLineWidth(1);
  doc.line(30, 24, pageWidth - 30, 24);
  doc.line(30, pageHeight - 24, pageWidth - 30, pageHeight - 24);

  // ── Título "CERTIFICADO" ─────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(27, 63, 126);
  doc.text("CERTIFICADO", pageWidth / 2, 42, { align: "center" });

  // ── Subtítulo ────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text("DE FINALIZACIÓN DE FORMACIÓN", pageWidth / 2, 52, { align: "center" });

  // ── Texto introductorio ──────────────────────────────────────
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("Se certifica que", pageWidth / 2, 72, { align: "center" });

  // ── Nombre del empleado (destacado) ──────────────────────────
  const nombreCompleto = `${data.nombreEmpleado}${data.apellidosEmpleado ? ` ${data.apellidosEmpleado}` : ""}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(27, 63, 126);
  doc.text(nombreCompleto, pageWidth / 2, 86, { align: "center" });

  // ── Línea debajo del nombre ──────────────────────────────────
  const nombreWidth = doc.getTextWidth(nombreCompleto);
  doc.setDrawColor(184, 157, 86);
  doc.setLineWidth(0.8);
  doc.line((pageWidth - nombreWidth) / 2, 90, (pageWidth + nombreWidth) / 2, 90);

  // ── Texto de finalización ────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text("ha completado satisfactoriamente el módulo formativo", pageWidth / 2, 102, { align: "center" });

  // ── Nombre del módulo ────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(45, 125, 78);
  doc.text(data.nombreModulo, pageWidth / 2, 116, { align: "center" });

  // ── Tipo de módulo (si existe) ───────────────────────────────
  if (data.tipoModulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(data.tipoModulo, pageWidth / 2, 126, { align: "center" });
  }

  // ── Empresa (si existe) ──────────────────────────────────────
  if (data.nombreEmpresa) {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Empresa: ${data.nombreEmpresa}`, pageWidth / 2, 138, { align: "center" });
  }

  // ── Fecha ────────────────────────────────────────────────────
  const fechaFormateada = data.fechaCompletado.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Fecha de finalización: ${fechaFormateada}`, pageWidth / 2, pageHeight - 42, { align: "center" });

  // ── Línea de firma (izquierda) ───────────────────────────────
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(50, pageHeight - 55, 110, pageHeight - 55);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Firma del Responsable", 80, pageHeight - 50, { align: "center" });
  doc.text("de Formación", 80, pageHeight - 45, { align: "center" });

  // ── Línea de sello (derecha) ─────────────────────────────────
  doc.line(pageWidth - 110, pageHeight - 55, pageWidth - 50, pageHeight - 55);
  doc.text("Sello de la Empresa", pageWidth - 80, pageHeight - 50, { align: "center" });
  if (data.nombreEmpresa) {
    doc.text(data.nombreEmpresa, pageWidth - 80, pageHeight - 45, { align: "center" });
  }

  // ── Pie de página ────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Atalayas - Parque Empresarial", pageWidth / 2, pageHeight - 18, { align: "center" });

  // ── Esquinas decorativas ─────────────────────────────────────
  doc.setDrawColor(184, 157, 86);
  doc.setLineWidth(1.5);
  const cornerSize = 6;
  // Superior izquierda
  doc.line(11, 11 + cornerSize, 11, 11);
  doc.line(11, 11, 11 + cornerSize, 11);
  // Superior derecha
  doc.line(pageWidth - 11 - cornerSize, 11, pageWidth - 11, 11);
  doc.line(pageWidth - 11, 11, pageWidth - 11, 11 + cornerSize);
  // Inferior izquierda
  doc.line(11, pageHeight - 11 - cornerSize, 11, pageHeight - 11);
  doc.line(11, pageHeight - 11, 11 + cornerSize, pageHeight - 11);
  // Inferior derecha
  doc.line(pageWidth - 11 - cornerSize, pageHeight - 11, pageWidth - 11, pageHeight - 11);
  doc.line(pageWidth - 11, pageHeight - 11 - cornerSize, pageWidth - 11, pageHeight - 11);

  return doc;
}

export function descargarCertificado(data: CertificadoData): void {
  const doc = generarCertificadoPDF(data);
  const nombreArchivo = `certificado-${data.nombreModulo.replace(/\s+/g, "-").toLowerCase()}-${data.fechaCompletado.getFullYear()}.pdf`;
  doc.save(nombreArchivo);
}
