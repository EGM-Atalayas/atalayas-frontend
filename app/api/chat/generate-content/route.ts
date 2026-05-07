export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { chatCompletionStream } from "@/lib/ai/provider"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// --- Parsear JSON del texto ---
function parseGeneratedContent(text: string): {
  titulo: string
  descripcion: string
  resumen: string
  etiquetas: string[]
} | null {
  // Intentar extraer JSON del texto (puede venir con markdown ```json ... ```)
  let jsonStr = text.trim()

  // Si viene envuelto en markdown, extraer solo el JSON
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // También buscar si hay un objeto JSON en el texto
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    jsonStr = objectMatch[0]
  }

  try {
    const parsed = JSON.parse(jsonStr)

    // Validar que tenga los campos mínimos
    if (parsed.titulo || parsed.title) {
      return {
        titulo: parsed.titulo || parsed.title || "",
        descripcion: parsed.descripcion || parsed.description || "",
        resumen: parsed.resumen || parsed.summary || "",
        etiquetas: Array.isArray(parsed.etiquetas || parsed.tags)
          ? (parsed.etiquetas || parsed.tags).slice(0, 3)
          : [],
      }
    }
  } catch (e) {
    console.error("Error parseando JSON:", e)
    console.log("Texto recibido:", text.substring(0, 500))
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, systemPrompt: customSystemPrompt } = body as {
      prompt: string
      systemPrompt?: string
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // System prompt por defecto para generación de contenido
    const systemPrompt =
      customSystemPrompt ??
      `Eres AtalaIA, asistente IA de Atalayas Ciudad Empresarial. 
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown:
{"titulo":"texto corto (máx 10 palabras)","descripcion":"2-4 frases en español, tono profesional","resumen":"máximo 20 palabras","etiquetas":["tag1","tag2","tag3"]}`

    // ── Usar proveedor IA local (Gemini o Groq) ────────────────────────────────
    console.log("[/api/chat/generate-content] Usando proveedor IA local para generar contenido")

    let fullText = ""
    
    try {
      await chatCompletionStream(
        [{ role: "user", content: prompt }],
        systemPrompt,
        (chunk) => {
          fullText += chunk
        }
      )
    } catch (error) {
      console.error("[/api/chat/generate-content] Error del proveedor IA:", error)
      const mensaje = error instanceof Error ? error.message : "Error desconocido"
      return new Response(
        JSON.stringify({
          error: `Error de IA: ${mensaje}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log("Texto acumulado:", fullText.substring(0, 200) + "...")

    // Parsear el JSON del texto acumulado
    const parsed = parseGeneratedContent(fullText)

    if (!parsed) {
      console.error("No se pudo parsear el contenido generado")
      return new Response(
        JSON.stringify({
          error: "La IA no devolvió el formato esperado. Intenta con un prompt diferente.",
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      )
    }

    // Devolver el JSON estructurado al frontend
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[/api/chat/generate-content] Error:", error)

    // Manejar timeout específicamente
    if (error.name === "TimeoutError") {
      return new Response(
        JSON.stringify({
          error: "La solicitud tardó demasiado. El servicio de IA puede estar ocupado. Inténtalo en unos segundos.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      )
    }

    const mensaje = error instanceof Error ? error.message : "Error interno del servidor."
    return new Response(
      JSON.stringify({ error: mensaje }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}