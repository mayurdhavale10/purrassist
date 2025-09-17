// src/components/home/HowToUseItPaint.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const COLORS = {
  sw1: "#60A7AC", // teal light
  sw2: "#3D7F85", // teal deep
  sw3: "#F59E0B", // amber
  text: "#1C1C1C",
  bgLight: "#F5F5DC",
  bgDark: "#F5F5DC", // keep beige in dark for legibility
};

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function HowToUseItPaint() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // swatches
  const paintRef = useRef<HTMLCanvasElement | null>(null);  // veil (desktop+mobile)

  // --- sizing ---------------------------------------------------------------
  const resizeCanvases = () => {
    const el = sectionRef.current;
    const c1 = canvasRef.current;
    const c2 = paintRef.current;
    if (!el || !c1 || !c2) return;

    const rect = el.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    [c1, c2].forEach((c) => {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    const vctx = c2.getContext("2d");
    if (vctx) {
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vctx.clearRect(0, 0, w, h);
      vctx.fillStyle = "rgba(0,0,0,0.25)"; // veil to erase
      vctx.fillRect(0, 0, w, h);
    }
  };

  // --- swatches painter (scroll-driven) -------------------------------------
  const drawSwatches = (progress: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const w = c.clientWidth;
    const h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? COLORS.bgDark : COLORS.bgLight;
    ctx.fillRect(0, 0, w, h);

    const t1 = clamp(progress * 1.2);
    const t2 = clamp((progress - 0.15) * 1.2);
    const t3 = clamp((progress - 0.35) * 1.3);

    // swatch 1
    {
      const cx = lerp(-0.35 * w, 0.15 * w, t1);
      const cy = lerp(-0.2 * h, 0.25 * h, t1);
      const rx = w * 0.65;
      const ry = h * 0.55;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.25);
      ctx.fillStyle = COLORS.sw1;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // swatch 2
    {
      const cx = lerp(1.2 * w, 0.72 * w, t2);
      const cy = lerp(0.15 * h, 0.45 * h, t2);
      const k = lerp(0.6, 1, t2);
      const rx = w * 0.55 * k;
      const ry = h * 0.5 * k;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.05);
      ctx.fillStyle = COLORS.sw2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // swatch 3
    {
      const cx = lerp(1.15 * w, 0.35 * w, t3);
      const cy = lerp(-0.25 * h, 0.15 * h, t3);
      const rx = w * 0.75;
      const ry = h * 0.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.9);
      ctx.fillStyle = COLORS.sw3;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;

    const onFrame = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visibleStart = vh * 0.1;
      const visibleEnd = vh * 0.6;
      const raw = 1 - (rect.top - visibleStart) / (rect.height + visibleEnd);
      const progress = clamp(raw);
      drawSwatches(progress);
      raf = requestAnimationFrame(onFrame);
    };

    const onResize = () => {
      resizeCanvases();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onFrame);
    };

    resizeCanvases();
    raf = requestAnimationFrame(onFrame);

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, []);

  // --- veil paint (desktop hover, touch drag) with Pointer Events -----------
  useEffect(() => {
    const el = sectionRef.current;
    const canvas = paintRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // on desktop (mouse) we erase on move; on touch we erase only when pressing
    let isDown = false;
    let prevX = 0;
    let prevY = 0;
    let hasPrev = false;
    const RADIUS = 48;

    const rectOf = () => el.getBoundingClientRect();
    const drawDot = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    };

    const paintMove = (clientX: number, clientY: number) => {
      const r = rectOf();
      const x = clientX - r.left;
      const y = clientY - r.top;

      if (!hasPrev) {
        drawDot(x, y);
        prevX = x;
        prevY = y;
        hasPrev = true;
        return;
      }
      const dx = x - prevX;
      const dy = y - prevY;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / (RADIUS * 0.5)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        drawDot(prevX + dx * t, prevY + dy * t);
      }
      prevX = x;
      prevY = y;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        // desktop: erase on hover move
        paintMove(e.clientX, e.clientY);
      } else {
        // touch/pen: only while pressed
        if (!isDown) return;
        paintMove(e.clientX, e.clientY);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      isDown = true;
      hasPrev = false; // start a fresh stroke
      paintMove(e.clientX, e.clientY);
    };
    const onPointerUp = () => {
      isDown = false;
      hasPrev = false;
    };
    const onPointerLeave = () => {
      isDown = false;
      hasPrev = false;
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ background: COLORS.bgLight }}
    >
      {/* Swatches (make non-interactive so hovers reach content) */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ display: "block" }}
      />
      {/* Veil (now rendered on all devices; touch paints while pressed) */}
      <canvas
        ref={paintRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28">
        <div className="mb-8 md:mb-10">
          <p
            className="uppercase tracking-[0.18em] font-black mb-3"
            style={{ color: COLORS.text, fontSize: "clamp(12px, 1vw, 14px)" }}
            data-cursor="hover"
          >
            HOW TO USE IT
          </p>
          <h2
            className="font-black leading-[1.05]"
            style={{ color: COLORS.text, fontSize: "clamp(28px, 4.4vw, 60px)" }}
            data-cursor="hover"
          >
            <span className="faux-3d faux-3d--xl">Connect.</span>{" "}
            <span className="faux-3d faux-3d--xl">Chat.</span>{" "}
            <span className="faux-3d faux-3d--xl">Community.</span>
          </h2>
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <li
            className="rounded-2xl p-6 sm:p-7 bg-white/90 ring-1 ring-black/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.25)]"
            style={{ color: COLORS.text }}
            data-cursor="hover"
          >
            <div className="flex items-start gap-4 mb-3">
              <span className="inline-grid place-items-center w-10 h-10 rounded-full font-extrabold bg-black text-white">
                1
              </span>
              <h3 className="text-xl font-extrabold">Step 1: Join with Your College Email</h3>
            </div>
            <p className="text-[15px] leading-relaxed opacity-90">
              Your safety comes first. We require a{" "}
              <span className="faux-3d faux-3d--lg" data-cursor="hover">
                college email to ensure our community is made up of real students
              </span>
              . This simple step keeps out creeps, bots, and spammers, creating a
              secure space where you can connect authentically with your peers.
            </p>
            <button
              onClick={() => signIn("google")}
              className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold bg-black text-white shadow hover:opacity-90 active:opacity-100 transition"
              aria-label="Join with your college email"
              data-cursor="hover"
            >
              Join
            </button>
          </li>

          {/* Step 2 */}
          <li
            className="rounded-2xl p-6 sm:p-7 bg-white/90 ring-1 ring-black/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.25)]"
            style={{ color: COLORS.text }}
            data-cursor="hover"
          >
            <div className="flex items-start gap-4 mb-3">
              <span className="inline-grid place-items-center w-10 h-10 rounded-full font-extrabold bg-black text-white">
                2
              </span>
              <h3 className="text-xl font-extrabold">Step 2: Connect with New Faces</h3>
            </div>
            <p className="text-[15px] leading-relaxed opacity-90">
              Now for the fun part. Your profile is all set, and you’re part of the
              community. Click{" "}
              <span className="faux-3d faux-3d--lg" data-cursor="hover">“Start Video Chat”</span>{" "}
              to get instantly paired with another student. You never know who you
              might meet.
            </p>
            <Link
              href="/video"
              className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold bg-black text-white shadow hover:opacity-90 active:opacity-100 transition"
              aria-label="Start Video Chat"
              data-cursor="hover"
            >
              <span className="faux-3d faux-3d--lg">Start Video Chat</span>
            </Link>
          </li>

          {/* Step 3 */}
          <li
            className="rounded-2xl p-6 sm:p-7 bg-white/90 ring-1 ring-black/10 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.25)]"
            style={{ color: COLORS.text }}
            data-cursor="hover"
          >
            <div className="flex items-start gap-4 mb-3">
              <span className="inline-grid place-items-center w-10 h-10 rounded-full font-extrabold bg-black text-white">
                3
              </span>
              <h3 className="text-xl font-extrabold">Step 3: Cultivate Your Community</h3>
            </div>
            <p className="text-[15px] leading-relaxed opacity-90">
              Turn a single conversation into a meaningful connection. Easily add
              friends to your network and join exclusive communities built around
              your passions,{" "}
              <span className="faux-3d faux-3d--lg" data-cursor="hover">
                from study groups to hobby clubs
              </span>
              . Your community is just a click away.
            </p>
            <Link
              href="/community"
              className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold bg-white text-black ring-1 ring-black/15 shadow-sm hover:bg-black hover:text-white transition"
              aria-label="Open Community"
              data-cursor="hover"
            >
              Community
            </Link>
          </li>
        </ol>
      </div>

      {/* 3D hover helpers */}
      <style jsx>{`
        .faux-3d {
          display: inline-block;
          transition: transform 220ms cubic-bezier(.2,.8,.2,1), text-shadow 220ms ease;
          will-change: transform, text-shadow;
        }
        .faux-3d--xl:hover,
        .faux-3d--xl:focus {
          transform: translateY(-2px) scale(1.10);
          text-shadow:
            0 1px 0 rgba(0,0,0,0.9),
            0 2px 0 rgba(0,0,0,0.85),
            0 3px 0 rgba(0,0,0,0.80),
            0 4px 6px rgba(0,0,0,0.28);
        }
        .faux-3d--lg:hover,
        .faux-3d--lg:focus {
          transform: translateY(-1px) scale(1.08);
          text-shadow:
            0 1px 0 rgba(0,0,0,0.9),
            0 2px 0 rgba(0,0,0,0.85),
            0 3px 4px rgba(0,0,0,0.25);
        }
      `}</style>
    </section>
  );
}
