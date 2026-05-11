"use client";

let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function cargarVoces(): SpeechSynthesisVoice[] {
  if (voices.length > 0) return voices;
  if (typeof window === "undefined") return [];
  voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) voicesLoaded = true;
  return voices;
}

function esperarVoces(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const ya = cargarVoces();
    if (ya.length > 0) return resolve(ya);
    if (typeof window === "undefined") return resolve([]);
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(voices);
    };
    setTimeout(() => resolve(cargarVoces()), 1000);
  });
}

let promesaVoces: Promise<SpeechSynthesisVoice[]> | null = null;

export function getBestSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!promesaVoces) promesaVoces = esperarVoces();
  return promesaVoces.then((available) => {
    const matchers = [
      (v: SpeechSynthesisVoice) => v.lang.startsWith("es") && /helena|zira/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.lang.startsWith("es") && /google/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.lang.startsWith("es") && /microsoft/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.lang.startsWith("es"),
    ];
    for (const fn of matchers) {
      const found = available.find(fn);
      if (found) return found;
    }
    return available[0] ?? null;
  });
}

export function getVoiceName(): Promise<string> {
  return getBestSpanishVoice().then((v) =>
    v ? `${v.name} (${v.lang})` : "Voz por defecto"
  );
}
