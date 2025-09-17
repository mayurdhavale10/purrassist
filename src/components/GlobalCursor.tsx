// src/components/GlobalCursor.tsx
"use client";

import React, { useEffect, useRef } from "react";

export default function GlobalCursor() {
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)")?.matches;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (coarse || reduced) return;

    const dot = dotRef.current!;

    // Hide native cursor globally (but keep I-beam for inputs)
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";
    const style = document.createElement("style");
    style.innerHTML = `
      input, textarea, select, [contenteditable="true"] { cursor: text !important; }
      [data-cursor="ignore"] { cursor: auto !important; }
    `;
    document.head.appendChild(style);

    const BASE = 14;
    const BLOB = 180;

    let targetW = BASE, targetH = BASE;
    let targetX = -100, targetY = -100;
    let w = BASE, h = BASE, x = targetX, y = targetY;
    let rafId: number | null = null;

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
    const loop = () => {
      x = lerp(x, targetX, 0.25);
      y = lerp(y, targetY, 0.25);
      w = lerp(w, targetW, 0.25);
      h = lerp(h, targetH, 0.25);
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      dot.style.width = `${w}px`;
      dot.style.height = `${h}px`;
      rafId = requestAnimationFrame(loop);
    };

    const show = () => (dot.style.opacity = "1");
    const hide = () => (dot.style.opacity = "0");
    const onMove = (e: MouseEvent) => {
      targetX = e.clientX; targetY = e.clientY;
      if (rafId == null) rafId = requestAnimationFrame(loop);
    };

    // Grow only over elements marked data-cursor="blob"
    let activeBlob: Element | null = null;
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const el = t?.closest?.('[data-cursor="blob"]') ?? null;
      if (el && el !== activeBlob) { activeBlob = el; targetW = BLOB; targetH = BLOB; }
      else if (!el && activeBlob) { activeBlob = null; targetW = BASE; targetH = BASE; }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseenter", show);
    window.addEventListener("mouseleave", hide);

    show();
    if (rafId == null) rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseenter", show);
      window.removeEventListener("mouseleave", hide);
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      style.remove();
    };
  }, [coarse, reduced]);

  if (coarse || reduced) return null;

  return (
    <div
      ref={dotRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        width: 14,
        height: 14,
        transform: "translate(-50%, -50%)",
        borderRadius: 9999,
        background: "#f97316",            // orange ball
        opacity: 0,
        zIndex: 2,                        // 👈 LOW z-index → stays behind content
        mixBlendMode: "multiply",         // 👈 blends with backgrounds/text; looks “behind”
        boxShadow: "none",
      }}
    />
  );
}
