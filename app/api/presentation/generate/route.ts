// ============================================================
// POST /api/presentation/generate
// Genera un array de slides a partir de texto + título del módulo
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream } from '@/lib/ai/provider';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Eres un experto en diseño de presentaciones de formación corporativa.
Tu tarea es generar un array JSON de slides a partir del contenido de un documento.
Genera el número EXACTO de slides que se te indique, usando los siguientes tipos (usa variedad y repite tipos si es necesario para cubrir el contenido):

- cover    → { type, module_label, title, subtitle }
- bullets  → { type, title, points: string[] }  (4-6 puntos)
- highlight → { type, title, stats: [{ number, description }] }  (3 stats)
- steps    → { type, title, steps: [{ title, description }] }  (3-4 pasos)
- twocol   → { type, title, col_a: { heading, body }, col_b: { heading, body } }
- closing  → { type, title, body, cta }

Estructura recomendada:
1. cover (portada con el título principal)
2. bullets (objetivos del módulo)
3. steps o twocol (contenido principal)
4. highlight (datos o métricas clave, si aplica)
5. bullets o steps (contenido secundario)
6. closing (cierre con llamada a la acción)

Reglas ESTRICTAS:
- Devuelve SOLO el array JSON, sin texto adicional, sin bloques de código markdown, sin explicaciones.
- El contenido de cada slide debe basarse EXCLUSIVAMENTE en el documento proporcionado.
- No inventes información que no esté en el documento.
- El module_label de la portada debe ser el nombre del módulo en mayúsculas breve.
- El cta del closing debe ser "Completar módulo" o similar.
- Todo en español.`;

export async function POST(req: NextRequest) {
  try {
    // Recibe JSON con el texto ya extraído en el cliente
    const { fileText, moduleTitle, numSlides = 10 } = await req.json();

    const texto = (fileText || '').trim();
    const n = Math.min(Math.max(Number(numSlides) || 10, 4), 25);

    if (!texto) {
      return NextResponse.json(
        { error: 'Debes subir un documento con texto para generar la presentación.' },
        { status: 400 }
      );
    }

    const userPrompt = `Módulo: "${moduleTitle || 'Formación'}"

Contenido del documento:
${texto.slice(0, 8000)}

Genera EXACTAMENTE ${n} slides basándote EXCLUSIVAMENTE en el contenido del documento anterior. El array debe tener exactamente ${n} elementos.`;

    let fullText = '';

    await chatCompletionStream(
      [{ role: 'user', content: userPrompt }],
      SYSTEM_PROMPT,
      (chunk) => { fullText += chunk; }
    );

    console.log('[presentation/generate] raw response (first 300):', fullText.slice(0, 300));

    // Limpiar bloques de código markdown si los hay
    let cleaned = fullText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extraer el array JSON (desde el primer [ hasta el último ])
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`La IA no devolvió un JSON válido. Respuesta: ${fullText.slice(0, 200)}`);
    }

    const jsonStr = cleaned.slice(start, end + 1);
    const slides = JSON.parse(jsonStr);

    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error('El JSON generado no contiene slides válidos');
    }

    return NextResponse.json({ slides });
  } catch (e) {
    console.error('[presentation/generate]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al generar la presentación' },
      { status: 500 }
    );
  }
}
