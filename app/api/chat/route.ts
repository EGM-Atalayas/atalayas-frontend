export const runtime = "nodejs"

import { NextRequest } from "next/server"
import { chatCompletionStream, ChatMessage } from "@/lib/ai/provider"

const BACKEND_URL =
  process.env.BACKEND_URL ??
  "https://atalayas-backend-c25d.onrender.com/api/v1"

function buildSystemPrompt(context: {
  nombreUsuario?: string
  empresa?: string
  rol?: string
  modulosPendientes?: string[]
  modulosCompletados?: string[]
}): string {
  const { nombreUsuario, empresa, rol, modulosPendientes = [], modulosCompletados = [] } = context

  const modulosInfo = modulosPendientes.length === 0 && modulosCompletados.length === 0
    ? "El usuario aún no tiene módulos asignados o no se han podido cargar."
    : `Completados: ${modulosCompletados.length > 0 ? modulosCompletados.join(", ") : "ninguno aún"}\nPendientes/en progreso: ${modulosPendientes.length > 0 ? modulosPendientes.join(", ") : "ninguno"}`

  return `Eres AtalaIA, el asistente IA de Atalayas Ciudad Empresarial — plataforma de onboarding y formación para empresas del área empresarial de Alicante.
Tu misión es ayudar a los empleados con sus formaciones, comunicados, dudas sobre la plataforma y normas del área empresarial.

CONTEXTO DEL USUARIO:
- Nombre: ${nombreUsuario ?? "Empleado"}
- Empresa: ${empresa ?? "Atalayas Ciudad Empresarial"}
- Rol: ${rol ?? "Empleado"}
- Módulos:
${modulosInfo}

FORMATO DE RESPUESTA:
- Usa **negrita** para conceptos importantes.
- Usa listas con "-" cuando enumeres varios puntos (3 o más).
- Separa párrafos con una línea en blanco.
- Usa emojis con moderación para hacer la conversación más amigable.
- Respuestas cortas (2-4 frases) para preguntas simples. Más detalle solo si se necesita.

INSTRUCCIONES:
- Responde siempre en español, de forma clara, cercana y profesional.
- El usuario ya está autenticado y dentro de la plataforma. Nunca le digas que "inicie sesión" — asume que ya lo está.
- Llama al usuario por su nombre de vez en cuando para personalizar la conversación, pero sin abusar.
- Para preguntas simples responde en 1-2 frases. Solo usa listas numeradas si hay 3 o más pasos realmente necesarios.
- Si el usuario pregunta por sus formaciones, usa únicamente el contexto real de arriba. No inventes módulos.
- Si no sabes algo específico de la empresa, sé honesto y sugiere contactar con el administrador o RRHH.
- Nunca inventes datos concretos (fechas, normativas específicas) que no estén en el contexto.
- Temas en los que puedes ayudar: formación, onboarding, PRL básica, comunicados, uso de la plataforma.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, context } = body as {
      messages: ChatMessage[]
      context?: {
        nombreUsuario?: string
        empresa?: string
        rol?: string
        modulosPendientes?: string[]
        modulosCompletados?: string[]
      }
    }

    if (!messages || messages.length === 0) {
      return new Response("No hay mensajes", { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context ?? {})

    // ── Proxy al backend de Render ────────────────────────────────────────────
    // El backend tiene las claves de IA (Gemini / Groq) y devuelve el stream.
    // Si falla, usamos el proveedor local como fallback.
    let usarBackend = true
    let backendRes: Response | null = null

    try {
      backendRes = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, systemPrompt }),
        signal: AbortSignal.timeout(15000),
      })
    } catch {
      console.warn("[/api/chat] Backend no respondió, usando proveedor local")
      usarBackend = false
    }

    if (usarBackend && backendRes?.ok && backendRes.body) {
      return new Response(backendRes.body, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    // ── Fallback: proveedor IA local (Gemini → Groq) ─────────────────────────
    console.warn("[/api/chat] Usando proveedor IA local como fallback")

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chatCompletionStream(messages, systemPrompt, (chunk) =>
            controller.enqueue(new TextEncoder().encode(chunk))
          )
        } catch (error) {
          console.error("[/api/chat] Fallback IA local falló:", error)
          const mensaje = error instanceof Error ? error.message : "Error desconocido"
          controller.enqueue(
            new TextEncoder().encode(
              `Error de IA: ${mensaje}`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("[/api/chat] Error:", error)
    const mensaje = error instanceof Error ? error.message : "Error al procesar la consulta."
    return new Response(mensaje, { status: 500 })
  }
}
