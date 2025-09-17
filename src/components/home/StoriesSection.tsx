// src/components/home/StoriesSection.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type Accent = "teal" | "pink" | "yellow";

interface Story {
  id: string;
  accent: Accent;
  icon: string;
  title: string;
  content: string;
}

const ACCENT: Record<
  Accent,
  { border: string; bg: string; text: string; ring: string }
> = {
  teal: {
    border: "border-teal-400",
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
  },
  pink: {
    border: "border-pink-400",
    bg: "bg-pink-50",
    text: "text-pink-700",
    ring: "ring-pink-200",
  },
  yellow: {
    border: "border-yellow-400",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    ring: "ring-yellow-200",
  },
};

const stories: Story[] = [
  {
    id: "1",
    accent: "teal",
    icon: "🤝",
    title: "New Connection",
    content:
      "Soham from Shah Anchor just connected with Tanvi from VIT Wadala.",
  },
  {
    id: "2",
    accent: "pink",
    icon: "🌏",
    title: "Cultural Exchange",
    content:
      "Viraj from KJ Somaiya and Babita from Suvidya Institute discussing cultural exchange.",
  },
  {
    id: "3",
    accent: "yellow",
    icon: "🏋‍♂",
    title: "Gym Session",
    content: "Kartik from VIT Wadala and Smith joined a gym session.",
  },
];

// Your images in /public/stories
const TRAIL_IMAGES = [
  "/stories/bgmi-removebg-preview.webp",
  "/stories/channels4_profile.webp",
  "/stories/code_forces.webp",
  "/stories/F1logo-removebg-preview.webp",
  "/stories/Gemini_Generated_Image_bfgqv1bfgqv1bfgq-removebg-preview.png",
  "/stories/rdr_2-removebg-preview.webp",
  "/stories/gym.webp",
];

const isFinePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: fine)").matches;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function StoriesSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);

  const [spriteSize, setSpriteSize] = useState(128);
  const [enableTrail, setEnableTrail] = useState(false);

  // Responsive sprite sizing
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 640) setSpriteSize(90);
      else if (w < 1024) setSpriteSize(110);
      else setSpriteSize(128);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Desktop only
  useEffect(() => {
    const update = () => setEnableTrail(isFinePointer());
    update();
    const mq = window.matchMedia("(pointer: fine)");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enableTrail) return;

    const section = sectionRef.current!;
    const layer = layerRef.current!;
    if (!section || !layer) return;

    // ---------------- Tweakables (smoothness & persistence) ----------------
    const SPRITES = 14;          // number of images in the trail
    const GAP = 12;              // how many history points between sprites
    const IDLE_FADE_MS = 2000;   // how long they remain after you stop
    const HEAD_LERP = 0.25;      // smoothing for pointer head (0..1)
    const SPRITE_FOLLOW = 0.14;  // base follow factor (0..1) — lower = smoother
    const FOLLOW_DECAY = 0.01;   // each next sprite follows a bit slower
    const ROTATE_SPREAD = 10;    // total degrees of tilt across trail
    const SCALE_STEP = 0.05;     // scale down per sprite
    // ----------------------------------------------------------------------

    // (Re)build sprites sized correctly
    if (layer.childElementCount !== SPRITES) {
      layer.innerHTML = "";
      for (let i = 0; i < SPRITES; i++) {
        const img = document.createElement("img");
        img.src = TRAIL_IMAGES[i % TRAIL_IMAGES.length];
        img.alt = "";
        img.draggable = false;
        img.className =
          "absolute top-0 left-0 pointer-events-none select-none will-change-transform drop-shadow-xl";
        img.style.width = `${spriteSize}px`;
        img.style.height = `${spriteSize}px`;
        img.style.objectFit = "contain";
        img.style.opacity = "0"; // hidden until user moves
        img.style.transition = "opacity 320ms ease";
        layer.appendChild(img);
      }
    } else {
      Array.from(layer.children).forEach((el) => {
        (el as HTMLElement).style.width = `${spriteSize}px`;
        (el as HTMLElement).style.height = `${spriteSize}px`;
      });
    }

    const sprites = Array.from(layer.children) as HTMLElement[];
    const half = spriteSize / 2;

    const rect = () => section.getBoundingClientRect();

    // allow centers to go to the edges; overflow clipping keeps them inside visually
    const clampToBounds = (cx: number, cy: number) => {
      const r = rect();
      return {
        x: clamp(cx, 0, r.width),
        y: clamp(cy, 0, r.height),
      };
    };

    // Smoothed "head" that follows pointer
    let head = { x: rect().width * 0.5, y: rect().height * 0.5 };
    let lastPointer = { ...head };
    let lastMoveTs = 0;

    // Position history buffer used for spacing
    const MAX_HISTORY = SPRITES * GAP + 60;
    const history: { x: number; y: number }[] = [{ ...head }];

    // Per-sprite smoothed state
    const state: { x: number; y: number }[] = new Array(SPRITES)
      .fill(0)
      .map(() => ({ ...head }));

    // Pointer handling (use pointer events; covers children too)
    const onPointerMove = (e: PointerEvent) => {
      const r = rect();
      const p = clampToBounds(e.clientX - r.left, e.clientY - r.top);
      lastPointer = p;
      lastMoveTs = performance.now();
      // push into history only when we get an event; draw loop will smooth
      history.push(p);
      if (history.length > MAX_HISTORY)
        history.splice(0, history.length - MAX_HISTORY);
      // reveal sprites on first move
      for (const s of sprites) s.style.opacity = "1";
    };
    const onPointerLeave = () => {
      // let idle timer fade them; don't hide instantly
      lastMoveTs = performance.now();
    };

    section.addEventListener("pointermove", onPointerMove, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);

    let raf = 0;
    let lastTime = performance.now();

    function step(now: number) {
      const dt = (now - lastTime) / 16.6667; // ~frames (1 = 60fps)
      lastTime = now;

      // Smooth the head towards the latest pointer even if the pointer isn't moving
      head.x += (lastPointer.x - head.x) * (HEAD_LERP * dt);
      head.y += (lastPointer.y - head.y) * (HEAD_LERP * dt);

      // Ensure history has a tail to sample even when idle
      history.push({ ...head });
      if (history.length > MAX_HISTORY)
        history.splice(0, history.length - MAX_HISTORY);

      // Idle fade
      if (now - lastMoveTs > IDLE_FADE_MS) {
        for (const s of sprites) s.style.opacity = "0";
      }

      // Animate each sprite toward an earlier history point
      for (let i = 0; i < sprites.length; i++) {
        const idx = history.length - 1 - i * GAP;
        const target = history[idx] ?? history[0];

        const follow = Math.max(
          0.06,
          SPRITE_FOLLOW - i * FOLLOW_DECAY
        ); // later = smoother

        state[i].x += (target.x - state[i].x) * (follow * dt);
        state[i].y += (target.y - state[i].y) * (follow * dt);

        const prev = history[idx - 2] ?? target;
        const dx = target.x - prev.x;
        const dy = target.y - prev.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        const scale = 1 - i * SCALE_STEP;
        const tilt =
          angle * 0.15 + (i - sprites.length / 2) * (ROTATE_SPREAD / sprites.length);

        sprites[i].style.transform = `translate(${state[i].x - half}px, ${
          state[i].y - half
        }px) rotate(${tilt}deg) scale(${scale})`;
        sprites[i].style.zIndex = String(2000 - i);
      }

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [enableTrail, spriteSize]);

  return (
    <section
      ref={sectionRef}
      className={[
        "relative w-full max-w-7xl mx-auto px-6",
        // make the whole area big enough and clip trail inside
        "py-32 md:py-36 lg:py-40",
        enableTrail ? "cursor-none" : "cursor-auto",
        "overflow-hidden rounded-3xl",
      ].join(" ")}
    >
      {/* Trail layer spans the entire section */}
      {enableTrail && (
        <div
          ref={layerRef}
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: "inset(0 0 0 0)" }}
        />
      )}

      <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-10">
        Community
      </h2>

      <div className="grid items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map((story) => {
          const a = ACCENT[story.accent];
          return (
            <article
              key={story.id}
              className={[
                "h-[270px] md:h-[290px] lg:h-[310px]",
                "rounded-2xl p-7",
                "border-t-4",
                a.border,
                a.bg,
                "ring-1",
                a.ring,
                "shadow-[0_18px_40px_-20px_rgba(2,6,23,0.12)]",
                "backdrop-blur-sm",
              ].join(" ")}
            >
              <header className="flex items-center gap-4 mb-3">
                <span className="text-4xl md:text-5xl leading-none">{story.icon}</span>
                <h3 className={["font-semibold text-xl md:text-2xl", a.text].join(" ")}>
                  {story.title}
                </h3>
              </header>
              <p className="text-slate-700 text-base md:text-lg leading-relaxed">
                {story.content}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
