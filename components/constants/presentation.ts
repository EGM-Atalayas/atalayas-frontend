// ============================================================
// EGM Atalayas — Constantes de presentación
// ============================================================

export interface Theme {
  id: string;
  name: string;
  description: string;
  color: string;
  accent: string;
  swatch: string;
}

export const THEMES: Theme[] = [
  {
    id: 'green',
    name: 'Verde Corporativo',
    description: 'Profesional y natural',
    color: '#1D9E75',
    accent: '#1D9E75',
    swatch: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 100%)',
  },
  {
    id: 'dark',
    name: 'Oscuro Elegante',
    description: 'Moderno y sofisticado',
    color: '#534AB7',
    accent: '#AFA9EC',
    swatch: 'linear-gradient(135deg, #1a1a2e 0%, #26215C 100%)',
  },
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Limpio y directo',
    color: '#378ADD',
    accent: '#378ADD',
    swatch: 'linear-gradient(135deg, #f0f6ff 0%, #E6F1FB 100%)',
  },
  {
    id: 'amber',
    name: 'Cálido Amber',
    description: 'Cálido y acogedor',
    color: '#EF9F27',
    accent: '#EF9F27',
    swatch: 'linear-gradient(135deg, #2d1a00 0%, #412402 100%)',
  },
];

export const SLIDE_TYPES: Record<string, string> = {
  cover: 'Portada',
  bullets: 'Objetivos',
  highlight: 'Datos clave',
  steps: 'Pasos',
  twocol: 'Comparativa',
  closing: 'Cierre',
};
