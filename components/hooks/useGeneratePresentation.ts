import { useState } from 'react';

export interface Slide {
  type: 'cover' | 'bullets' | 'highlight' | 'steps' | 'twocol' | 'closing';
  [key: string]: unknown;
}

async function extractTextFromFile(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.txt')) {
    return await file.text();
  }

  // PDF: extraer texto en el navegador con pdfjs-dist
  const arrayBuffer = await file.arrayBuffer();
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  // Worker inline para evitar problemas con Next.js
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.mjs`;

  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}

export function useGeneratePresentation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    file: File | null,
    moduleTitle: string,
    numSlides = 10
  ): Promise<Slide[] | null> => {
    setLoading(true);
    setError(null);
    try {
      if (!file) throw new Error('Debes subir un documento PDF o TXT.');

      const fileText = await extractTextFromFile(file);

      if (!fileText) {
        throw new Error('No se pudo extraer texto del PDF. Asegúrate de que contiene texto seleccionable (no es una imagen escaneada).');
      }

      const res = await fetch('/api/presentation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileText, moduleTitle, numSlides }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al generar la presentación');
      }

      const data = await res.json();
      return data.slides as Slide[];
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
