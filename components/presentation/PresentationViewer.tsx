'use client';
// ============================================================
// PresentationViewer — componente de solo lectura
// Para el rol Usuario Empleado al ver un módulo
//
// Props:
//   slides   : array de slides (del JSON guardado en BD)
//   themeId  : 'green' | 'dark' | 'minimal' | 'amber'
//   onFinish : callback cuando el empleado llega al último slide
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SlideRenderer, Slide } from './slides/SlideRenderers';
import { THEMES, SLIDE_TYPES } from '../constants/presentation';
import styles from './PresentationViewer.module.css';

interface PresentationViewerProps {
  slides?: Slide[];
  themeId?: string;
  onFinish?: () => void;
  onDeleteSlide?: (index: number) => void;
}

export function PresentationViewer({ slides = [], themeId = 'green', onFinish, onDeleteSlide }: PresentationViewerProps) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const pct = Math.round(((current + 1) / total) * 100);
  const isLast = current === total - 1;

  const goTo = (n: number) => {
    if (n >= 0 && n < total) setCurrent(n);
  };

  const handleDelete = () => {
    if (!onDeleteSlide) return;
    onDeleteSlide(current);
    // Ajustar índice si era el último
    if (current >= slides.length - 1) setCurrent(Math.max(0, current - 1));
  };

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
    } else {
      goTo(current + 1);
    }
  };

  if (total === 0) {
    return (
      <div className={styles.viewer}>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
          No hay slides disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.viewer}>
      {/* Barra de progreso */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${pct}%`, background: theme.accent }}
        />
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        <span className={styles.slideLabel}>
          {SLIDE_TYPES[slides[current]?.type] || ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {onDeleteSlide && total > 1 && (
            <button
              onClick={handleDelete}
              title="Eliminar esta diapositiva"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: '#FEF2F2', border: '0.5px solid #FCA5A5',
                borderRadius: '6px', padding: '0.2rem 0.6rem',
                fontSize: '0.72rem', color: '#DC2626', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500,
              }}
            >
              <X style={{ width: '11px', height: '11px' }} /> Eliminar slide
            </button>
          )}
          <span className={styles.counter}>{current + 1} / {total}</span>
        </div>
      </div>

      {/* Slide */}
      <div className={styles.frame}>
        {slides.map((slide, i) => (
          <div
            key={i}
            style={{ display: i === current ? 'block' : 'none', width: '100%', height: '100%' }}
          >
            <SlideRenderer slide={slide} themeId={themeId} />
          </div>
        ))}
      </div>

      {/* Navegación */}
      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          disabled={current === 0}
          onClick={() => goTo(current - 1)}
        >
          ← Anterior
        </button>

        <div className={styles.dots}>
          {slides.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              style={i === current ? { background: theme.accent } : {}}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button
          className={`${styles.navBtn} ${isLast ? styles.navBtnFinish : ''}`}
          style={isLast ? { background: theme.accent, color: '#fff', borderColor: theme.accent } : {}}
          onClick={handleNext}
        >
          {isLast ? 'Finalizar módulo →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
