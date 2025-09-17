// src/components/ui/CustomCursor.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const ringRef = useRef<SVGSVGElement | null>(null);
  const dotRef = useRef<SVGSVGElement | null>(null);
  const visibleRef = useRef(false);

  const coarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (coarsePointer || reduced) return;

    const ring = ringRef.current!;
    const dot = dotRef.current!;

    // Hide native cursor site-wide (inputs keep default)
    document.documentElement.classList.add("cursor-none");
    document.body.classList.add("cursor-none");

    const style = document.createElement("style");
    style.innerHTML = `
      input, textarea, [contenteditable="true"], .cursor-auto { cursor: text !important; }
      [data-cursor="ignore"] { cursor: auto !important; }
    `;
    document.head.appendChild(style);

    // QuickTo setters
    const setRingX = gsap.quickTo(ring, "x", { duration: 0.18, ease: "power3" });
    const setRingY = gsap.quickTo(ring, "y", { duration: 0.18, ease: "power3" });
    const setDotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });

    const show = () => {
      if (visibleRef.current) return;
      visibleRef.current = true;
      gsap.to([ring, dot], { autoAlpha: 1, duration: 0.25, ease: "power3.out" });
    };

    const move = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      setRingX(x);
      setRingY(y);
      setDotX(x);
      setDotY(y);
      show();
    };

    const down = () => {
      gsap.to(ring, { scale: 0.9, duration: 0.15, ease: "power2.out" });
      gsap.to(dot, { scale: 0.8, duration: 0.15, ease: "power2.out" });
    };
    const up = () => {
      gsap.to(ring, { scale: 1, duration: 0.2, ease: "power2.out" });
      gsap.to(dot, { scale: 1, duration: 0.2, ease: "power2.out" });
    };

    // Consider these “interactive” for hover enlarge
    const isInteractive = (el: Element | null) =>
      !!el?.closest?.('a, button, [role="button"], [data-cursor="link"]');

    let hoverTween: gsap.core.Tween | null = null;

    const over = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!isInteractive(target)) return;
      hoverTween?.kill();
      hoverTween = gsap.to(ring, {
        scale: 1.55,
        duration: 0.25,
        ease: "power3.out",
        "--cursor-stroke": "var(--cursor-accent-strong)",
        "--cursor-fill": "var(--cursor-accent-fill)",
      } as any);
      gsap.to(dot, { scale: 0.65, duration: 0.2, ease: "power3.out" });
    };

    const out = (e: MouseEvent) => {
      const related = e.relatedTarget as Element | null;
      if (isInteractive(related)) return; // still on another interactive
      hoverTween?.kill();
      gsap.to(ring, {
        scale: 1,
        duration: 0.25,
        ease: "power3.out",
        "--cursor-stroke": "var(--cursor-accent)",
        "--cursor-fill": "transparent",
      } as any);
      gsap.to(dot, { scale: 1, duration: 0.2, ease: "power3.out" });
    };

    // Listeners
    document.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      document.documentElement.classList.remove("cursor-none");
      document.body.classList.remove("cursor-none");
      style.remove();
      gsap.killTweensOf([ring, dot]);
    };
  }, [coarsePointer, reduced]);

  if (coarsePointer || reduced) return null;

  return (
    <>
      {/* Outer ring (no glow/shadow/blend) */}
      <svg
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        width="42"
        height="42"
        viewBox="0 0 42 42"
        style={{
          opacity: 0,
          transform: "translate(-21px, -21px)",
        }}
      >
        <defs>
          <style>{`
            :root {
              /* Premium orange */
              --cursor-accent: rgba(255, 122, 0, 0.95);      /* #FF7A00 */
              --cursor-accent-strong: rgba(255, 122, 0, 1);
              --cursor-accent-fill: rgba(255, 122, 0, 0.14);
            }
            .dark :root {
              /* Slightly deeper orange in dark (still premium) */
              --cursor-accent: rgba(255, 140, 0, 0.95);      /* ~#FF8C00 */
              --cursor-accent-strong: rgba(255, 140, 0, 1);
              --cursor-accent-fill: rgba(255, 140, 0, 0.16);
            }
          `}</style>
        </defs>
        <circle
          cx="21"
          cy="21"
          r="18"
          stroke="var(--cursor-stroke, var(--cursor-accent))"
          strokeWidth="2"
          fill="var(--cursor-fill, transparent)"
        />
      </svg>

      {/* Inner dot (solid orange, no glow) */}
      <svg
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        style={{
          opacity: 0,
          transform: "translate(-4px, -4px)",
        }}
      >
        <circle cx="4" cy="4" r="3" fill="var(--cursor-accent-strong)" />
      </svg>
    </>
  );
}
