// ============================================================
// EGM Atalayas — Slide Renderers
// Un componente por tema. Cada uno renderiza todos los tipos
// de slide (cover, bullets, highlight, steps, twocol, closing)
// ============================================================

import React from 'react';
import styles from './SlideRenderers.module.css';

interface Stat { number: string; description: string; }
interface Step { title: string; description: string; }
interface Col  { heading: string; body: string; }

export interface Slide {
  type: 'cover' | 'bullets' | 'highlight' | 'steps' | 'twocol' | 'closing';
  module_label?: string;
  title?: string;
  subtitle?: string;
  points?: string[];
  stats?: Stat[];
  steps?: Step[];
  col_a?: Col;
  col_b?: Col;
  body?: string;
  cta?: string;
}

// ─────────────────────────────────────────────
// TEMA 1: VERDE CORPORATIVO
// ─────────────────────────────────────────────
export function SlideGreen({ slide }: { slide: Slide }) {
  if (slide.type === 'cover') {
    return (
      <div className={`${styles.slide} ${styles.t1Cover}`}>
        <div className={styles.t1Deco1} />
        <div className={styles.t1Deco2} />
        <div className={styles.t1Eyebrow}>{slide.module_label}</div>
        <h1 className={styles.t1Title}>{slide.title}</h1>
        <p className={styles.t1Sub}>{slide.subtitle}</p>
      </div>
    );
  }
  if (slide.type === 'bullets') {
    return (
      <div className={`${styles.slide} ${styles.t1Content}`}>
        <h2 className={styles.t1H2}>{slide.title}</h2>
        <ul className={styles.t1List}>
          {(slide.points || []).map((p, i) => (
            <li key={i} className={styles.t1ListItem}>
              <span className={styles.t1Dot}>✓</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (slide.type === 'highlight') {
    return (
      <div className={`${styles.slide} ${styles.t1Content}`}>
        <h2 className={styles.t1H2}>{slide.title}</h2>
        <div className={styles.t1StatGrid}>
          {(slide.stats || []).map((s, i) => (
            <div key={i} className={styles.t1StatCard}>
              <div className={styles.t1StatNum}>{s.number}</div>
              <div className={styles.t1StatDesc}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'steps') {
    return (
      <div className={`${styles.slide} ${styles.t1Content}`}>
        <h2 className={styles.t1H2}>{slide.title}</h2>
        <div className={styles.t1Steps}>
          {(slide.steps || []).map((s, i) => (
            <div key={i} className={styles.t1StepItem}>
              <div className={styles.t1StepNum}>{i + 1}</div>
              <div>
                <h4 className={styles.t1StepTitle}>{s.title}</h4>
                <p className={styles.t1StepDesc}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'twocol') {
    return (
      <div className={`${styles.slide} ${styles.t1Content}`}>
        <h2 className={styles.t1H2}>{slide.title}</h2>
        <div className={styles.t1TwoCol}>
          <div className={styles.t1ColCard}>
            <h3 className={styles.t1ColH3}>{slide.col_a?.heading}</h3>
            <p className={styles.t1ColP}>{slide.col_a?.body}</p>
          </div>
          <div className={styles.t1ColCard}>
            <h3 className={styles.t1ColH3}>{slide.col_b?.heading}</h3>
            <p className={styles.t1ColP}>{slide.col_b?.body}</p>
          </div>
        </div>
      </div>
    );
  }
  if (slide.type === 'closing') {
    return (
      <div className={`${styles.slide} ${styles.t1Closing}`}>
        <div className={styles.t1Circle}>✓</div>
        <h2 className={styles.t1ClosingTitle}>{slide.title}</h2>
        <p className={styles.t1ClosingBody}>{slide.body}</p>
        <button className={styles.t1Cta}>{slide.cta}</button>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// TEMA 2: OSCURO ELEGANTE
// ─────────────────────────────────────────────
export function SlideDark({ slide }: { slide: Slide }) {
  if (slide.type === 'cover') {
    return (
      <div className={`${styles.slide} ${styles.t2Cover}`}>
        <div className={styles.t2Deco} />
        <div className={styles.t2Eyebrow}>{slide.module_label}</div>
        <h1 className={styles.t2Title}>{slide.title}</h1>
        <div className={styles.t2Line} />
        <p className={styles.t2Sub}>{slide.subtitle}</p>
      </div>
    );
  }
  if (slide.type === 'bullets') {
    return (
      <div className={`${styles.slide} ${styles.t2Content}`}>
        <span className={styles.t2Tag}>Objetivos</span>
        <h2 className={styles.t2H2}>{slide.title}</h2>
        <ul className={styles.t2List}>
          {(slide.points || []).map((p, i) => (
            <li key={i} className={styles.t2ListItem}>{p}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (slide.type === 'highlight') {
    return (
      <div className={`${styles.slide} ${styles.t2Content}`}>
        <h2 className={styles.t2H2}>{slide.title}</h2>
        <div className={styles.t2StatGrid}>
          {(slide.stats || []).map((s, i) => (
            <div key={i} className={styles.t2StatCard}>
              <div className={styles.t2StatNum}>{s.number}</div>
              <div className={styles.t2StatDesc}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'steps') {
    return (
      <div className={`${styles.slide} ${styles.t2Content}`}>
        <h2 className={styles.t2H2}>{slide.title}</h2>
        <div className={styles.t2Steps}>
          {(slide.steps || []).map((s, i) => (
            <div key={i} className={styles.t2StepItem}>
              <div className={styles.t2StepNum}>{i + 1}</div>
              <div>
                <h4 className={styles.t2StepTitle}>{s.title}</h4>
                <p className={styles.t2StepDesc}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'twocol') {
    return (
      <div className={`${styles.slide} ${styles.t2Content}`}>
        <h2 className={styles.t2H2}>{slide.title}</h2>
        <div className={styles.t2TwoCol}>
          <div className={styles.t2ColCard}>
            <h3 className={styles.t2ColH3}>{slide.col_a?.heading}</h3>
            <p className={styles.t2ColP}>{slide.col_a?.body}</p>
          </div>
          <div className={styles.t2ColCard}>
            <h3 className={styles.t2ColH3}>{slide.col_b?.heading}</h3>
            <p className={styles.t2ColP}>{slide.col_b?.body}</p>
          </div>
        </div>
      </div>
    );
  }
  if (slide.type === 'closing') {
    return (
      <div className={`${styles.slide} ${styles.t2Closing}`}>
        <div className={styles.t2Badge}>✓ Completado</div>
        <h2 className={styles.t2ClosingTitle}>{slide.title}</h2>
        <p className={styles.t2ClosingBody}>{slide.body}</p>
        <button className={styles.t2Cta}>{slide.cta}</button>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// TEMA 3: MINIMALISTA CLARO
// ─────────────────────────────────────────────
export function SlideMinimal({ slide }: { slide: Slide }) {
  if (slide.type === 'cover') {
    return (
      <div className={`${styles.slide} ${styles.t3Cover}`}>
        <div className={styles.t3BgNum}>03</div>
        <div className={styles.t3Eyebrow}>{slide.module_label}</div>
        <h1 className={styles.t3Title}>{slide.title}</h1>
        <p className={styles.t3Sub}>{slide.subtitle}</p>
      </div>
    );
  }
  if (slide.type === 'bullets') {
    return (
      <div className={`${styles.slide} ${styles.t3Content}`}>
        <div className={styles.t3Label}>Objetivos del módulo</div>
        <h2 className={styles.t3H2}>{slide.title}</h2>
        <ul className={styles.t3List}>
          {(slide.points || []).map((p, i) => (
            <li key={i} className={styles.t3ListItem}>
              <span className={styles.t3Num}>0{i + 1}</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (slide.type === 'highlight') {
    return (
      <div className={`${styles.slide} ${styles.t3Content}`}>
        <div className={styles.t3Label}>Datos clave</div>
        <h2 className={styles.t3H2}>{slide.title}</h2>
        <div className={styles.t3StatGrid}>
          {(slide.stats || []).map((s, i) => (
            <div key={i} className={styles.t3StatCard}>
              <div className={styles.t3StatNum}>{s.number}</div>
              <div className={styles.t3StatDesc}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'steps') {
    return (
      <div className={`${styles.slide} ${styles.t3Content}`}>
        <div className={styles.t3Label}>Procedimiento</div>
        <h2 className={styles.t3H2}>{slide.title}</h2>
        <div className={styles.t3Steps}>
          {(slide.steps || []).map((s, i) => (
            <div key={i} className={styles.t3StepItem}>
              <span className={styles.t3Num}>0{i + 1}</span>
              <div>
                <h4 className={styles.t3StepTitle}>{s.title}</h4>
                <p className={styles.t3StepDesc}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'twocol') {
    return (
      <div className={`${styles.slide} ${styles.t3Content}`}>
        <div className={styles.t3Label}>Comparativa</div>
        <h2 className={styles.t3H2}>{slide.title}</h2>
        <div className={styles.t3TwoCol}>
          <div className={styles.t3ColCard}>
            <h3 className={styles.t3ColH3}>{slide.col_a?.heading}</h3>
            <p className={styles.t3ColP}>{slide.col_a?.body}</p>
          </div>
          <div className={styles.t3ColCard}>
            <h3 className={styles.t3ColH3}>{slide.col_b?.heading}</h3>
            <p className={styles.t3ColP}>{slide.col_b?.body}</p>
          </div>
        </div>
      </div>
    );
  }
  if (slide.type === 'closing') {
    return (
      <div className={`${styles.slide} ${styles.t3Closing}`}>
        <div className={styles.t3BgCheck}>✓</div>
        <h2 className={styles.t3ClosingTitle}>{slide.title}</h2>
        <p className={styles.t3ClosingBody}>{slide.body}</p>
        <button className={styles.t3Cta}>{slide.cta}</button>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// TEMA 4: CÁLIDO AMBER
// ─────────────────────────────────────────────
export function SlideAmber({ slide }: { slide: Slide }) {
  if (slide.type === 'cover') {
    return (
      <div className={`${styles.slide} ${styles.t4Cover}`}>
        <div className={styles.t4Deco} />
        <span className={styles.t4PillTag}>{slide.module_label}</span>
        <h1 className={styles.t4Title}>{slide.title}</h1>
        <p className={styles.t4Sub}>{slide.subtitle}</p>
      </div>
    );
  }
  if (slide.type === 'bullets') {
    return (
      <div className={`${styles.slide} ${styles.t4Content}`}>
        <div className={styles.t4Accent} />
        <h2 className={styles.t4H2}>{slide.title}</h2>
        <ul className={styles.t4List}>
          {(slide.points || []).map((p, i) => (
            <li key={i} className={styles.t4ListItem}>
              <span className={styles.t4Icon}>✓</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (slide.type === 'highlight') {
    return (
      <div className={`${styles.slide} ${styles.t4Content}`}>
        <div className={styles.t4Accent} />
        <h2 className={styles.t4H2}>{slide.title}</h2>
        <div className={styles.t4StatGrid}>
          {(slide.stats || []).map((s, i) => (
            <div key={i} className={styles.t4StatCard}>
              <div className={styles.t4StatNum}>{s.number}</div>
              <div className={styles.t4StatDesc}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'steps') {
    return (
      <div className={`${styles.slide} ${styles.t4Content}`}>
        <div className={styles.t4Accent} />
        <h2 className={styles.t4H2}>{slide.title}</h2>
        <div className={styles.t4Steps}>
          {(slide.steps || []).map((s, i) => (
            <div key={i} className={styles.t4StepItem}>
              <div className={styles.t4StepNum}>{i + 1}</div>
              <div>
                <h4 className={styles.t4StepTitle}>{s.title}</h4>
                <p className={styles.t4StepDesc}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (slide.type === 'twocol') {
    return (
      <div className={`${styles.slide} ${styles.t4Content}`}>
        <div className={styles.t4Accent} />
        <h2 className={styles.t4H2}>{slide.title}</h2>
        <div className={styles.t4TwoCol}>
          <div className={styles.t4ColCard}>
            <h3 className={styles.t4ColH3}>{slide.col_a?.heading}</h3>
            <p className={styles.t4ColP}>{slide.col_a?.body}</p>
          </div>
          <div className={styles.t4ColCard}>
            <h3 className={styles.t4ColH3}>{slide.col_b?.heading}</h3>
            <p className={styles.t4ColP}>{slide.col_b?.body}</p>
          </div>
        </div>
      </div>
    );
  }
  if (slide.type === 'closing') {
    return (
      <div className={`${styles.slide} ${styles.t4Closing}`}>
        <div className={styles.t4Star}>⭐</div>
        <h2 className={styles.t4ClosingTitle}>{slide.title}</h2>
        <p className={styles.t4ClosingBody}>{slide.body}</p>
        <button className={styles.t4Cta}>{slide.cta}</button>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────
// ROUTER: devuelve el componente correcto
// ─────────────────────────────────────────────
export function SlideRenderer({ slide, themeId }: { slide: Slide; themeId: string }) {
  if (themeId === 'green')   return <SlideGreen slide={slide} />;
  if (themeId === 'dark')    return <SlideDark slide={slide} />;
  if (themeId === 'minimal') return <SlideMinimal slide={slide} />;
  if (themeId === 'amber')   return <SlideAmber slide={slide} />;
  return null;
}
