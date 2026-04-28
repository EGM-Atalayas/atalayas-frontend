export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { chatCompletionStream, ChatMessage } from "@/lib/ai/provider"
import jsPDF from "jspdf"

interface GeneratePdfRequest {
  titulo: string
  descripcion: string
  tipo: string
  contexto?: string
}

async function generarContenidoIA(titulo: string, descripcion: string, tipo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let contenido = ""

    const prompt = `Genera un documento corporativo completo y extenso sobre: "${titulo}"

Descripción: ${descripcion}
Tipo de documento: ${tipo}

ESTRUCTURA OBLIGATORIA (desarrolla cada sección con detalle):

1. RESUMEN EJECUTIVO
Escribe 3-4 párrafos explicando el propósito, alcance e importancia del documento.

2. INTRODUCCIÓN
Escribe 3-4 párrafos con el contexto, antecedentes y motivación del comunicado.

3. OBJETIVOS PRINCIPALES
Lista y explica detalladamente al menos 6 objetivos concretos y medibles.

4. DESARROLLO Y CONTENIDO PRINCIPAL
Escribe 5-6 párrafos desarrollando en profundidad el tema principal con ejemplos prácticos y casos de uso reales.

5. IMPLEMENTACIÓN PASO A PASO
Detalla al menos 8 pasos concretos para llevar a cabo lo descrito, con explicación de cada uno.

6. BENEFICIOS Y RESULTADOS ESPERADOS
Lista y explica al menos 6 beneficios concretos para los empleados y la empresa.

7. CONSIDERACIONES Y BUENAS PRÁCTICAS
Escribe 4-5 párrafos con recomendaciones, advertencias y mejores prácticas.

8. PREGUNTAS FRECUENTES
Incluye al menos 5 preguntas frecuentes con sus respuestas detalladas.

9. RECURSOS Y REFERENCIAS
Lista recursos, herramientas y referencias útiles relacionadas con el tema.

10. CONCLUSIÓN
Escribe 2-3 párrafos de cierre con los puntos clave y llamada a la acción.

IMPORTANTE:
- Desarrolla TODAS las secciones con contenido real y útil
- Mínimo 3000 palabras en total
- Tono profesional pero cercano
- En español
- No uses formato markdown, solo texto plano con los títulos de sección en mayúsculas`

    const systemPrompt = `Eres un experto redactor de documentos corporativos profesionales en español. 
Tu objetivo es generar documentos COMPLETOS, EXTENSOS y de ALTA CALIDAD.
NUNCA dejes una sección incompleta. NUNCA te cortes a mitad de un párrafo.
Genera siempre el documento completo de principio a fin sin omitir ninguna sección.`

    try {
      const messages: ChatMessage[] = [
        { role: "user", content: prompt },
      ]

      chatCompletionStream(messages, systemPrompt, (chunk) => {
        contenido += chunk
      })
        .then(() => {
          resolve(contenido)
        })
        .catch((error) => {
          console.error("[Genera contenido IA] Error:", error)
          reject(error)
        })
    } catch (error) {
      reject(error)
    }
  })
}

function generarPdfDesdeContenido(titulo: string, contenido: string): ArrayBuffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX    = 18
  const marginY    = 20
  const maxWidth   = pageWidth - 2 * marginX
  const lineHeight = 6.5
  const footerY    = pageHeight - 12

  // ── Función para añadir footer a la página actual ──────────────────────────
  function addFooter(pageNum: number, totalPages: number) {
    doc.setPage(pageNum)
    doc.setFontSize(8.5)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(160, 160, 160)
    doc.setDrawColor(200, 200, 200)
    doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3)
    doc.text(
      `Documento generado por AtalaIA · ${new Date().toLocaleDateString("es-ES")}`,
      marginX,
      footerY + 2
    )
    doc.text(
      `Página ${pageNum} de ${totalPages}`,
      pageWidth - marginX,
      footerY + 2,
      { align: "right" }
    )
  }

  // ── Función para verificar espacio y añadir página si hace falta ───────────
  function checkPageBreak(y: number, needed: number = lineHeight): number {
    if (y + needed > footerY - 6) {
      doc.addPage()
      return marginY
    }
    return y
  }

  let y = marginY

  // ── PORTADA ────────────────────────────────────────────────────────────────
  // Fondo azul oscuro
  doc.setFillColor(13, 27, 46)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // Franja decorativa
  doc.setFillColor(37, 99, 235)
  doc.rect(0, pageHeight * 0.42, pageWidth, 3, "F")

  // Logo/nombre empresa
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(148, 163, 184)
  doc.text("ATALAYAS CIUDAD EMPRESARIAL", pageWidth / 2, 28, { align: "center" })

  // Título principal
  doc.setFontSize(26)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  const tituloLines = doc.splitTextToSize(titulo.toUpperCase(), maxWidth - 10)
  let tY = pageHeight * 0.32
  tituloLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, tY, { align: "center" })
    tY += 12
  })

  // Subtítulo
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(148, 163, 184)
  doc.text("Documento corporativo generado por AtalaIA", pageWidth / 2, tY + 10, { align: "center" })

  // Fecha
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  const fecha = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  doc.text(fecha, pageWidth / 2, pageHeight * 0.78, { align: "center" })

  // ── CONTENIDO ──────────────────────────────────────────────────────────────
  doc.addPage()
  y = marginY

  // Resetear colores para páginas de contenido
  doc.setTextColor(30, 41, 59)

  // Dividir el contenido en líneas respetando secciones
  const lineas = contenido.split("\n")

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim()
    if (!linea) {
      y += lineHeight * 0.5 // espacio entre párrafos
      continue
    }

    // Detectar títulos de sección (líneas en mayúsculas o numeradas tipo "1. TITULO")
    const esTitulo = /^(\d+\.\s+)?[A-ZÁÉÍÓÚÑ\s]{6,}$/.test(linea) && linea.length < 80
    const esSubtitulo = /^(\d+\.\d+|\-\s|\•\s)/.test(linea)

    if (esTitulo) {
      // Espacio antes del título
      y += lineHeight

      y = checkPageBreak(y, 16)

      // Fondo del título
      doc.setFillColor(239, 246, 255)
      doc.roundedRect(marginX - 3, y - 5, maxWidth + 6, 10, 2, 2, "F")
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.5)
      doc.line(marginX - 3, y - 5, marginX - 3, y + 5)

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 64, 175)
      doc.text(linea, marginX + 2, y + 1)
      doc.setTextColor(30, 41, 59)
      doc.setLineWidth(0.2)
      y += lineHeight + 3

    } else if (esSubtitulo) {
      y = checkPageBreak(y, lineHeight + 2)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(51, 65, 85)
      const subLines = doc.splitTextToSize(linea, maxWidth)
      subLines.forEach((sl: string) => {
        y = checkPageBreak(y)
        doc.text(sl, marginX, y)
        y += lineHeight
      })
      doc.setFont("helvetica", "normal")
      doc.setTextColor(30, 41, 59)

    } else {
      // Párrafo normal
      doc.setFontSize(10.5)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 65, 85)
      const paraLines = doc.splitTextToSize(linea, maxWidth)
      paraLines.forEach((pl: string) => {
        y = checkPageBreak(y)
        doc.text(pl, marginX, y)
        y += lineHeight
      })
    }
  }

  // ── FOOTERS en todas las páginas ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  // La página 1 es la portada, sin footer
  for (let p = 2; p <= totalPages; p++) {
    addFooter(p, totalPages - 1) // -1 para no contar portada
  }

  return doc.output("arraybuffer")
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GeneratePdfRequest

    if (!body.titulo || !body.descripcion) {
      return NextResponse.json(
        { error: "Título y descripción son requeridos" },
        { status: 400 }
      )
    }

    const contenido = await generarContenidoIA(body.titulo, body.descripcion, body.tipo || "general")

    const arrayBuffer = generarPdfDesdeContenido(body.titulo, contenido)
    const uint8Array  = new Uint8Array(arrayBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comunicado_${Date.now()}.pdf"`,
        "Content-Length": uint8Array.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[/api/comunicados-pdf] Error:", error)
    return NextResponse.json(
      { error: "Error al generar el PDF. Intenta de nuevo." },
      { status: 500 }
    )
  }
}