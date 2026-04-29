"use client";

import React, {
  useCallback, useImperativeHandle, useLayoutEffect, useRef, useState, forwardRef
} from 'react';
import { gsap } from 'gsap';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuHandle {
  toggle: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  isOpen: () => boolean;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  displayItemNumbering?: boolean;
  accentColor?: string;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

const StaggeredMenu = forwardRef<StaggeredMenuHandle, StaggeredMenuProps>(({
  position = 'right',
  colors = ['#1B3F7E', '#0d1b2e'],
  items = [],
  displayItemNumbering = true,
  accentColor = '#A3B535',
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose,
}, ref) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
    });
    return () => ctx.revert();
  }, [position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) { closeTweenRef.current.kill(); closeTweenRef.current = null; }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')) as HTMLElement[];

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as any]: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(panel, { xPercent: offscreen }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
      if (numberEls.length) {
        tl.to(numberEls, { duration: 0.6, ease: 'power2.out', ['--sm-num-opacity' as any]: 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { busyRef.current = false; });
      tl.play(0);
    } else { busyRef.current = false; }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;

    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: offscreen, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { ['--sm-num-opacity' as any]: 0 });
        busyRef.current = false;
      }
    });
  }, [position]);

  const doOpen = useCallback(() => {
    openRef.current = true;
    setOpen(true);
    onMenuOpen?.();
    playOpen();
  }, [playOpen, onMenuOpen]);

  const doClose = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
  }, [playClose, onMenuClose]);

  const doToggle = useCallback(() => {
    if (openRef.current) doClose(); else doOpen();
  }, [doOpen, doClose]);

  // Exponer métodos al padre via ref
  useImperativeHandle(ref, () => ({
    toggle: doToggle,
    openMenu: doOpen,
    closeMenu: doClose,
    isOpen: () => openRef.current,
  }), [doToggle, doOpen, doClose]);

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) doClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeOnClickAway, open, doClose]);

  return (
    <div className="sm-scope fixed inset-0 z-50 pointer-events-none" aria-hidden={!open}>
      <div
        className="staggered-menu-wrapper relative w-full h-full"
        style={accentColor ? ({ ['--sm-accent' as any]: accentColor } as React.CSSProperties) : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        {/* Pre-layers */}
        <div ref={preLayersRef} className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]" aria-hidden="true">
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ['#1B3F7E', '#0d1b2e'];
            let arr = [...raw];
            if (arr.length >= 3) { const mid = Math.floor(arr.length / 2); arr.splice(mid, 1); }
            return arr.map((c, i) => (
              <div key={i} className="sm-prelayer absolute top-0 right-0 h-full w-full" style={{ background: c }} />
            ));
          })()}
        </div>

        {/* Panel */}
        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 h-full bg-white flex flex-col overflow-y-auto z-10 pointer-events-auto"
          style={{ padding: '5rem 2rem 2rem 2rem' }}
          aria-hidden={!open}
        >
          <ul className="sm-panel-list list-none m-0 p-0 flex flex-col gap-2" role="list" data-numbering={displayItemNumbering || undefined}>
            {items.map((it, idx) => (
              <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                <a
                  className="sm-panel-item relative text-black font-semibold cursor-pointer leading-none tracking-[-2px] uppercase inline-block no-underline"
                  style={{ fontSize: 'clamp(2.2rem, 10vw, 3.5rem)', paddingRight: '1.4em' }}
                  href={it.link}
                  aria-label={it.ariaLabel}
                  data-index={idx + 1}
                  onClick={doClose}
                >
                  <span className="sm-panel-itemLabel inline-block will-change-transform" style={{ transformOrigin: '50% 100%' }}>{it.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-panel { position: absolute; top: 0; right: 0; width: 100%; height: 100%; }
@media (min-width: 480px) { .sm-scope .staggered-menu-panel { width: clamp(280px, 75vw, 420px); } }
.sm-scope .sm-prelayers { position: absolute; top: 0; right: 0; bottom: 0; width: 100%; }
@media (min-width: 480px) { .sm-scope .sm-prelayers { width: clamp(280px, 75vw, 420px); } }
.sm-scope .sm-prelayer { position: absolute; top: 0; right: 0; height: 100%; width: 100%; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-panel-item { color: #000; display: inline-block; text-decoration: none; transition: color 0.2s; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #A3B535); }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); position: absolute; top: 0.1em; right: 3.2em; font-size: 13px; font-weight: 400; color: var(--sm-accent, #A3B535); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); }
      `}</style>
    </div>
  );
});

StaggeredMenu.displayName = 'StaggeredMenu';
export default StaggeredMenu;
