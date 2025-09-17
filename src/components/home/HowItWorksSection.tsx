// src/components/home/HowItWorksSection.tsx
"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorksSection() {
  // Cards shown on the right
  const featureCards = [
    { key: "verify",   title: "Verified Email",   src: "/verify_email.webp",   borderFrom: "from-blue-400",  borderTo: "to-blue-600",   captionColor: "text-blue-700",  delay: "delay-0"   },
    { key: "golive",   title: "Go Live",          src: "/golive.webp",         borderFrom: "from-pink-400",  borderTo: "to-red-500",    captionColor: "text-pink-700",  delay: "delay-150" },
    { key: "friends",  title: "Make Friends",     src: "/make_friends.webp",   borderFrom: "from-teal-400",  borderTo: "to-green-500",  captionColor: "text-teal-700",  delay: "delay-300" },
    { key: "interests",title: "Shared Interests", src: "/shared_interest.webp",borderFrom: "from-purple-500",borderTo: "to-yellow-400", captionColor: "text-purple-700",delay: "delay-500" },
  ];

  // Animation refs (left column + section scope)
  const sectionScope   = useRef<HTMLDivElement | null>(null);
  const leftScope      = useRef<HTMLDivElement | null>(null);
  const posterRef      = useRef<HTMLDivElement | null>(null);
  const badgeRef       = useRef<HTMLDivElement | null>(null);
  const titleRef       = useRef<HTMLHeadingElement | null>(null);
  const subTitleRef    = useRef<HTMLHeadingElement | null>(null);
  const oneLinerRef    = useRef<HTMLParagraphElement | null>(null);
  const introRef       = useRef<HTMLParagraphElement | null>(null);
  const bulletsWrapRef = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const bulletsNodeList =
        bulletsWrapRef.current?.querySelectorAll<HTMLElement>("[data-anim='bullet']");
      const bullets: HTMLElement[] = bulletsNodeList ? Array.from(bulletsNodeList) : [];

      // Initial states
      if (posterRef.current)   gsap.set(posterRef.current,   { opacity: 0, y: 24, scale: 0.98 });
      if (badgeRef.current)    gsap.set(badgeRef.current,    { opacity: 0, y: -40 });
      if (titleRef.current)    gsap.set(titleRef.current,    { opacity: 0, y: 18 });
      if (subTitleRef.current) gsap.set(subTitleRef.current, { opacity: 0, y: 16 });
      if (oneLinerRef.current) gsap.set(oneLinerRef.current, { opacity: 0, y: 14 });
      if (introRef.current)    gsap.set(introRef.current,    { opacity: 0, y: 14 });
      if (bullets.length)      gsap.set(bullets,             { opacity: 0, y: 14 });

      // LEFT column timeline — plays once when visible
      if (leftScope.current) {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: leftScope.current,
            start: "top 75%",
            toggleActions: "play none none none",
            once: true,
            markers: false,
            invalidateOnRefresh: true,
          },
        });

        if (posterRef.current)   tl.to(posterRef.current,   { opacity: 1, y: 0, scale: 1, duration: 0.4 });
        if (badgeRef.current)    tl.to(badgeRef.current,    { opacity: 1, y: 0, duration: 0.3 },  "-=0.05");
        if (titleRef.current)    tl.to(titleRef.current,    { opacity: 1, y: 0, duration: 0.32 }, "-=0.05");
        if (subTitleRef.current) tl.to(subTitleRef.current, { opacity: 1, y: 0, duration: 0.28 }, "-=0.06");
        if (oneLinerRef.current) tl.to(oneLinerRef.current, { opacity: 1, y: 0, duration: 0.26 }, "-=0.06");
        if (introRef.current)    tl.to(introRef.current,    { opacity: 1, y: 0, duration: 0.26 }, "-=0.06");
        if (bullets.length)      tl.to(bullets,             { opacity: 1, y: 0, duration: 0.24, stagger: 0.08 }, "-=0.05");
      }

      // RIGHT tiles — each pops in once on view
      if (sectionScope.current) {
        const tiles = sectionScope.current.querySelectorAll<HTMLElement>("[data-anim='tile']");
        tiles.forEach((tile) => {
          gsap.set(tile, { opacity: 0, y: 18, scale: 0.98 });
          gsap.to(tile, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: tile,
              start: "top 85%",
              toggleActions: "play none none none",
              once: true,
              markers: false,
            },
          });
        });
      }

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }, sectionScope);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionScope}
      className="relative w-full py-20 overflow-hidden bg-white dark:bg-[#050B1A]"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT: poster + copy */}
          <div ref={leftScope} className="relative">
            {/* Premium poster block (cursor grows anywhere inside this box) */}
            <div
              ref={posterRef}
              data-cursor="blob"                 // <<< makes the orange cursor go to max size anywhere inside this block
              className="relative rounded-3xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/10 px-6 sm:px-8 py-6 sm:py-8 max-w-2xl"
              style={{ background: "#F9D94A" }}
            >
              <div
                ref={badgeRef}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase ring-1 ring-black/10 shadow-sm relative z-10"
                style={{ color: "#1A1A1A", background: "rgba(255,255,255,0.6)" }}
              >
                There’s a better way
              </div>

              <h2
                ref={titleRef}
                className="mt-3 font-extrabold tracking-tight relative z-10"
                style={{ color: "#1A1A1A", fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
              >
                PurrAssist it is
              </h2>

              <h3
                ref={subTitleRef}
                className="mt-3 font-semibold relative z-10"
                style={{ color: "#1A1A1A", fontSize: "clamp(1.05rem, 2vw, 1.25rem)" }}
              >
                What is PurrAssist?
              </h3>

              <p
                ref={oneLinerRef}
                className="mt-2 leading-relaxed relative z-10"
                style={{ color: "#1A1A1A" }}
              >
                It’s a video chatting platform working with a simple philosophy —{" "}
                <strong>security</strong>, <strong>safety</strong>, and <strong>networking</strong>.
              </p>

              <p
                ref={introRef}
                className="mt-4 leading-relaxed relative z-10"
                style={{ color: "#1A1A1A" }}
              >
                PurrAssist is a video chat platform exclusively for verified college students that facilitates authentic connections through:
              </p>

              {/* Bullets — local SVGs (no white background) */}
              <ul ref={bulletsWrapRef} className="mt-4 space-y-3 relative z-10">
                <li data-anim="bullet" className="flex items-center gap-3 sm:gap-4">
                  <Image src="/svg/git-repository-private-fill.svg" alt="Private/verified" width={32} height={32} className="shrink-0" />
                  <span style={{ color: "#1A1A1A" }}>
                    <strong>College email verification</strong>{" "}
                    <span style={{ opacity: 0.9 }}>(preventing outsiders)</span>
                  </span>
                </li>

                <li data-anim="bullet" className="flex items-center gap-3 sm:gap-4">
                  <Image src="/svg/video-chat-fill.svg" alt="Video chat" width={32} height={32} className="shrink-0" />
                  <span style={{ color: "#1A1A1A" }}>
                    <strong>Real-time video conversations</strong>
                  </span>
                </li>

                <li data-anim="bullet" className="flex items-center gap-3 sm:gap-4">
                  <Image src="/svg/service-fill.svg" alt="Community" width={32} height={32} className="shrink-0" />
                  <span style={{ color: "#1A1A1A" }}>
                    <strong>Community-building features</strong>
                  </span>
                </li>

                <li data-anim="bullet" className="flex items-center gap-3 sm:gap-4">
                  <Image src="/svg/gemini-fill.svg" alt="Interests" width={32} height={32} className="shrink-0" />
                  <span style={{ color: "#1A1A1A" }}>
                    <strong>Interest-based connections</strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT: image tiles */}
          <div className="relative">
            {/* subtle glow */}
            <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-tr from-pink-200/35 via-lime-100/25 to-indigo-200/35 blur-xl -z-10 dark:from-teal-500/10 dark:via-indigo-500/10 dark:to-pink-500/10" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {featureCards.map((c) => (
                <div
                  key={c.key}
                  data-anim="tile"
                  className={`relative rounded-2xl p-[2px] bg-gradient-to-br ${c.borderFrom} ${c.borderTo} shadow-[0_18px_40px_-18px_rgba(2,6,23,0.25)] transition-transform duration-300 hover:scale-[1.02] floaty ${c.delay}`}
                >
                  <div className="relative overflow-hidden rounded-[20px] bg-white dark:bg-slate-900">
                    <div className="relative aspect-[1/1]">
                      <Image
                        src={c.src}
                        alt={c.title}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width:1024px) 30vw, 260px"
                        className="object-cover"
                      />
                      <div className="absolute inset-x-3 bottom-3 flex justify-center">
                        <span className={`inline-flex items-center rounded-full bg-white/85 backdrop-blur px-3 py-1 text-sm font-semibold ${c.captionColor} shadow-sm ring-1 ring-black/10 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-white/10`}>
                          {c.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Local styles */}
      <style jsx>{`
        @keyframes floaty { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .floaty { animation: floaty 6s ease-in-out infinite; }
        .delay-0 { animation-delay: 0s; }
        .delay-150 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </section>
  );
}
