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

function repararJson(texto: string): string {
  let limpio = texto.trim()
  // Quitar bloques de código markdown
  const codeMatch = limpio.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeMatch) limpio = codeMatch[1].trim()
  // Encontrar el primer { y trabajar desde ahí
  const start = limpio.indexOf("{")
  if (start === -1) return texto
  limpio = limpio.slice(start)
  // Eliminar comentarios de una línea (//...)
  limpio = limpio.replace(/\/\/.*$/gm, "")
  // Eliminar trailing commas antes de ] o }
  limpio = limpio.replace(/,(\s*[}\]])/g, "$1")
  // Balancear llaves y corchetes (por si la respuesta se truncó)
  const abiertos = (limpio.match(/\{/g) || []).length
  const cerrados = (limpio.match(/\}/g) || []).length
  if (cerrados < abiertos) limpio += "}".repeat(abiertos - cerrados)
  const arrayAbiertos = (limpio.match(/\[/g) || []).length
  const arrayCerrados = (limpio.match(/\]/g) || []).length
  if (arrayCerrados < arrayAbiertos) limpio += "]".repeat(arrayAbiertos - arrayCerrados)
  // Cortar después del último } balanceado
  const lastClose = limpio.lastIndexOf("}")
  if (lastClose > 0) limpio = limpio.slice(0, lastClose + 1)
  return limpio
}

function extraerCampo(texto: string, clave: string): string | null {
  const re = new RegExp(`"${clave}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  const m = texto.match(re)
  return m ? m[1] : null
}

function parseModulo(text: string): ModuloGenerado | null {
  const jsonStr = repararJson(text)

  // Intentar JSON.parse con el texto reparado
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
  } catch { /* ignorar, intentar fallback */ }

  // Fallback: extraer campos individuales por regex
  try {
    const nombre = extraerCampo(jsonStr, "nombre") || extraerCampo(jsonStr, "title")
    if (!nombre) return null
    const descripcion = extraerCampo(jsonStr, "descripcion") || extraerCampo(jsonStr, "description") || ""
    const categoria = extraerCampo(jsonStr, "categoria") || "ESPECIFICA"
    const scriptPodcast = extraerCampo(jsonStr, "scriptPodcast") || ""
    const portadaPrompt = extraerCampo(jsonStr, "portadaPrompt") || nombre

    // Extraer array de páginas
    const pagesMatch = jsonStr.match(/"paginas"\s*:\s*(\[[\s\S]*?(?:\]\s*[,\}]|\]$))/)
    let paginas: PaginaGenerada[] = []
    if (pagesMatch) {
      try {
        const paginasRaw = JSON.parse(pagesMatch[1])
        if (Array.isArray(paginasRaw)) {
          paginas = paginasRaw.map((p: any) => ({
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
          }))
        }
      } catch { /* intentar sin parsear cada página individual */ }
    }

    return { nombre, descripcion, categoria, paginas, scriptPodcast, portadaPrompt }
  } catch { /* ignora */ }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt } = body as { prompt: string }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 })
    }

    const systemPrompt = `Eres AtalaIA y generas módulos formativos en español.
Responde ÚNICAMENTE con JSON puro, sin markdown, sin texto adicional.

CATEGORIAS validas (elige UNA): GENERAL, ESPECIALIZADO, ESPECIALIZADO_IA, CUMPLIMIENTO, ONBOARDING

{
  "nombre": "título corto del módulo",
  "descripcion": "2-3 frases",
  "categoria": "GENERAL",
  "paginas": [
    {
      "tipo": "texto",
      "titulo": "título de página",
      "contenido": "2-3 párrafos en español"
    },
    {
      "tipo": "texto",
      "titulo": "otro título",
      "contenido": "2-3 párrafos en español"
    },
    {
      "tipo": "test",
      "titulo": "Evaluación",
      "contenido": "Responde las preguntas",
      "preguntas": [
        {
          "texto": "pregunta con 4 opciones",
          "opciones": ["A", "B", "C", "D"],
          "correcta": 0
        }
      ]
    }
  ],
  "scriptPodcast": "guion corto para podcast, 2-3 párrafos en español",
  "portadaPrompt": "keywords en inglés para imagen de portada"
}

REGLAS:
- 2 páginas de texto y 1 test al final (mínimo)
- Test: 3 preguntas, 4 opciones cada una
- Sin markdown, sin texto adicional, SOLO el JSON`

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
