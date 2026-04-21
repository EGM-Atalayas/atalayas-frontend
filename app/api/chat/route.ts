export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { chatCompletion, ChatMessage } from "@/lib/ai/provider"

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
      return NextResponse.json({ error: "No hay mensajes" }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(context ?? {})
    const response = await chatCompletion(messages, systemPrompt)

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("[/api/chat] Error:", error)
    return NextResponse.json(
      { error: "Error al procesar la consulta. Inténtalo de nuevo." },
      { status: 500 }
    )
  }
}
