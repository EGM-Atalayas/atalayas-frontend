import "server-only"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Groq from "groq-sdk"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// ─── Gemini (principal) ───────────────────────────────────────────────────────

async function geminiChat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  })

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text()
}

// ─── Groq (fallback) ──────────────────────────────────────────────────────────

async function groqChat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 1024,
  })

  return completion.choices[0]?.message?.content ?? ""
}

// ─── Provider público — cambia esta función para migrar a otro modelo ─────────

export async function chatCompletion(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  try {
    return await geminiChat(messages, systemPrompt)
  } catch (error) {
    console.error("[AI] Gemini falló, usando Groq como fallback:", error)
    return await groqChat(messages, systemPrompt)
  }
}
