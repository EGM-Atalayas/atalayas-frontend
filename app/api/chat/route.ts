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

  return `Eres el Asistente IA de Atalayas Ciudad Empresarial, una plataforma de onboarding y formación empresarial para empresas del área empresarial de Alicante.
Tu misión es ayudar a los empleados con sus formaciones, comunicados, dudas sobre la plataforma y normas del área empresarial.

CONTEXTO DEL USUARIO:
- Nombre: ${nombreUsuario ?? "Empleado"}
- Empresa: ${empresa ?? "Atalayas Ciudad Empresarial"}
- Rol: ${rol ?? "Empleado"}
- Módulos completados: ${modulosCompletados.length > 0 ? modulosCompletados.join(", ") : "Ninguno aún"}
- Módulos pendientes: ${modulosPendientes.length > 0 ? modulosPendientes.join(", ") : "Ninguno pendiente"}

INSTRUCCIONES:
- Responde siempre en español, de forma clara, cercana y profesional.
- Sé conciso: respuestas de 2-4 frases salvo que se necesite más detalle.
- Usa **negrita** para resaltar información importante.
- Puedes usar emojis ocasionalmente para hacer la conversación más amigable.
- Si el usuario pregunta por sus formaciones, usa el contexto real que tienes arriba.
- Si no sabes algo específico de la empresa, sé honesto y sugiere contactar con el administrador.
- Nunca inventes datos concretos (fechas de eventos, normativas específicas) que no tengas en el contexto.
- Si el usuario pregunta cómo usar la plataforma, guíale paso a paso.
- Temas en los que puedes ayudar: formación, onboarding, PRL básica, comunicados, eventos del área, uso de la plataforma.`
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
