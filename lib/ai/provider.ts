import "server-only"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Groq from "groq-sdk"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// ─── Gemini streaming ─────────────────────────────────────────────────────────

async function geminiChatStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.95,
    },
  })

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessageStream(lastMessage.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) onChunk(text)
  }
}

// ─── Groq streaming (fallback) ────────────────────────────────────────────────

async function groqChatStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 8000,
    temperature: 0.7,
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ""
    if (text) onChunk(text)
  }
}

// ─── Provider público ─────────────────────────────────────────────────────────

export async function chatCompletionStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  try {
    await geminiChatStream(messages, systemPrompt, onChunk)
  } catch (error) {
    console.error("[AI] Gemini stream falló, usando Groq:", error)
    await groqChatStream(messages, systemPrompt, onChunk)
  }
}