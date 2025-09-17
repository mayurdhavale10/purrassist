// src/components/home/WhyWeUseItPremium.tsx
"use client";

import Image from "next/image";
import Script from "next/script";
import { useLayoutEffect, useRef, useState } from "react";

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
  }
}

export default function WhyWeUseItPremium() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // heading refs (for tiny premium animation)
  const labelWrapRef = useRef<HTMLDivElement | null>(null);
  const labelTextRef = useRef<HTMLSpanElement | null>(null);
  const shineRef = useRef<HTMLSpanElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [stLoaded, setStLoaded] = useState(false);
  const ready = gsapLoaded && stLoaded;

  useLayoutEffect(() => {
    if (!ready || !window.gsap || !window.ScrollTrigger) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // ------- HEADINGS ANIMATION (only) -------
    if (labelWrapRef.current && labelTextRef.current && shineRef.current && titleRef.current) {
      // initial states
      gsap.set(labelWrapRef.current, { opacity: 0, y: -10 });
      gsap.set(labelTextRef.current, { letterSpacing: "0.35em" }); // start a bit wider
      gsap.set(shineRef.current, { xPercent: -140, opacity: 0 });
      gsap.set(titleRef.current, { opacity: 0, y: 16 });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        })
        .to(labelWrapRef.current, { opacity: 1, y: 0, duration: 0.35 })
        .to(
          labelTextRef.current,
          { letterSpacing: "0.18em", duration: 0.5 },
          "<"
        )
        .to(
          shineRef.current,
          { xPercent: 140, opacity: 0.9, duration: 0.6, ease: "power2.out" },
          "-=0.25"
        )
        .to(shineRef.current, { opacity: 0, duration: 0.15 }, "<0.45")
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.45 }, "-=0.05");
    }

    // ------- YOUR EXISTING SCROLLER (unchanged) -------
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const section = sectionRef.current!;
      const track = trackRef.current!;

      const build = () => {
        const maxX = Math.max(0, track.scrollWidth - section.clientWidth);
        const tl = gsap.timeline({ ease: "none" }).to(track, { x: -maxX, duration: 1 });

        ScrollTrigger.getAll().forEach((t: any) => {
          if (t.vars?.id === "why-rail") t.kill();
        });

        ScrollTrigger.create({
          id: "why-rail",
          animation: tl,
          trigger: section,
          start: "top top",
          end: `+=${maxX}`, // forward only
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          markers: false,
          onLeave(self: any) {
            self.kill(true);
            gsap.set(track, { clearProps: "transform" });
          },
          onEnterBack(self: any) {
            self.kill(true);
            gsap.set(track, { clearProps: "transform" });
          },
        });
      };

      build();
      setTimeout(() => ScrollTrigger.refresh(), 250);

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        ScrollTrigger.getAll().forEach((t: any) => {
          if (t.vars?.id === "why-rail") t.kill();
        });
      };
    });

    return () => mm.revert();
  }, [ready]);

  const slides = [
    { src: "/howitworks/1-lonely.webp", alt: "Introvert" },
    { src: "/howitworks/2-dreaming.webp", alt: "no connections" },
    { src: "/howitworks/3-action.webp", alt: "Take action, go live" },
    { src: "/howitworks/4-commnuity.webp", alt: "Find your community" },
    { src: "/howitworks/5-feature.webp", alt: "Features that keep it real" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden overscroll-y-contain"
      style={{ backgroundColor: "#F5F5DC" }}
    >
      {/* GSAP via CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"
        strategy="afterInteractive"
        integrity="sha512-NcZdtrT77bJr4STcmsGAESr06BYGE8woZdSdEgqnpyqac7sugNO+Tr4bGwGF3MsnEkGKhU2KL2xh6Ec+BqsaHA=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onLoad={() => setGsapLoaded(true)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"
        strategy="afterInteractive"
        integrity="sha512-P2IDYZfqSwjcSjX0BKeNhwRUH8zRPGlgcWl5n6gBLzdi4Y5/0O4zaXrtO4K9TZK6Hn1BenYpKowuCavNandERg=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onLoad={() => setStLoaded(true)}
      />

      {/* Heading (sizes bumped slightly) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24">
        <div
          ref={labelWrapRef}
          className="inline-flex items-center relative rounded-full px-4 py-1.5 mb-2"
        >
          <span className="relative inline-block">
            <span
              ref={labelTextRef}
              className="font-black uppercase text-red-600 tracking-[0.18em]"
              // bump size a bit vs before
              style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.05rem)" }}
            >
              WHY WE USE IT
            </span>
            {/* subtle shine sweep */}
            <span
              ref={shineRef}
              className="absolute -inset-y-[28%] -left-[15%] w-[34%] bg-gradient-to-r from-transparent via-white/70 to-transparent blur-md pointer-events-none"
              aria-hidden
            />
          </span>
        </div>

        <h2
          ref={titleRef}
          className="font-black tracking-tight text-black"
          // slightly larger than before; still tasteful
          style={{ fontSize: "clamp(2.25rem, 5.2vw, 3.6rem)", lineHeight: 1.06 }}
        >
          Speed. Safety. Real People.
        </h2>
      </div>

      {/* Horizontal rail (desktop pinned; mobile free scroll) */}
      <div className="relative mt-10 md:mt-14">
        <div
          ref={trackRef}
          className="flex gap-6 md:gap-8 px-4 sm:px-6 lg:px-8 will-change-transform overflow-x-auto lg:overflow-x-visible scrollbar-none"
          style={{ transform: "translateX(0px)" }}
        >
          {slides.map((s, i) => (
            <figure
              key={i}
              className="
                relative overflow-hidden rounded-[24px]
                bg-white ring-1 ring-black/10 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]
                min-w-[82vw] sm:min-w-[70vw] lg:min-w-[62vw] xl:min-w-[880px]
                aspect-[16/10] flex-shrink-0
              "
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                className="object-contain bg-[#F5F5DC]"
                sizes="(max-width: 640px) 82vw, (max-width: 1024px) 70vw, (max-width: 1536px) 62vw, 880px"
                priority={false}
              />
              <figcaption className="absolute bottom-3 left-3 right-3">
                <span className="inline-flex items-center rounded-full bg-black/65 text-white px-3 py-1 text-[12px] font-semibold tracking-wide">
                  {s.alt}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#F5F5DC] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#F5F5DC] to-transparent" />
    </section>
  );
}
