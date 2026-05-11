export const runtime = "nodejs";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const SPANISH_VOICE_ID = "g5CIjZEefAph4nQFvHAz";

interface TTSRequest {
  text: string;
  voiceId?: string;
}

export async function POST(req: Request) {
  try {
    const { text, voiceId }: TTSRequest = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "El texto es obligatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: "El texto no puede superar 5000 caracteres" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY no configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const vid = voiceId || SPANISH_VOICE_ID;

    const response = await fetch(`${ELEVENLABS_API}/text-to-speech/${vid}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs] Error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs devolvió error ${response.status}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error("[ElevenLabs] Error interno:", err);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
