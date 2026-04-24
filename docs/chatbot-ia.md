# AtalaIA — Chatbot de inteligencia artificial

AtalaIA es el asistente IA integrado en la plataforma. Aparece como un botón flotante (FAB) en el dashboard y responde preguntas sobre formación, onboarding, comunicados y el uso de la plataforma.

---

## Arquitectura general

```
Usuario escribe mensaje
        │
        ▼
[ChatbotIA.tsx]  ←→  localStorage (historial de mensajes)
  (cliente)
        │  POST /api/chat
        │  { messages, context }
        ▼
[app/api/chat/route.ts]          ← Vercel / Next.js servidor
  buildSystemPrompt(context)
        │  POST /ai/chat
        │  { messages, systemPrompt }
        ▼
[Backend Render]                 ← aquí viven GEMINI_API_KEY y GROQ_API_KEY
        │
        ├──► Google Gemini 2.0 Flash  ──► streaming de tokens
        │         (falla)
        └──► Groq llama-3.3-70b      ──► streaming de tokens
                                              │
                                   pipe del stream sin modificar
                                              │
                                              ▼
                                    ChatbotIA actualiza el mensaje
                                    token a token en pantalla
```

> **Diseño proxy:** `route.ts` construye el `systemPrompt` con el contexto del usuario (nombre, empresa, módulos) y lo reenvía al backend. El backend no necesita conocer al usuario — solo recibe los mensajes y el prompt ya construido.

---

## Componente `ChatbotIA` (`components/ui/ChatbotIA.tsx`)

Es el componente de interfaz del chatbot. Se renderiza en el layout de `/dashboard` y está disponible en toda la sección autenticada.

### Características principales

- **FAB arrastrable**: En escritorio, el botón flotante se puede arrastrar a cualquier posición. La posición se guarda en `localStorage` (`atalaIA-fab-pos`) y se restaura en la siguiente visita.
- **Panel adaptativo**: En móvil, el panel ocupa casi toda la pantalla deslizando desde abajo. En escritorio, flota al lado del FAB.
- **Historial persistente**: Los mensajes se guardan en `localStorage` (`atalaIA-messages`) y se restauran al reabrir el chat.
- **Streaming visible**: Los tokens llegan del servidor y se van añadiendo al texto del mensaje en tiempo real, con un cursor parpadeante.
- **Sugerencias contextuales**: Al abrir el chat por primera vez se muestran 4 sugerencias personalizadas según el rol del usuario y el estado de sus módulos.
- **Rate limiting en cliente**: Máximo 4 mensajes en 10 segundos. Si se supera, se bloquea el envío 5 segundos con un aviso.
- **Punto rojo de actividad**: El FAB muestra un indicador rojo si el usuario tiene módulos pendientes o en progreso.

### Contexto que envía al servidor

Cada mensaje incluye el contexto del usuario para que la IA pueda personalizar las respuestas:

```ts
{
  messages: últimos 10 mensajes del historial,
  context: {
    nombreUsuario:      "Nombre Apellidos",
    empresa:            "Nombre de la empresa",
    rol:                "ROLE_EMPLEADO",
    modulosPendientes:  ["Módulo A", "Módulo B (en progreso)"],
    modulosCompletados: ["Módulo C"],
  }
}
```

---

## Ruta de API (`app/api/chat/route.ts`)

Es una **ruta de servidor de Next.js** que actúa como **proxy** entre el cliente y el backend de Render.

- **Runtime**: `nodejs`
- **Método**: solo acepta `POST`
- **Entrada**: `{ messages: ChatMessage[], context?: {...} }`
- **Proceso**:
  1. Construye el `systemPrompt` personalizado con `buildSystemPrompt(context)`.
  2. Hace `POST` a `${BACKEND_URL}/ai/chat` con `{ messages, systemPrompt }`.
  3. Devuelve el `body` del backend directamente al cliente como pipe, sin bufferizar.
- **Salida**: `ReadableStream` de texto plano (`text/plain; charset=utf-8`).

La variable `BACKEND_URL` (solo servidor) apunta al backend de Render. Fallback automático a la URL de producción si no está definida.

### `buildSystemPrompt(context)`

Función que construye el prompt de sistema personalizado para cada conversación. Define:
- La identidad del asistente (AtalaIA, plataforma Atalayas).
- El contexto del usuario (nombre, empresa, rol, módulos).
- Las reglas de formato de respuesta (negrita, listas, emojis moderados).
- Las instrucciones de comportamiento (no inventar datos, no pedir que inicien sesión, responder en español).

---

## Proveedor de IA — backend de Render

La lógica de conexión con Gemini y Groq **vive en el backend**. El frontend ya no depende de las SDKs `@google/generative-ai` ni `groq-sdk` para el chatbot.

El fichero `lib/ai/provider.ts` queda en el repositorio como referencia histórica pero **ya no se importa desde ningún sitio**. Se puede eliminar junto con sus dependencias del `package.json` una vez el backend tenga el endpoint `/ai/chat` funcionando.

### Contrato del endpoint del backend

```
POST /api/v1/ai/chat
Content-Type: application/json

Body:
{
  "messages":     [{ "role": "user" | "assistant", "content": string }],
  "systemPrompt": string
}

Response:
  Content-Type: text/plain; charset=utf-8
  Body: stream de tokens de texto plano
```

---

## Sugerencias contextuales

Al abrir el chat por primera vez (sin historial previo), el componente muestra 4 sugerencias de preguntas. Las sugerencias se seleccionan aleatoriamente de dos pools:

- **Admins** (`ROLE_ADMIN` / `ROLE_ADMIN_EMPRESA`): preguntas sobre gestión de módulos, progreso de empleados, comunicados...
- **Empleados**: preguntas sobre completar módulos, PRL, comunicados, onboarding...

Si el usuario tiene módulos en progreso o pendientes, se priorizan sugerencias relacionadas con esos módulos concretos.

---

## Variables de entorno necesarias

| Variable | Dónde se configura | Descripción |
|---|---|---|
| `BACKEND_URL` | **Vercel** (solo servidor) | URL base del backend de Render. Sin ella se usa el fallback de producción. |
| `GOOGLE_GEMINI_API_KEY` | **Render** (backend) | Clave para Gemini 2.0 Flash. |
| `GROQ_API_KEY` | **Render** (backend) | Clave para llama-3.3-70b (fallback). |

Ver [variables-de-entorno.md](./variables-de-entorno.md) para la guía completa.

