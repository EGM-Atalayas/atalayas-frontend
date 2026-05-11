'use client';
// ============================================================
// PresentationCreator — flujo completo para Administrador Empresa
// Pasos: 1. Subir PDF → 2. Elegir template → 3. Generar
//
// Props:
//   moduleId    : ID del módulo al que pertenece la presentación
//   moduleTitle : título del módulo (para el prompt)
//   onSave      : callback(slides, themeId) para guardar en BD
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { Slide } from './slides/SlideRenderers';
import { PresentationViewer } from './PresentationViewer';
import { useGeneratePresentation } from '../hooks/useGeneratePresentation';
import { THEMES } from '../constants/presentation';
import styles from './PresentationCreator.module.css';

// ─── Sub-componentes ──────────────────────────────────────────

function StepPills({ step }: { step: number }) {
  const labels = ['Subir PDF', 'Elegir estilo', 'Generar'];
  return (
    <div className={styles.pills}>
      {labels.map((label, i) => (
        <div
          key={i}
          className={`${styles.pill} ${i < step ? styles.pillDone : ''} ${i === step ? styles.pillActive : ''}`}
        >
          {i < step && <span>✓ </span>}
          {label}
        </div>
      ))}
    </div>
  );
}

function UploadStep({ onFileReady }: { onFileReady: (file: File | null) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null!);

  const setAndNotify = (f: File | null) => {
    setFile(f);
    onFileReady(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setAndNotify(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className={`${styles.dropzone} ${drag ? styles.dropzoneDrag : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
      >
        <div className={styles.dropzoneIcon}>📄</div>
        <p className={styles.dropzoneTitle}>Arrastra el PDF aquí</p>
        <p className={styles.dropzoneSub}>o haz clic para seleccionar · PDF, TXT</p>
        <input
          ref={ref}
          type="file"
          accept=".pdf,.txt"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setAndNotify(f); }}
        />
      </div>

      {file && (
        <div className={styles.fileChip}>
          <span className={styles.fileChipIcon}>📄</span>
          <span className={styles.fileChipName}>{file.name}</span>
          <span className={styles.fileChipSize}>{(file.size / 1024).toFixed(0)} KB</span>
          <button
            className={styles.fileChipRemove}
            onClick={(e) => { e.stopPropagation(); setAndNotify(null); }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

function ThemeStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className={styles.themeGrid}>
      {THEMES.map((t) => (
        <div
          key={t.id}
          className={`${styles.themeCard} ${selected === t.id ? styles.themeCardSelected : ''}`}
          style={selected === t.id ? { borderColor: t.color } : {}}
          onClick={() => onSelect(t.id)}
        >
          <div className={styles.themePreview} style={{ background: t.swatch }}>
            <div
              className={styles.themePreviewTag}
              style={{ color: t.id === 'minimal' ? '#378ADD' : t.id === 'amber' ? '#FAC775' : 'rgba(255,255,255,0.7)' }}
            >
              Módulo · Formación
            </div>
            <div
              className={styles.themePreviewTitle}
              style={{ color: t.id === 'minimal' ? '#111' : t.id === 'amber' ? '#FAEEDA' : '#fff' }}
            >
              {t.name}
            </div>
          </div>
          <div className={styles.themeCardInfo}>
            <div>
              <div className={styles.themeCardName}>{t.name}</div>
              <div className={styles.themeCardDesc}>{t.description}</div>
            </div>
            <div
              className={`${styles.themeCheck} ${selected === t.id ? styles.themeCheckOn : ''}`}
              style={selected === t.id ? { background: t.color, borderColor: t.color } : {}}
            >
              {selected === t.id && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────

interface PresentationCreatorProps {
  moduleId?: string;
  moduleTitle?: string;
  onSave?: (slides: Slide[], themeId: string) => void;
}

const SLIDE_COUNT_OPTIONS = [6, 8, 10, 12, 15, 20];

export function PresentationCreator({ moduleTitle = '', onSave }: PresentationCreatorProps) {
  const [step, setStep] = useState(0);   // 0 upload | 1 theme | 2 generate | 3 preview
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [numSlides, setNumSlides] = useState(10);

  const { generate, loading, error } = useGeneratePresentation();

  const handleFileReady = (f: File | null) => {
    setFile(f);
  };

  const handleGenerate = async () => {
    const result = await generate(file, moduleTitle, numSlides);
    if (result) {
      setSlides(result);
      setStep(3);
    }
  };

  const handleSave = () => {
    if (slides && theme) {
      onSave?.(slides, theme);
    }
  };

  const handleReset = () => {
    setStep(0); setFile(null); setTheme(null); setSlides(null);
  };

  const STEP_TITLES = [
    'Subir documento del módulo',
    'Elige el estilo visual',
    'Revisar y generar',
    'Vista previa',
  ];
  const STEP_SUBS = [
    'Sube el PDF o texto del contenido de formación',
    'Selecciona el template que mejor encaje con el contenido',
    'Claude generará los slides automáticamente desde el documento',
    'Revisa la presentación antes de guardarla',
  ];

  return (
    <div className={styles.creator}>
      {step < 3 && (
        <>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>{STEP_TITLES[step]}</h2>
            <p className={styles.headerSub}>{STEP_SUBS[step]}</p>
          </div>
          <StepPills step={step} />
        </>
      )}

      {/* PASO 0: SUBIR PDF */}
      {step === 0 && (
        <>
          <UploadStep onFileReady={handleFileReady} />
          <div className={styles.btnRow}>
            <button
              className={styles.btnPrimary}
              disabled={!file}
              onClick={() => setStep(1)}
            >
              Continuar →
            </button>
          </div>
        </>
      )}

      {/* PASO 1: ELEGIR TEMA */}
      {step === 1 && (
        <>
          <ThemeStep selected={theme} onSelect={setTheme} />
          <div className={styles.btnRow}>
            <button className={styles.btnSecondary} onClick={() => setStep(0)}>Atrás</button>
            <button
              className={styles.btnPrimary}
              disabled={!theme}
              onClick={() => setStep(2)}
            >
              Confirmar estilo →
            </button>
          </div>
        </>
      )}

      {/* PASO 2: GENERAR */}
      {step === 2 && !loading && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryIcon}>📄</div>
            <div>
              <p className={styles.summaryTitle}>{file?.name}</p>
              <p className={styles.summarySub}>
                Template: {THEMES.find((t) => t.id === theme)?.name}
              </p>
            </div>
          </div>

          {/* Selector de número de diapositivas */}
          <div className={styles.slideCountRow}>
            <span className={styles.slideCountLabel}>Número de diapositivas</span>
            <div className={styles.slideCountOptions}>
              {SLIDE_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.slideCountBtn} ${numSlides === n ? styles.slideCountBtnActive : ''}`}
                  onClick={() => setNumSlides(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

          <button className={styles.btnGenerate} onClick={handleGenerate}>
            ✨ Generar {numSlides} diapositivas con IA
          </button>
          <div className={styles.btnRow} style={{ marginTop: '0.75rem' }}>
            <button className={styles.btnSecondary} onClick={() => setStep(1)}>Cambiar estilo</button>
          </div>
        </>
      )}

      {/* PASO 2: CARGANDO */}
      {step === 2 && loading && (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <p className={styles.loadingTitle}>Generando tu presentación...</p>
          <p className={styles.loadingSub}>La IA está analizando el documento y creando los slides</p>
          <div className={styles.loadingTrack}>
            <div className={styles.loadingBar} />
          </div>
        </div>
      )}

      {/* PASO 3: PREVIEW */}
      {step === 3 && slides && theme && (
        <>
          <div className={styles.previewHeader}>
            <h2 className={styles.headerTitle}>Vista previa</h2>
            <button className={styles.btnSecondary} onClick={handleReset}>
              Volver a crear
            </button>
          </div>
          <PresentationViewer
            slides={slides}
            themeId={theme}
            onDeleteSlide={(idx) =>
              setSlides((prev) => prev ? prev.filter((_, i) => i !== idx) : prev)
            }
          />
          <div className={styles.btnRow} style={{ marginTop: '1rem' }}>
            <button className={styles.btnPrimary} onClick={handleSave}>
              Guardar presentación
            </button>
          </div>
        </>
      )}
    </div>
  );
}
