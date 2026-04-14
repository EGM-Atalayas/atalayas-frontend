"use client";

import React, { useRef, useEffect, useState, ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

interface SplitTextProps {
  text: string;
  tag?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words,chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  onLetterAnimationComplete?: () => void;
}

export default function SplitText({
  text,
  tag: Tag = "p",
  className = "",
  style: styleProp,
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!ref.current || !text || !fontsLoaded) return;
    if (animationCompletedRef.current) return;

    const el = ref.current as any;

    if (el._rbsplitInstance) {
      try { el._rbsplitInstance.revert(); } catch (_) {}
      el._rbsplitInstance = null;
    }

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit  = marginMatch ? marginMatch[2] || "px" : "px";
    const sign =
      marginValue === 0
        ? ""
        : marginValue < 0
        ? `-=${Math.abs(marginValue)}${marginUnit}`
        : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    let targets: Element[] = [];
    const splitInstance = new GSAPSplitText(el, {
      type: splitType,
      smartWrap: true,
      linesClass: "split-line",
      wordsClass: "split-word",
      charsClass: "split-char",
      reduceWhiteSpace: false,
      onSplit(self: any) {
        if (splitType.includes("chars") && self.chars?.length)  targets = self.chars;
        else if (splitType.includes("words") && self.words?.length) targets = self.words;
        else if (splitType.includes("lines") && self.lines?.length) targets = self.lines;
        else targets = self.chars || self.words || self.lines || [];

        gsap.fromTo(
          targets,
          { ...from },
          {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              fastScrollEnd: true,
            },
            onComplete() {
              animationCompletedRef.current = true;
              onCompleteRef.current?.();
            },
            willChange: "transform, opacity",
            force3D: true,
          }
        );
      },
    });

    el._rbsplitInstance = splitInstance;

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
      try { splitInstance.revert(); } catch (_) {}
      el._rbsplitInstance = null;
    };
  }, [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, fontsLoaded]);

  return (
    <Tag
      ref={ref}
      className={`split-parent ${className}`}
      style={{ textAlign, display: "inline", whiteSpace: "normal", wordWrap: "break-word", willChange: "transform, opacity", verticalAlign: "baseline", ...styleProp } as React.CSSProperties}
    >
      {text}
    </Tag>
  );
}
