"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import Iridescence from "./Iridescence"

// ─── Tema de color — cambia THEME para alternar entre variantes ───────────────
// "morado" | "teal"
const THEME: "morado" | "teal" = "teal"

const COLORS = {
  morado: {
    gradientFab:   "linear-gradient(135deg, #5B21B6, #4338CA)",
    gradientHeader:"linear-gradient(135deg, #5B21B6, #4338CA)",
    gradientUser:  "linear-gradient(135deg, #5B21B6, #4338CA)",
    avatarBg:      "linear-gradient(135deg, #5B21B6, #4338CA)",
    chipBg:        "#EDE9FE",
    chipBorder:    "#C4B5FD",
    chipText:      "#4C1D95",
    chipHoverBg:   "#DDD6FE",
    pulse:         "rgba(91,33,182,0.45)",
    shadow:        "rgba(91,33,182,0.35)",
  },
  teal: {
    gradientFab:   "linear-gradient(135deg, #0F766E, #0891B2)",
    gradientHeader:"linear-gradient(135deg, #0F766E, #0891B2)",
    gradientUser:  "linear-gradient(135deg, #0F766E, #0891B2)",
    avatarBg:      "linear-gradient(135deg, #0F766E, #0891B2)",
    chipBg:        "#CCFBF1",
    chipBorder:    "#99F6E4",
    chipText:      "#134E4A",
    chipHoverBg:   "#99F6E4",
    pulse:         "rgba(15,118,110,0.45)",
    shadow:        "rgba(15,118,110,0.35)",
  },
} as const

const C = COLORS[THEME]

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
    text: "¡Hola! 👋 Soy AtalaIA, tu asistente IA de Atalayas. Puedo ayudarte con tu formación, responder dudas sobre comunicados, PRL o cualquier consulta sobre la plataforma. ¿En qué puedo ayudarte?",
    time: "Ahora",
  },
]

const SUGGESTIONS = [
  "¿Qué formaciones tengo pendientes?",
  "Resumen del último comunicado",
  "Normas de PRL básicas",
  "¿Cómo completo un módulo?",
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: C.avatarBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        padding: "4px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-chatbot.png"
        alt="AtalaIA"
        width={size}
        height={size}
        style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
      />
    </div>
  )
}

function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={disabled ? "#9ca3af" : "white"}
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "12px" }}>
      <div style={{
        background: "#F1F5F9",
        borderRadius: "18px 18px 18px 4px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        height: "42px",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#94a3b8",
            animation: "chatbotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    return <span key={i}>{part}</span>
  })
}

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant"

  if (isAssistant) {
    return (
      <div style={{
        display: "flex", alignItems: "flex-start",
        marginBottom: "12px",
        animation: "msgFadeIn 0.2s ease forwards",
      }}>
        <div style={{ maxWidth: "86%", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{
            background: "#F1F5F9",
            borderRadius: "4px 18px 18px 18px",
            padding: "11px 15px",
            fontSize: "13.5px",
            lineHeight: "1.6",
            color: "#1e293b",
          }}>
            {renderText(message.text)}
          </div>
          <span style={{ fontSize: "10px", color: "#94a3b8", paddingLeft: "4px" }}>{message.time}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: "flex", justifyContent: "flex-end",
      marginBottom: "16px",
      animation: "msgFadeIn 0.2s ease forwards",
    }}>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <div style={{
          background: C.gradientUser,
          borderRadius: "18px 18px 4px 18px",
          padding: "11px 15px",
          fontSize: "13.5px",
          lineHeight: "1.55",
          color: "white",
        }}>
          {renderText(message.text)}
        </div>
        <span style={{ fontSize: "10px", color: "#94a3b8", paddingRight: "4px" }}>{message.time}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatbotIA() {
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const [suggestionsSent, setSuggestionsSent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const apiHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  async function sendMessage(text: string) {
    if (!text.trim() || isTyping) return

    const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: text.trim(), time: now },
    ])
    setInput("")
    setIsTyping(true)

    apiHistoryRef.current = [...apiHistoryRef.current, { role: "user", content: text.trim() }]

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiHistoryRef.current,
          context: {
            nombreUsuario: usuario
              ? `${usuario.nombre} ${usuario.apellidos ?? ""}`.trim()
              : undefined,
            empresa: usuario?.nombreEmpresa ?? undefined,
            rol: usuario?.codigoRol ?? undefined,
          },
        }),
      })

      const data = await res.json()
      const responseText: string = res.ok
        ? data.message
        : "Lo siento, ha ocurrido un error. Inténtalo de nuevo. 🙏"

      apiHistoryRef.current = [...apiHistoryRef.current, { role: "assistant", content: responseText }]

      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: responseText,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } catch {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Lo siento, no he podido conectar. Comprueba tu conexión e inténtalo de nuevo. 🙏",
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    }
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
      <style>{`
        @keyframes chatbotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes chatbotFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatbotPulse {
          0%, 100% { box-shadow: 0 6px 24px ${C.pulse}; }
          50%       { box-shadow: 0 8px 36px ${C.pulse}, 0 0 0 8px ${C.pulse.replace("0.45", "0.12")}; }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chatbot-fab { transition: transform 0.2s ease; }
        .chatbot-fab:hover { transform: scale(1.1) !important; }
        .chatbot-send { transition: background 0.2s, transform 0.15s; }
        .chatbot-send:hover:not(:disabled) { transform: scale(1.08); }
        .chatbot-chip {
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
        }
        .chatbot-chip:hover {
          background: ${C.chipHoverBg} !important;
          border-color: ${C.chipBorder} !important;
          transform: translateY(-1px);
        }
        .chatbot-close { transition: background 0.15s ease; }
        .chatbot-close:hover { background: rgba(255,255,255,0.22) !important; }
        .chatbot-messages::-webkit-scrollbar { width: 4px; }
        .chatbot-messages::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .chatbot-input:focus { outline: none; }
      `}</style>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 1000, display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Tooltip */}
        {showTooltip && !open && (
          <div style={{
            background: "rgba(15,23,42,0.9)",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
            padding: "6px 13px",
            borderRadius: "8px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}>
            AtalaIA
          </div>
        )}

        <button
          className="chatbot-fab"
          onClick={() => setOpen((p) => !p)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Abrir asistente IA"
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: C.gradientFab,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: hasUnread ? `chatbotPulse 2.5s ease-in-out infinite` : "none",
            boxShadow: `0 6px 24px ${C.shadow}`,
            position: "relative",
            padding: "10px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-chatbot.png"
            alt="Asistente IA"
            width={26}
            height={26}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
          {hasUnread && (
            <span style={{
              position: "absolute", top: "4px", right: "4px",
              width: "13px", height: "13px", borderRadius: "50%",
              background: "#ef4444", border: "2.5px solid white",
            }} />
          )}
        </button>
      </div>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: "104px",
          right: "28px",
          width: "400px",
          height: "min(560px, calc(100dvh - 120px))",
          zIndex: 999,
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "white",
          animation: "chatbotFadeIn 0.25s ease forwards",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>

          {/* Header con iridiscencia */}
          <div style={{ position: "relative", flexShrink: 0, height: "72px", overflow: "hidden" }}>
            {/* Fondo animado */}
            <Iridescence
              color={[0.106, 0.247, 0.494]}
              speed={1.2}
              amplitude={0.12}
              mouseReact
              style={{ position: "absolute", inset: 0 }}
            />
            {/* Overlay oscuro para legibilidad del texto */}
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(13,27,46,0.04)",
            }} />
            {/* Contenido del header */}
            <div style={{
              position: "relative", zIndex: 1,
              padding: "0 16px",
              height: "100%",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", padding: "5px",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-chatbot.png" alt="AtalaIA" width={30} height={30}
                    style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
                </div>
                <span style={{
                  position: "absolute", bottom: "1px", right: "1px",
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: "#22c55e", border: "2px solid white",
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: "14px", lineHeight: 1.2 }}>
                  AtalaIA
                </div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px", marginTop: "2px" }}>
                  {isTyping ? "✍️ Escribiendo..." : "Tu asistente de formación"}
                </div>
              </div>

              <button className="chatbot-close" onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" style={{
            flex: 1, overflowY: "auto",
            padding: "18px 16px 8px",
            display: "flex", flexDirection: "column",
            background: "#FAFBFC",
          }}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Suggestion chips */}
            {!suggestionsSent && messages.length === 1 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "8px",
                marginTop: "4px", marginBottom: "4px",
              }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chatbot-chip" onClick={() => handleSuggestion(s)}
                    style={{
                      background: C.chipBg,
                      border: `1px solid ${C.chipBorder}`,
                      borderRadius: "20px",
                      padding: "5px 12px",
                      fontSize: "11.5px",
                      color: C.chipText,
                      cursor: "pointer",
                      lineHeight: 1.4,
                      fontWeight: 500,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            padding: "10px 12px",
            gap: "8px",
            background: "white",
            flexShrink: 0,
          }}>
            <div style={{
              flex: 1,
              background: "#F1F5F9",
              borderRadius: "24px",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              border: "1px solid #E2E8F0",
              transition: "border-color 0.15s",
            }}>
              <input
                ref={inputRef}
                className="chatbot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntame lo que necesites..."
                disabled={isTyping}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: "#1e293b",
                  padding: "10px 0",
                  fontFamily: "inherit",
                  opacity: isTyping ? 0.5 : 1,
                }}
              />
            </div>
            <button
              className="chatbot-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Enviar mensaje"
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: input.trim() && !isTyping ? C.gradientFab : "#E2E8F0",
                border: "none",
                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
              <SendIcon disabled={!input.trim() || isTyping} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
