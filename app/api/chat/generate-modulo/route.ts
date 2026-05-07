export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { chatCompletionStream } from "@/lib/ai/provider"

interface PaginaGenerada {
  tipo: "texto" | "test"
  titulo: string
  contenido: string
  preguntas?: {
    texto: string
    opciones: string[]
    correcta: number
  }[]
}

interface ModuloGenerado {
  nombre: string
  descripcion: string
  categoria: string
  paginas: PaginaGenerada[]
  scriptPodcast: string
  portadaPrompt: string
}

function parseModulo(text: string): ModuloGenerado | null {
  let jsonStr = text.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) jsonStr = objectMatch[0]

  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed.nombre && Array.isArray(parsed.paginas)) {
      return {
        nombre: parsed.nombre,
        descripcion: parsed.descripcion || "",
        categoria: parsed.categoria || "ESPECIFICA",
        paginas: parsed.paginas.map((p: any) => ({
          tipo: p.tipo === "test" ? "test" : "texto",
          titulo: p.titulo || "Página",
          contenido: p.contenido || "",
          preguntas: Array.isArray(p.preguntas)
            ? p.preguntas.map((q: any) => ({
                texto: q.texto || "",
                opciones: Array.isArray(q.opciones) && q.opciones.length >= 2 ? q.opciones : ["Verdadero", "Falso"],
                correcta: typeof q.correcta === "number" ? q.correcta : 0,
              }))
            : undefined,
        })),
        scriptPodcast: parsed.scriptPodcast || "",
        portadaPrompt: parsed.portadaPrompt || parsed.nombre,
      }
    }
  } catch {
    return null
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt } = body as { prompt: string }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 })
    }

    const systemPrompt = `Eres AtalaIA, asistente IA de Atalayas Ciudad Empresarial.
Genera un módulo formativo completo en español a partir de la descripción del usuario.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown:
{
  "nombre": "título del módulo (máx 12 palabras)",
  "descripcion": "2-4 frases describiendo el módulo",
  "categoria": "elegir UNA de: IDENTIDAD, BASICA, ESPECIFICA, DESARROLLO, RECOMPENSAS, COMUNIDAD, CUMPLIMIENTO, LIDERAZGO, TECNICO, SOFT_SKILLS, ONBOARDING",
  "paginas": [
    {
      "tipo": "texto",
      "titulo": "título de la página",
      "contenido": "contenido extenso en español, mínimo 5 párrafos, tono profesional y didáctico. Incluye ejemplos prácticos y explicaciones detalladas."
    },
    {
      "tipo": "test",
      "titulo": "Evaluación del módulo",
      "contenido": "Responde las siguientes preguntas para evaluar tus conocimientos",
      "preguntas": [
        {
          "texto": "pregunta con 4 opciones",
          "opciones": ["opción A", "opción B", "opción C", "opción D"],
          "correcta": 0
        }
      ]
    }
  ],
  "scriptPodcast": "guion extenso para podcast narrado en español, tono conversacional y didáctico. Debe presentar el módulo, explicar los conceptos clave de cada página y cerrar con un resumen. Mínimo 500 palabras, como si fuera un presentador hablando directamente al oyente.",
  "portadaPrompt": "descripción visual en 10-15 palabras en inglés para una imagen de portada representativa del módulo. Ej: 'professional workplace safety training employees factory'"
}

REGLAS:
- Genera SIEMPRE al menos 3 páginas de tipo "texto" y 1 página de tipo "test" al final
- Cada página de texto debe tener contenido sustancial (mínimo 5 párrafos)
- El test debe tener entre 3 y 5 preguntas con 4 opciones cada una
- La categoría debe ser una del listado
- El scriptPodcast debe ser un guion extenso y natural listo para locución
- portadaPrompt son keywords en inglés para buscar una imagen
- No incluyas markdown ni texto adicional, solo el JSON`

    let fullText = ""

    try {
      await chatCompletionStream(
        [{ role: "user", content: prompt }],
        systemPrompt,
        (chunk) => { fullText += chunk }
      )
    } catch (error) {
      console.error("[generate-modulo] Error del proveedor IA:", error)
      return NextResponse.json(
        { error: "Error al conectar con el servicio de IA." },
        { status: 500 }
      )
    }

    const parsed = parseModulo(fullText)

    if (!parsed) {
      console.error("[generate-modulo] No se pudo parsear:", fullText.substring(0, 300))
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Intenta con un prompt diferente." },
        { status: 422 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("[generate-modulo] Error:", error)
    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "La solicitud tardó demasiado. Inténtalo en unos segundos." },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
