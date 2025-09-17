// src/components/home/HeroSection.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useLayoutEffect, useRef, useState, useId } from "react";

declare global {
  interface Window {
    gsap?: any;
    SplitText?: any;
  }
}

export default function HeroSection() {
  // Headline text
  const text1 = "Verified College Video Chat";
  const text2 = "Real Students, Real Connections";

  // next-auth
  const { data: authSession, status } = useSession();

  // GSAP loader flags
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [splitLoaded, setSplitLoaded] = useState(false);
  const gsapReady = gsapLoaded && splitLoaded;

  // Background parallax
  const rafId = useRef<number | null>(null);
  const lastY = useRef(0);
  const [parallax, setParallax] = useState({ y: 0, scale: 1, opacity: 1 });

  useEffect(() => {
    const onScroll = () => {
      lastY.current = window.scrollY || 0;
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          const translate = Math.min(lastY.current * 0.25, 120);
          const scale = 1 + Math.min(lastY.current * 0.0004, 0.06);
          const opacity = Math.max(1 - lastY.current / 450, 0);
          setParallax({ y: translate, scale, opacity });
          rafId.current = null;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // unique id for the arc path
  const arcId = useId();

  // SplitText targets
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);

  // Keep instances to revert properly
  const split1Ref = useRef<any>(null);
  const split2Ref = useRef<any>(null);

  useLayoutEffect(() => {
    if (!gsapReady || !window.gsap || !window.SplitText) return;
    const gsap = window.gsap;
    const SplitText = window.SplitText;

    const ctx = gsap.context(() => {
      gsap.set([line1Ref.current, line2Ref.current], { opacity: 1 });

      split1Ref.current = new SplitText(line1Ref.current, { type: "chars" });
      split2Ref.current = new SplitText(line2Ref.current, { type: "chars" });

      const chars = [...split1Ref.current.chars, ...split2Ref.current.chars];
      gsap.set(chars, { opacity: 0, yPercent: 120 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(split1Ref.current.chars, {
        opacity: 1,
        yPercent: 0,
        duration: 0.6,
        stagger: 0.03
      }).to(
        split2Ref.current.chars,
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.6,
          stagger: 0.03
        },
        "+=0.15"
      );
    });

    return () => {
      ctx.revert();
      split1Ref.current?.revert?.();
      split2Ref.current?.revert?.();
    };
  }, [gsapReady]);

  return (
    <section
      className="relative min-h-screen w-full flex flex-col overflow-hidden"
      // Smooth, continuous scaling values + larger top padding
      style={
        {
          // logo scales 96–148px smoothly with viewport
          ["--logo-size" as any]: "clamp(96px, 14vw, 148px)",
          // arc width scales 170–260px
          ["--arc-width" as any]: "clamp(170px, 18vw, 260px)",
          // lift arc to hug logo (percentage of logo size)
          ["--arc-lift" as any]: "calc(var(--logo-size) * -0.22)",
          // gap from arc to headline
          ["--hero-gap" as any]: "clamp(10px, 2.2vw, 28px)",
          // **increased** base hero padding
          ["--hero-pad" as any]: "clamp(40px, 7vw, 96px)",
          // actual top padding = navbar height + hero pad
          paddingTop: "calc(var(--nav-h, 96px) + var(--hero-pad))",
          // helpful if you ever anchor-link to this section
          scrollMarginTop: "var(--nav-h, 96px)"
        } as React.CSSProperties
      }
    >
      {/* GSAP + SplitText via CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"
        strategy="afterInteractive"
        onLoad={() => setGsapLoaded(true)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/SplitText.min.js"
        strategy="afterInteractive"
        onLoad={() => setSplitLoaded(true)}
      />

      {/* Background (base black with image + overlay) */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          transform: `translateY(${parallax.y}px) scale(${parallax.scale})`,
          transformOrigin: "center",
          willChange: "transform"
        }}
      >
        <Image
          src="/purrassist_people.webp"
          alt="College students connecting"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/70" />
      </div>

      {/* Logo + Arc text (both scale via CSS variables) */}
      <div className="relative z-10 w-full animate-fade-in">
        <div className="px-4 lg:px-8">
          <div className="mx-auto max-w-[min(92vw,68rem)] flex flex-col items-center">
            {/* Logo wrapper sized by CSS var so Image can use `fill` */}
            <div
              className="relative drop-shadow-2xl"
              style={{
                width: "var(--logo-size)",
                height: "var(--logo-size)"
              }}
            >
              <Image
                src="/purr_assit_logo.webp"
                alt="PurrAssist Logo"
                fill
                className="object-contain"
                priority
                sizes="var(--logo-size)"
              />
            </div>

            {/* Curved “NO BOTS, NO CREEPS” */}
            <svg
              className="block"
              // width via CSS var, height scales gently
              style={{
                width: "var(--arc-width)",
                height: "clamp(26px, 3.2vw, 34px)",
                marginTop: "var(--arc-lift)"
              }}
              viewBox="0 0 240 60"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                {/* shallow U shape */}
                <path id={arcId} d="M 16 24 Q 120 34 224 24" fill="none" />
              </defs>
              <text
                fontFamily="Inter, ui-sans-serif, system-ui"
                // font scales smoothly
                style={{
                  fontSize: "clamp(11px, 1.3vw, 14px)",
                  letterSpacing: "1.8px",
                  textTransform: "uppercase",
                  fill: "#ffffff"
                }}
              >
                <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                  NO BOTS, NO CREEPS
                </textPath>
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Headline + CTA */}
      <div
        className="relative z-10 flex-1 flex items-start justify-center px-4"
        style={{
          marginTop: "var(--hero-gap)",
          opacity: parallax.opacity,
          transform: `translateY(${Math.min(lastY.current * 0.1, 40)}px)`,
          transition: "opacity 80ms linear, transform 80ms linear",
          willChange: "opacity, transform"
        }}
      >
        <div className="text-center mx-auto max-w-[min(92vw,64rem)]">
          <h1
            className="font-extrabold leading-tight space-y-2 mb-4"
            style={{ fontSize: "clamp(1.25rem, 3.2vw, 2.5rem)" }}
          >
            <span className="block overflow-hidden">
              <span ref={line1Ref} className="inline-block opacity-0 text-white">
                {text1}
              </span>
            </span>
            <span className="block overflow-hidden">
              <span ref={line2Ref} className="inline-block opacity-0 text-teal-300">
                {text2}
              </span>
            </span>
          </h1>

          <div className="flex justify-center">
            {status === "loading" ? (
              <div className="cta-btn select-none" aria-hidden="true" style={{ opacity: 0.7 }}>
                <span className="relative z-10 inline-flex items-center gap-2">
                  Start Video Chat
                </span>
              </div>
            ) : authSession ? (
              <a href="/video" className="cta-btn group">
                <span className="relative z-10 inline-flex items-center gap-2">
                  Start Video Chat
                </span>
              </a>
            ) : (
              <button onClick={() => signIn("google")} className="cta-btn group">
                <span className="relative z-10 inline-flex items-center gap-2">
                  Start Video Chat
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom wave divider — theme aware */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none -mb-px">
        {/* Light mode wave */}
        <svg
          className="block w-full h-[120px] dark:hidden"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,0 C 320,160 1120,-160 1440,0 L1440,120 L0,120 Z" fill="#ffffff" />
        </svg>
        {/* Dark mode wave */}
        <svg
          className="hidden w-full h-[120px] dark:block"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,0 C 320,160 1120,-160 1440,0 L1440,120 L0,120 Z" fill="#050B1A" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }

        @keyframes cta-pulse {
          0%, 100% {
            transform: translateZ(0) scale(1);
            box-shadow: 0 16px 40px -16px rgba(14, 165, 233, 0.65);
          }
          50% {
            transform: translateZ(0) scale(1.03);
            box-shadow: 0 22px 50px -18px rgba(14, 165, 233, 0.75);
          }
        }
        .cta-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2rem;
          border-radius: 1rem;
          color: #fff;
          font-weight: 800;
          font-size: 1.125rem;
          line-height: 1;
          background-image: linear-gradient(to right, #0ea5e9, #0284c7);
          border: 1px solid rgba(255, 255, 255, 0.25);
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
          box-shadow: 0 16px 40px -16px rgba(14, 165, 233, 0.65);
          animation: cta-pulse 2.2s ease-in-out infinite;
          will-change: transform, box-shadow, filter;
          user-select: none;
        }
        .cta-btn::after {
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.35) 40%,
            transparent 70%
          );
          transform: translateX(-140%);
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
          border-radius: inherit;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .cta-btn:hover::after { transform: translateX(140%); }
        .cta-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 28px 64px -20px rgba(14, 165, 233, 0.85);
          filter: saturate(1.1);
        }
        .cta-btn:active {
          transform: translateY(0) scale(0.97);
          box-shadow: 0 14px 32px -18px rgba(14, 165, 233, 0.7);
          filter: saturate(1);
        }
        .cta-btn:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 4px rgba(56, 189, 248, 0.35),
            0 24px 60px -22px rgba(14, 165, 233, 0.8);
        }
      `}</style>
    </section>
  );
}
