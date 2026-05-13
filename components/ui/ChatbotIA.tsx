"use client"

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import Grainient from "./Grainient"
import { IconButton } from "./IconButton"
import { getModulosConProgreso } from "@/lib/api/modulos"
import type { ModuloConProgreso } from "@/lib/types/modulos"

// ─── Tema de color ────────────────────────────────────────────────────────────
const COLORS = {
  gradientFab:    "linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)",
  gradientUser:   "linear-gradient(135deg, #1E40AF 0%, #1e3a8a 100%)",
  chipBg:         "rgba(79,70,229,0.08)",
  chipBorder:     "rgba(79,70,229,0.22)",
  chipText:       "#4F46E5",
  chipHoverBg:    "rgba(79,70,229,0.16)",
  pulse:          "rgba(79,70,229,0.45)",
  shadow:         "rgba(67,56,202,0.35)",
  accent:         "#4F46E5",
} as const

const C = COLORS

// ─── Draggable FAB layout ─────────────────────────────────────────────────────
const FAB_SIZE  = 64
const PANEL_W   = 400
const PANEL_H   = 560
const MARGIN    = 12

interface Pos { x: number; y: number }

function getDefaultFabPos(): Pos {
  return {
    x: window.innerWidth  - FAB_SIZE - 28,
    y: window.innerHeight - FAB_SIZE - 28,
  }
}

function loadFabPos(): Pos | null {
  try {
    const raw = localStorage.getItem("atalaIA-fab-pos")
    if (!raw) return null
    const p = JSON.parse(raw) as Pos
    if (p.x >= 0 && p.y >= 0 && p.x < window.innerWidth && p.y < window.innerHeight) return p
  } catch { /* ignore */ }
  return null
}

function calcPanelPos(fab: Pos): Pos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const panelH = Math.min(PANEL_H, vh - 110)

  let x = fab.x - PANEL_W - MARGIN
  if (x < 8) x = fab.x + FAB_SIZE + MARGIN
  if (x + PANEL_W > vw - 8) x = vw - PANEL_W - 8
  if (x < 8) x = 8

  let y = fab.y + FAB_SIZE - panelH
  if (y < 8) y = 8
  if (y + panelH > vh - 8) y = vh - panelH - 8

  return { x, y }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: "assistant" | "user"
  text: string
  time: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

function buildWelcomeMessage(nombre?: string): Message {
  const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  const saludo = nombre ? `¡Hola, ${nombre}! Soy tu asistente.` : "¡Hola! Soy tu asistente."
  return {
    id: "1",
    role: "assistant",
    text: `${saludo} Soy **AtalaIA**, tu asistente de formación en Atalayas. Puedo ayudarte con tus módulos, responder dudas sobre comunicados, PRL o el uso de la plataforma. ¿En qué puedo ayudarte?`,
    time: now,
  }
}

const STORAGE_KEY = "atalaIA-messages"

const ADMIN_POOL = [
  "¿Cómo genero contenido con IA?",
  "¿Cómo creo un módulo?",
  "Progreso de empleados",
  "PRL para administradores",
  "¿Cómo edito un módulo?",
  "¿Cómo añado empleados?",
  "¿Qué tipos de módulos hay?",
  "¿Cómo genero evaluaciones?",
  "¿Cómo publico un comunicado?",
  "¿Cómo veo el progreso individual?",
]

const EMPLEADO_POOL = [
  "Normas de PRL básicas",
  "¿Cómo completo un módulo?",
  "¿Qué es el onboarding?",
  "¿Cómo accedo a mis formaciones?",
  "¿Dónde veo mis comunicados?",
  "¿Puedo retomar una formación?",
  "¿Hay evaluaciones en los módulos?",
  "¿Cómo contacto con RRHH?",
  "¿Qué módulos son obligatorios?",
  "¿Cómo uso la plataforma?",
]

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function getSuggestions(
  rol: string | undefined,
  modulos: ModuloConProgreso[]
): string[] {
  const isAdmin = rol === "ROLE_ADMIN" || rol === "ROLE_ADMIN_EMPRESA"
  const enProgreso = modulos.find((m) => m.status === "en progreso")
  const pendientes = modulos.filter((m) => m.status === "pendiente")
  const completados = modulos.filter((m) => m.status === "completado")

  if (isAdmin) {
    return pickRandom(ADMIN_POOL, 4)
  }

  // Sugerencias contextuales fijas (basadas en módulos reales)
  const contextual: string[] = []
  if (enProgreso) {
    contextual.push(`Continuar con "${enProgreso.nombre}"`)
  } else if (pendientes.length > 0) {
    contextual.push(`¿De qué trata "${pendientes[0].nombre}"?`)
  }
  if (pendientes.length > 0) {
    contextual.push("¿Qué formaciones me quedan?")
  } else if (completados.length > 0) {
    contextual.push("¿Qué he completado hasta ahora?")
  }

  // Rellenar con aleatorias del pool hasta llegar a 4
  const needed = 4 - contextual.length
  const random = pickRandom(EMPLEADO_POOL, needed)

  return [...contextual, ...random]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={disabled ? "#9ca3af" : "white"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", pointerEvents: "none" }}
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
        background: "rgba(79,70,229,0.06)",
        border: "1px solid rgba(79,70,229,0.15)",
        borderRadius: "4px 18px 18px 18px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        height: "42px",
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: C.accent,
            animation: "chatbotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

function renderText(text: string) {
  const lines = text.split("\n")
  const result: React.ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    const isLast = lineIdx === lines.length - 1

    // Lista con guión o bullet
    const bulletMatch = line.match(/^[-•]\s+(.+)/)
    if (bulletMatch) {
      result.push(
        <div key={lineIdx} style={{ display: "flex", gap: "6px", marginTop: result.length === 0 ? 0 : "3px" }}>
          <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: "1px" }}>•</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </div>
      )
      return
    }

    // Lista numerada: "1. " "2. " etc.
    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      result.push(
        <div key={lineIdx} style={{ display: "flex", gap: "8px", marginTop: result.length === 0 ? 0 : "4px" }}>
          <span style={{
            color: C.accent, fontWeight: 700, flexShrink: 0,
            minWidth: "16px", textAlign: "right", marginTop: "1px",
          }}>{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      )
      return
    }

    // Línea vacía → espaciado
    if (line.trim() === "") {
      if (lineIdx !== 0 && !isLast) result.push(<div key={lineIdx} style={{ height: "6px" }} />)
      return
    }

    // Línea normal
    result.push(
      <span key={lineIdx}>
        {renderInline(line)}
        {!isLast && <br />}
      </span>
    )
  })

  return result
}

function MessageBubble({ message, isStreaming, animate = true }: { message: Message; isStreaming?: boolean; animate?: boolean }) {
  const isAssistant = message.role === "assistant"

  if (isAssistant) {
    return (
      <div style={{
        display: "flex", alignItems: "flex-start",
        marginBottom: "16px",
        animation: animate ? "msgFadeIn 0.2s ease forwards" : "none",
      }}>
        <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{
            background: "rgba(79,70,229,0.06)",
            border: "1px solid rgba(79,70,229,0.15)",
            borderRadius: "4px 18px 18px 18px",
            padding: isStreaming && !message.text ? "10px 14px" : "12px 16px",
            fontSize: "14px",
            lineHeight: "1.65",
            color: "#1e293b",
            fontWeight: 400,
            transition: "padding 0.1s",
          }}>
            {message.text ? renderText(message.text) : null}
            {isStreaming && <span className="chatbot-cursor" />}
          </div>
          <span style={{
            fontSize: "10.5px", color: "#b0bac7", paddingLeft: "6px",
            fontWeight: 400, letterSpacing: "0.01em", lineHeight: 1.4,
          }}>{message.time}</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: "flex", justifyContent: "flex-end",
      marginBottom: "16px",
      animation: animate ? "msgFadeIn 0.2s ease forwards" : "none",
    }}>
      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
        <div style={{
          background: C.gradientUser,
          borderRadius: "18px 18px 4px 18px",
          padding: "12px 16px",
          fontSize: "14px",
          lineHeight: "1.65",
          color: "white",
          fontWeight: 400,
        }}>
          {renderText(message.text)}
        </div>
        <span style={{
          fontSize: "10.5px", color: "#b0bac7", paddingRight: "6px",
          fontWeight: 400, letterSpacing: "0.01em", lineHeight: 1.4,
        }}>{message.time}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatbotIA() {
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const initialMessageIds = useRef<Set<string>>(new Set())

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        if (parsed.length > 0) {
          parsed.forEach((m) => initialMessageIds.current.add(m.id))
          return parsed
        }
      }
    } catch { /* ignore */ }
    const welcome = buildWelcomeMessage()
    initialMessageIds.current.add(welcome.id)
    return [welcome]
  })
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [suggestionsSent, setSuggestionsSent] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [modulos, setModulos] = useState<ModuloConProgreso[]>([])
  const [suggestions, setSuggestions] = useState<string[]>(() => getSuggestions(undefined, []))
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmFading, setConfirmFading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const confirmClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recentMessagesRef = useRef<number[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const MAX_CHARS = 500
  const isBusy = isTyping || streamingId !== null
  const [isMobile, setIsMobile] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [positions, setPositions] = useState<{ fab: Pos; panel: Pos }>({
    fab:   { x: 0, y: 0 },
    panel: { x: 0, y: 0 },
  })
  const [posReady, setPosReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const apiHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([])
  const isDragging = useRef(false)
  const didDrag = useRef(false)
  const dragOffset = useRef<Pos>({ x: 0, y: 0 })
  const fabRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const liveFabPos = useRef<Pos>({ x: 0, y: 0 })

  const fabPos   = positions.fab
  const panelPos = positions.panel

  useEffect(() => {
    // Restaurar historial de API desde mensajes guardados
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Message[]
        apiHistoryRef.current = parsed
          .filter((m) => m.id !== "1") // excluir bienvenida
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }))
      }
    } catch { /* ignore */ }

    const isMobileNow = () => window.innerWidth < 500
    let wasMobile = isMobileNow()

    const handleResize = () => {
      const mobile = isMobileNow()
      // Solo actuar si cruzamos el umbral móvil ↔ desktop
      if (mobile !== wasMobile) {
        wasMobile = mobile
        setIsMobile(mobile)
        if (!mobile) {
          const pos = loadFabPos() ?? getDefaultFabPos()
          liveFabPos.current = pos
          setPositions({ fab: pos, panel: calcPanelPos(pos) })
        }
        setOpen(false)
        setIsClosing(false)
      } else if (!mobile) {
        // En desktop, recalcular posición del panel si se redimensiona
        const pos = liveFabPos.current
        setPositions({ fab: pos, panel: calcPanelPos(pos) })
      }
    }

    const mobile = isMobileNow()
    setIsMobile(mobile)
    if (!mobile) {
      const pos = loadFabPos() ?? getDefaultFabPos()
      liveFabPos.current = pos
      setPositions({ fab: pos, panel: calcPanelPos(pos) })
    }
    setPosReady(true)

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    getModulosConProgreso(usuario?.empresaId).then((m) => {
      setModulos(m)
      setSuggestions(getSuggestions(usuario?.codigoRol, m))
      // Mostrar punto rojo si hay módulos pendientes o en progreso
      const hayPendientes = m.some((mod) => mod.status === "pendiente" || mod.status === "en progreso")
      setHasUnread(hayPendientes)
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSuggestions(getSuggestions(usuario?.codigoRol, modulos))
  }, [usuario?.codigoRol]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messages.length > 1) {
      try { localStorage.setItem("atalaIA-messages", JSON.stringify(messages)) } catch { /* ignore */ }
    }
  }, [messages])

  useEffect(() => {
    if (usuario?.nombre) {
      setMessages((prev) =>
        prev.length === 1 && prev[0].id === "1"
          ? [buildWelcomeMessage(usuario.nombre)]
          : prev
      )
    }
  }, [usuario?.nombre])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    // Siempre scrollea si hay streaming activo o si el usuario está cerca del fondo
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (streamingId || distanceFromBottom < 100) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping, streamingId])

  useEffect(() => {
    if (open) {
      setHasUnread(false)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
        inputRef.current?.focus()
      }, 50)
    } else {
      setShowScrollBtn(false)
      // Al cerrar, marcar todos los mensajes como "ya vistos" para que no animen al reabrir
      messages.forEach((m) => initialMessageIds.current.add(m.id))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const el = container
    function handleScroll() {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(distFromBottom > 120)
    }
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [open])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onFabMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    isDragging.current = true
    didDrag.current    = false
    dragOffset.current = { x: e.clientX - liveFabPos.current.x, y: e.clientY - liveFabPos.current.y }
    e.preventDefault()
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      if (!didDrag.current) {
        didDrag.current = true
        setShowTooltip(false)
      }
      const newFab: Pos = {
        x: Math.max(0, Math.min(window.innerWidth  - FAB_SIZE, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - FAB_SIZE, e.clientY - dragOffset.current.y)),
      }
      const newPanel = calcPanelPos(newFab)
      liveFabPos.current = newFab
      // Mover directamente en el DOM — sin React, sin re-render
      if (fabRef.current) {
        fabRef.current.style.left = `${newFab.x}px`
        fabRef.current.style.top  = `${newFab.y}px`
      }
      if (panelRef.current) {
        panelRef.current.style.left = `${newPanel.x}px`
        panelRef.current.style.top  = `${newPanel.y}px`
      }
    }

    function onMouseUp() {
      if (!isDragging.current) return
      isDragging.current = false
      if (!didDrag.current) return
      const pos = liveFabPos.current
      localStorage.setItem("atalaIA-fab-pos", JSON.stringify(pos))
      // Sync React state sin causar salto: el DOM ya está en la posición correcta
      setPositions({ fab: pos, panel: calcPanelPos(pos) })
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup",   onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup",   onMouseUp)
    }
  }, [isMobile])

  // ── Message sending ────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    if (!text.trim() || isBusy || rateLimited) return

    // ── Rate limiting: máx 4 mensajes en 10 segundos ──
    const now = Date.now()
    recentMessagesRef.current = recentMessagesRef.current.filter((t) => now - t < 10_000)
    if (recentMessagesRef.current.length >= 4) {
      setRateLimited(true)
      setTimeout(() => setRateLimited(false), 5_000)
      return
    }
    recentMessagesRef.current.push(now)

    const timeStr = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: text.trim(), time: timeStr },
    ])
    setInput("")
    setIsTyping(true)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

    apiHistoryRef.current = [...apiHistoryRef.current, { role: "user", content: text.trim() }]

    try {
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      const res = await fetch("/api/chat", {
        method: "POST",
        signal: abortControllerRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiHistoryRef.current.slice(-10),
          context: {
            nombreUsuario: usuario
              ? `${usuario.nombre} ${usuario.apellidos ?? ""}`.trim()
              : undefined,
            empresa: usuario?.nombreEmpresa ?? undefined,
            rol: usuario?.codigoRol ?? undefined,
            modulosPendientes: modulos
              .filter((m) => m.status === "pendiente" || m.status === "en progreso")
              .map((m) => m.status === "en progreso" ? `${m.nombre} (en progreso)` : m.nombre),
            modulosCompletados: modulos
              .filter((m) => m.status === "completado")
              .map((m) => m.nombre),
          },
        }),
      })

      if (!res.ok || !res.body) {
        const errorText = res.status >= 500
          ? "El servicio de IA no está disponible en este momento. Inténtalo en unos minutos."
          : "No he podido procesar tu consulta. Inténtalo de nuevo."
        setIsTyping(false)
        apiHistoryRef.current = [...apiHistoryRef.current, { role: "assistant", content: errorText }]
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(), role: "assistant", text: errorText,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        }])
        return
      }

      // ── Streaming ────────────────────────────────────────
      const msgId = (Date.now() + 1).toString()
      const msgTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      setIsTyping(false)
      setStreamingId(msgId)
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", text: "", time: msgTime }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, text: fullText } : m))
        await new Promise((r) => setTimeout(r, 38))
      }

      apiHistoryRef.current = [...apiHistoryRef.current, { role: "assistant", content: fullText }]
      setStreamingId(null)

    } catch {
      setIsTyping(false)
      setStreamingId(null)
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine
      const errorText = isOffline
        ? "Parece que no tienes conexión a internet. Comprueba tu red e inténtalo de nuevo."
        : "No he podido conectar con el servidor. Inténtalo en unos segundos."
      apiHistoryRef.current = [...apiHistoryRef.current, { role: "assistant", content: errorText }]
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant", text: errorText,
        time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      }])
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const charsLeft = MAX_CHARS - input.length
  const showCharWarning = input.length > MAX_CHARS * 0.8

  function handleSuggestion(text: string) {
    setSuggestionsSent(true)
    sendMessage(text)
  }

  function closePanel() {
    if (confirmClear) {
      setConfirmClear(false)
      setConfirmFading(false)
      if (confirmClearTimer.current) clearTimeout(confirmClearTimer.current)
    }
    setIsClosing(true)
    const delay = isMobile ? 280 : 150
    setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
    }, delay)
  }

  function handleFabClick() {
    if (didDrag.current || isClosing) return
    if (open) closePanel()
    else setOpen(true)
  }

  function dismissConfirm() {
    if (confirmClearTimer.current) clearTimeout(confirmClearTimer.current)
    setConfirmFading(true)
    setTimeout(() => {
      setConfirmClear(false)
      setConfirmFading(false)
    }, 220)
  }

  function handleClearClick() {
    if (confirmClear) return
    setConfirmClear(true)
    setConfirmFading(false)
    confirmClearTimer.current = setTimeout(() => dismissConfirm(), 4000)
  }

  // ── Position styles ────────────────────────────────────────────────────────

  const fabStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: "calc(28px + env(safe-area-inset-bottom, 0px))", right: "calc(28px + env(safe-area-inset-right, 0px))", zIndex: 1000 }
    : { position: "fixed", left: fabPos.x, top: fabPos.y, zIndex: 1000 }

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "calc(100dvh - 80px)",
        borderRadius: "20px 20px 0 0",
      }
    : {
        position: "fixed",
        left: panelPos.x,
        top: panelPos.y,
        width: `${PANEL_W}px`,
        height: `min(${PANEL_H}px, calc(100dvh - 120px))`,
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
        @keyframes chatbotFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(10px) scale(0.97); }
        }
        @keyframes chatbotSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatbotSlideDown {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(100%); }
        }
        @keyframes chatbotBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes chatbotBackdropOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes chatbotPulse {
          0%, 100% { box-shadow: 0 6px 24px ${C.pulse}; }
          50%       { box-shadow: 0 8px 36px ${C.pulse}, 0 0 0 8px ${C.pulse.replace("0.45", "0.12")}; }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes confirmAppear {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes confirmDisappear {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.9); }
        }
        @keyframes chatbotCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .chatbot-cursor {
          display: inline-block; width: 2px; height: 13px;
          background: var(--ia, #4F46E5); border-radius: 1px;
          animation: chatbotCursor 0.65s ease-in-out infinite;
          vertical-align: middle; margin-left: 2px;
        }
        .chatbot-fab { transition: transform 0.18s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)); }
        .chatbot-fab:hover { transform: scale(1.1) !important; }
        .chatbot-fab-drag { cursor: grab !important; }
        .chatbot-fab-drag:active { cursor: grabbing !important; }
        .chatbot-send { transition: background 0.2s, filter 0.15s, box-shadow 0.15s; }
        .chatbot-send:hover:not(:disabled) { filter: brightness(1.12); box-shadow: 0 0 0 4px ${C.pulse}; }
        .chatbot-send:hover:not(:disabled) svg { transform: scale(1.18); transition: transform 0.15s; }
        .chatbot-send:active:not(:disabled) { filter: brightness(0.95); }
        .chatbot-send:active:not(:disabled) svg { transform: scale(0.9); }
        .chatbot-chip {
          transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
        }
        .chatbot-chip:hover {
          background: ${C.chipHoverBg} !important;
          border-color: rgba(27,63,126,0.4) !important;
          transform: translateY(-1px);
        }
        .chatbot-close { transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease; }
        .chatbot-close:hover { background: rgba(0,0,0,0.35) !important; transform: scale(1.12); box-shadow: 0 0 0 3px rgba(0,0,0,0.15) !important; }
        .chatbot-close:active { transform: scale(0.95); }
        .chatbot-messages::-webkit-scrollbar { width: 4px; }
        .chatbot-messages::-webkit-scrollbar-track { background: transparent; }
        .chatbot-messages::-webkit-scrollbar-thumb { background: ${C.pulse}; border-radius: 4px; }
        .chatbot-messages::-webkit-scrollbar-thumb:hover { background: ${C.shadow}; }
        .chatbot-input:focus { outline: none; }
        .chatbot-input::placeholder { color: #b0bac7; }
        .chatbot-suggestions { animation: msgFadeIn 0.3s ease 0.1s both; }
      `}</style>

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      {posReady && (isMobile ? !(open || isClosing) : !isClosing) && <div ref={fabRef} style={{ ...fabStyle }}>

        {/* Tooltip — posicionado absolutamente para no mover el FAB */}
        {showTooltip && !open && (
          <div style={{
            position: "absolute",
            ...(fabPos.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
              ? { right: `${FAB_SIZE + 10}px` }
              : { left: `${FAB_SIZE + 10}px` }),
            top: "50%",
            transform: "translateY(-50%)",
            background: "var(--marino, rgba(15,23,42,0.9))",
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
          className={`chatbot-fab${isMobile ? "" : " chatbot-fab-drag"}`}
          onMouseDown={onFabMouseDown}
          onClick={handleFabClick}
          onMouseEnter={() => { if (!isMobile) setShowTooltip(true) }}
          onMouseLeave={() => { if (!isMobile) setShowTooltip(false) }}
          aria-label="Abrir asistente IA"
          style={{
            width: `${FAB_SIZE}px`,
            height: `${FAB_SIZE}px`,
            borderRadius: "50%",
            background: C.gradientFab,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: hasUnread ? `chatbotPulse 2.5s ease-in-out infinite` : "none",
            boxShadow: hasUnread
              ? `0 8px 28px ${C.pulse}, 0 4px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.30)`
              : `0 8px 24px ${C.shadow}, 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.30)`,
            border: "1.5px solid rgba(255,255,255,0.18)",
            position: "relative",
            padding: 0,
            userSelect: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-chatbot.webp"
            alt="Asistente IA"
            style={{
              width: "60%", height: "60%",
              objectFit: "contain", objectPosition: "center",
              filter: "brightness(0) invert(1)", pointerEvents: "none",
              display: "block",
            }}
          />
          {hasUnread && (
            <span style={{
              position: "absolute", top: "4px", right: "4px",
              width: "13px", height: "13px", borderRadius: "50%",
              background: "#ef4444", border: "2.5px solid white",
            }} />
          )}
        </button>
      </div>}

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {open && (
        <>
          {/* Backdrop móvil */}
          {isMobile && (
            <div
              onClick={closePanel}
              style={{
                position: "fixed", inset: 0, zIndex: 998,
                background: "rgba(0,0,0,0.45)",
                animation: isClosing ? "chatbotBackdropOut 0.28s ease forwards" : "chatbotBackdropIn 0.2s ease forwards",
              }}
            />
          )}
        <div ref={panelRef} style={{
          ...panelStyle,
          zIndex: 999,
          borderRadius: isMobile ? "20px 20px 0 0" : "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#4F46E5",
          animation: isDragging.current ? "none" : isMobile
            ? isClosing ? "chatbotSlideDown 0.28s ease forwards" : "chatbotSlideUp 0.3s ease forwards"
            : isClosing ? "chatbotFadeOut 0.15s ease forwards" : "chatbotFadeIn 0.25s ease forwards",
          border: isMobile ? "none" : "1px solid rgba(0,0,0,0.06)",
        }}>

          {/* Header */}
          <div style={{ position: "relative", flexShrink: 0, height: "72px", overflow: "hidden", background: "#4F46E5" }}>
            <Grainient
              color1="#6366f1"
              color2="#818cf8"
              color3="#4338CA"
              timeSpeed={0.12}
              warpSpeed={0.8}
              warpStrength={1.0}
              contrast={1.3}
              saturation={1.2}
              grainAmount={0.04}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
            <div style={{
              position: "relative", zIndex: 1,
              padding: "0 16px",
              height: "100%",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.14)",
                  border: "1.5px solid rgba(255,255,255,0.30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.20)",
                  flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-chatbot.webp" alt="AtalaIA"
                    style={{
                      width: "62%", height: "62%",
                      objectFit: "contain", objectPosition: "center",
                      filter: "brightness(0) invert(1)", display: "block",
                    }} />
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                <div style={{
                  color: "white", fontWeight: 700, fontSize: "18px", lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}>
                  AtalaIA
                </div>
                <div style={{
                  color: "rgba(255,255,255,0.88)", fontSize: "12px", fontWeight: 400,
                  letterSpacing: "0.01em",
                  textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                }}>
                  {isTyping ? "Escribiendo..." : streamingId ? "Respondiendo..." : "Tu asistente inteligente"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, justifyContent: "flex-end" }}>
                {confirmClear ? (
                  <button
                    onClick={() => {
                      dismissConfirm()
                      try { localStorage.removeItem("atalaIA-messages") } catch { /* ignore */ }
                      apiHistoryRef.current = []
                      setSuggestionsSent(false)
                      setSuggestions(getSuggestions(usuario?.codigoRol, modulos))
                      setTimeout(() => setMessages([buildWelcomeMessage(usuario?.nombre)]), 220)
                    }}
                    style={{
                      height: "38px", padding: "0 13px",
                      borderRadius: "var(--radius-md, 10px)",
                      background: "#dc2626", border: "1px solid rgba(255,255,255,0.22)",
                      color: "white", fontSize: "12px", fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: "6px",
                      opacity: confirmFading ? 1 : 0,
                      animation: confirmFading
                        ? "confirmDisappear 0.2s ease forwards"
                        : "confirmAppear 0.2s ease 0.25s forwards",
                    }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                    </svg>
                    Borrar chat
                  </button>
                ) : (
                  <>
                    <IconButton variant="glass" size="md" label="Nueva conversación" title="Nueva conversación" onClick={handleClearClick} style={{ borderRadius: "50%" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                      </svg>
                    </IconButton>
                    <IconButton variant="glass" size="md" label="Cerrar asistente" onClick={closePanel} style={{ borderRadius: "50%" }}>
                      <CloseIcon />
                    </IconButton>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="chatbot-messages" style={{
            flex: 1, overflowY: "auto",
            padding: "18px 16px 8px",
            display: "flex", flexDirection: "column",
            background: "#f0f2f5",
          }}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={msg.id === streamingId}
                animate={!initialMessageIds.current.has(msg.id)}
              />
            ))}

            {!suggestionsSent && messages.length === 1 && (
              <div className="chatbot-suggestions" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px",
                marginTop: "4px", marginBottom: "4px",
              }}>
                {suggestions.map((s) => (
                  <button key={s} className="chatbot-chip" onClick={() => handleSuggestion(s)}
                    style={{
                      background: C.chipBg,
                      border: `1px solid ${C.chipBorder}`,
                      borderRadius: "20px",
                      padding: "7px 12px",
                      fontSize: "12px",
                      color: C.chipText,
                      cursor: "pointer",
                      lineHeight: 1.4,
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                      textAlign: "center",
                      wordBreak: "break-word",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          {showScrollBtn && (
            <div style={{ position: "relative", height: 0, overflow: "visible", flexShrink: 0, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  position: "absolute",
                  bottom: "10px",
                  background: "var(--blanco, white)",
                  border: `1px solid ${C.chipBorder}`,
                  borderRadius: "20px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  color: C.chipText,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 600,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.10)",
                  zIndex: 10,
                  whiteSpace: "nowrap",
                  animation: "msgFadeIn 0.18s ease forwards",
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={C.chipText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Ir al final
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{
            borderTop: "1px solid #E2E8F0",
            padding: isMobile
              ? "10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) 12px"
              : "10px 12px",
            background: "var(--blanco, white)",
            flexShrink: 0,
          }}>
            {rateLimited && (
              <div style={{
                fontSize: "11.5px", color: "var(--exito, #16a34a)", textAlign: "center",
                marginBottom: "6px", fontWeight: 500,
              }}>
                ⏳ Vas muy rápido, espera un momento antes de continuar
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                flex: 1,
                background: "var(--gris-panel, #F1F5F9)",
                borderRadius: "24px",
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                border: inputFocused ? "1.5px solid rgba(27,63,126,0.4)" : "1px solid #E2E8F0",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: inputFocused ? "0 0 0 3px rgba(27,63,126,0.1)" : "none",
                cursor: isBusy ? "not-allowed" : "text",
              }}>
                <input
                  ref={inputRef}
                  className="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Pregúntame lo que necesites..."
                  disabled={isBusy}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: "14px",
                    color: "#1e293b",
                    padding: "10px 0",
                    fontFamily: "inherit",
                    letterSpacing: "0.01em",
                    opacity: isBusy ? 0.5 : 1,
                    cursor: "inherit",
                  }}
                />
                {showCharWarning && (
                  <span style={{
                    fontSize: "11px", flexShrink: 0, marginLeft: "6px",
                    color: charsLeft <= 20 ? "var(--advertencia, #f59e0b)" : "var(--texto-muted, #94a3b8)",
                    fontWeight: 500,
                  }}>
                    {charsLeft}
                  </span>
                )}
              </div>
              <button
                className="chatbot-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy || rateLimited}
                aria-label="Enviar mensaje"
                style={{
                  width: "38px", height: "38px", borderRadius: "50%",
                  background: input.trim() && !isBusy && !rateLimited ? C.gradientFab : "#E2E8F0",
                  border: "none",
                  cursor: input.trim() && !isBusy && !rateLimited ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                <SendIcon disabled={!input.trim() || isBusy || rateLimited} />
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  )
}
