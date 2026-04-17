"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "assistant" | "user"
  text: string
  time: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    text: "¡Hola! 👋 Soy el Asistente IA de Atalayas. Puedo ayudarte con tu formación, responder dudas sobre comunicados, PRL o cualquier consulta sobre la plataforma. ¿En qué puedo ayudarte?",
    time: "Ahora",
  },
]

const SUGGESTIONS = [
  "¿Qué formaciones tengo pendientes?",
  "Resumen del último comunicado",
  "Normas de PRL básicas",
  "¿Cómo completo un módulo?",
]

const RESPUESTAS: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ["formacion", "pendiente", "formación", "mis formaciones", "que tengo"],
    response:
      "Tienes **3 formaciones pendientes**: *Comunicación Efectiva*, *Herramientas Digitales* y *Ciberseguridad y Protección de Datos*. Te recomiendo empezar por **Comunicación Efectiva**, ya que es la base para el resto. ¿Quieres acceder directamente?",
  },
  {
    keywords: ["progreso", "avance", "completado", "cuanto llevo", "cuánto llevo"],
    response:
      "Tu progreso actual: ✅ *Incorporación y Bienvenida* — **100% completado** 🔄 *Negociación y Habilidades Directivas* — **60% en progreso** ⏳ *Comunicación Efectiva* — **pendiente**. ¡Vas por buen camino! Tienes 1 módulo completado esta semana.",
  },
  {
    keywords: ["comunicado", "noticia", "anuncio"],
    response:
      "El último comunicado es del 14 de abril: *'Actualización del protocolo de acceso al parking'*. A partir del 1 de mayo se requerirá tarjeta de empresa para acceder. También hay un anuncio sobre la **Jornada de Networking del 24 de mayo**. ¿Quieres más detalles de alguno?",
  },
  {
    keywords: ["prl", "riesgo", "seguridad", "prevencion", "prevención"],
    response:
      "Las normas básicas de PRL en el área empresarial EGM: ✅ Uso de EPI en zonas señalizadas ✅ Comunicar cualquier incidente al responsable ✅ No manipular equipos sin formación específica ✅ Mantener las salidas de emergencia despejadas ✅ Velocidad máxima en el parking: 10 km/h. ¿Necesitas información sobre alguna norma específica?",
  },
  {
    keywords: ["modulo", "completar", "módulo", "como funciona", "cómo funciona"],
    response:
      "Para completar un módulo: 1️⃣ Accede a **Formación** en el menú lateral 2️⃣ Selecciona el módulo que quieres realizar 3️⃣ Completa cada sección en orden 4️⃣ Responde el cuestionario final (mínimo 2/3 aciertos). ¡El progreso se guarda automáticamente y puedes continuar donde lo dejaste!",
  },
  {
    keywords: ["certificado", "diploma", "logro"],
    response:
      "Al completar cada módulo recibirás un **certificado digital** con tu nombre y la fecha de finalización. Los certificados de los módulos de PRL y Protección de Datos tienen validez oficial. Puedes descargarlos desde tu perfil. 🏆",
  },
  {
    keywords: ["evento", "actividad", "networking", "comunidad"],
    response:
      "Próximos eventos en el área EGM: 📅 **24 de mayo** — Jornada de Networking (42 inscritos) 📅 **Junio** — Team Building entre empresas 📅 **Julio** — Jornada 'En Femenino'. ¿Te apunto a alguno?",
  },
  {
    keywords: ["equipo", "compañero", "empresa"],
    response:
      "Tu empresa tiene actualmente **28 empleados activos**. El progreso medio del equipo en formación es del **67%**. Los módulos con mayor participación son *Onboarding Corporativo* (89%) y *Protección de Datos* (78%). ¿Quieres ver el detalle de algún módulo?",
  },
  {
    keywords: ["hola", "buenas", "buenos días", "buenas tardes"],
    response:
      "¡Hola! 👋 Estoy aquí para ayudarte. Puedo informarte sobre tus **formaciones pendientes**, el **progreso del equipo**, **comunicados** del área, normas de **PRL** o cómo usar la plataforma. ¿Por dónde empezamos?",
  },
  {
    keywords: ["gracias", "perfecto", "genial", "ok"],
    response:
      "¡De nada! 😊 Si necesitas cualquier otra cosa, aquí estaré. ¡Mucho ánimo con la formación!",
  },
]

const DEFAULT_RESPONSE =
  "Entendido. Déjame revisar eso por ti... Mientras tanto, puedes explorar la sección de **Formación** o consultar los **Comunicados** más recientes. Si necesitas algo concreto, intenta preguntarme sobre tu progreso, PRL, comunicados o próximos eventos. 💡"

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getMockResponse(text: string): string {
  const normalized = normalize(text)
  for (const entry of RESPUESTAS) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.response
    }
  }
  return DEFAULT_RESPONSE
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SparkleIcon({ size = 20, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2L13.8 8.2H20.4L15.1 11.9L16.9 18.1L12 14.5L7.1 18.1L8.9 11.9L3.6 8.2H10.2L12 2Z" />
      <path d="M19 2L19.7 4.3H22L20.2 5.6L20.9 7.9L19 6.6L17.1 7.9L17.8 5.6L16 4.3H18.3L19 2Z" opacity="0.7" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #6366f1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <SparkleIcon size={14} />
      </div>
      <div
        style={{
          background: "#f3f4f6",
          borderRadius: "16px 16px 16px 4px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          height: "38px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#9ca3af",
              animation: "chatbotBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function renderText(text: string) {
  // Render **bold** and *italic* markdown inline
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant"

  if (isAssistant) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <SparkleIcon size={14} />
        </div>
        <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div
            style={{
              background: "#f3f4f6",
              borderRadius: "16px 16px 16px 4px",
              padding: "10px 14px",
              fontSize: "13px",
              lineHeight: "1.5",
              color: "#1f2937",
            }}
          >
            {renderText(message.text)}
          </div>
          <span style={{ fontSize: "10px", color: "#9ca3af", paddingLeft: "4px" }}>{message.time}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: "12px",
      }}
    >
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            borderRadius: "16px 16px 4px 16px",
            padding: "10px 14px",
            fontSize: "13px",
            lineHeight: "1.5",
            color: "white",
          }}
        >
          {renderText(message.text)}
        </div>
        <span style={{ fontSize: "10px", color: "#9ca3af", paddingRight: "4px" }}>{message.time}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatbotIA() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const [suggestionsSent, setSuggestionsSent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Clear unread badge when panel opens
  useEffect(() => {
    if (open) {
      setHasUnread(false)
    }
  }, [open])

  function sendMessage(text: string) {
    if (!text.trim()) return

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: text.trim(), time: "Ahora" },
    ])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: getMockResponse(text),
          time: "Ahora",
        },
      ])
    }, 1200)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleSuggestion(text: string) {
    setSuggestionsSent(true)
    sendMessage(text)
  }

  return (
    <>
      {/* ── Keyframe styles injected once ───────────────────────────── */}
      <style>{`
        @keyframes chatbotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes chatbotFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes chatbotPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 8px 40px rgba(124,58,237,0.65); }
        }
        .chatbot-fab:hover {
          transform: scale(1.08) !important;
        }
        .chatbot-send:hover:not(:disabled) {
          opacity: 0.9;
          transform: scale(1.05);
        }
        .chatbot-chip:hover {
          background: #ede9fe !important;
          border-color: #7c3aed !important;
          color: #5b21b6 !important;
        }
        .chatbot-close:hover {
          background: rgba(255,255,255,0.2) !important;
        }
        .chatbot-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
      `}</style>

      {/* ── Floating Action Button ────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Tooltip */}
        {showTooltip && !open && (
          <div
            style={{
              background: "rgba(17,24,39,0.88)",
              color: "white",
              fontSize: "12px",
              fontWeight: 500,
              padding: "6px 12px",
              borderRadius: "8px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              letterSpacing: "0.01em",
            }}
          >
            Asistente IA
          </div>
        )}

        {/* FAB button */}
        <button
          className="chatbot-fab"
          onClick={() => setOpen((prev) => !prev)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Abrir asistente IA"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #6366f1)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            position: "relative",
            animation: "chatbotPulse 3s ease-in-out infinite",
            flexShrink: 0,
          }}
        >
          <SparkleIcon size={22} />

          {/* Unread badge */}
          {hasUnread && (
            <span
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid white",
              }}
            />
          )}
        </button>
      </div>

      {/* ── Chat Panel ───────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            width: "380px",
            height: "520px",
            zIndex: 999,
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
            animation: "chatbotFadeIn 0.22s ease forwards",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6366f1)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SparkleIcon size={18} />
              </div>
              {/* Online indicator */}
              <span
                style={{
                  position: "absolute",
                  bottom: "0px",
                  right: "0px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  border: "2px solid white",
                }}
              />
            </div>

            {/* Title */}
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
                Asistente Atalayas
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "11px", marginTop: "2px" }}>
                IA · Siempre disponible
              </div>
            </div>

            {/* Close button */}
            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease",
                flexShrink: 0,
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages area */}
          <div
            className="chatbot-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 16px 8px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Suggestion chips — shown after initial message, before user sends anything */}
            {!suggestionsSent && messages.length === 1 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginBottom: "12px",
                  paddingLeft: "36px",
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="chatbot-chip"
                    onClick={() => handleSuggestion(s)}
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      borderRadius: "20px",
                      padding: "5px 11px",
                      fontSize: "11.5px",
                      color: "#6d28d9",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s, color 0.15s",
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              gap: "8px",
              background: "white",
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#1f2937",
                background: "transparent",
                padding: "8px 4px",
                fontFamily: "inherit",
              }}
            />
            <button
              className="chatbot-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label="Enviar mensaje"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: input.trim()
                  ? "linear-gradient(135deg, #7c3aed, #6366f1)"
                  : "#e5e7eb",
                border: "none",
                cursor: input.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, opacity 0.2s, transform 0.15s",
                flexShrink: 0,
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
