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

    const prompt = `Genera un documento extenso y profesional sobre: "${titulo}"

Descripción del comunicado: ${descripcion}
Tipo: ${tipo}

El documento debe incluir:
1. Resumen ejecutivo (2-3 párrafos)
2. Introducción detallada
3. Objetivos y beneficios principales (mínimo 5 puntos)
4. Implementación y pasos recomendados
5. Consideraciones importantes
6. Recursos y referencias
7. Conclusión

Formato:
- Usa párrafos bien estructurados
- Máximo 2000-3000 palabras
- Tono profesional pero accesible
- Incluye ejemplos prácticos cuando sea relevante`

    const systemPrompt = `Eres un experto en crear documentos corporativos profesionales. 
Genera contenido detallado, bien estructurado y fácil de entender para empleados de empresas.
Siempre en español.`

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

// ARREGLO: Ya no devolvemos un Buffer, devolvemos un ArrayBuffer puro
function generarPdfDesdeContenido(titulo: string, contenido: string): ArrayBuffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 15
  const marginY = 15
  const maxWidth = pageWidth - 2 * marginX

  // Título
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  const titleLines = doc.splitTextToSize(titulo, maxWidth)
  let yPosition = marginY

  titleLines.forEach((line: string) => {
    doc.text(line, marginX, yPosition)
    yPosition += 10
  })

  // Línea divisoria
  yPosition += 5
  doc.setDrawColor(41, 128, 185)
  doc.line(marginX, yPosition, pageWidth - marginX, yPosition)
  yPosition += 10

  // Contenido
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  const bodyLines = doc.splitTextToSize(contenido, maxWidth)

  bodyLines.forEach((line: string) => {
    if (yPosition + 7 > pageHeight - marginY) {
      doc.addPage()
      yPosition = marginY
    }
    doc.text(line, marginX, yPosition)
    yPosition += 7
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - marginY + 5,
      { align: "center" }
    )
    doc.text(
      `Documento generado por AtalaIA - ${new Date().toLocaleDateString("es-ES")}`,
      marginX,
      pageHeight - marginY + 5,
      { align: "left" }
    )
  }

  // Devolvemos el ArrayBuffer directamente sin pasar por Node Buffer
  return doc.output("arraybuffer");
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

    // Generar contenido con IA
    const contenido = await generarContenidoIA(body.titulo, body.descripcion, body.tipo || "general")

    // Generar PDF
    const arrayBuffer = generarPdfDesdeContenido(body.titulo, contenido)

    // ARREGLO: Convertir a Uint8Array que es perfectamente asimilable por NextResponse en Edge
    const uint8Array = new Uint8Array(arrayBuffer);

    // Devolver como descarga
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
