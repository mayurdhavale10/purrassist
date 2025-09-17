"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ======================== Types & Data ======================== */
type Plan = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string | null;
  period?: string;
  popular?: boolean;
  urgent?: boolean;
  features: string[];
  limitations: string[];
  bottomText?: string | null;
  buttonText: string;
  buttonColor: string; // tailwind or solid
  borderColor: string; // tailwind
  bgColor: string;     // tailwind or solid
  glow: string;        // tailwind shadow
  logo: string;
  badge?: string | null;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Basic Plan – Free",
    price: "₹0",
    originalPrice: null,
    period: "Forever",
    popular: false,
    urgent: false,
    features: [
      "**Same-College Video Chat** – Connect only with students from your college.",
      "**Verified Profiles** – Real students, no fake accounts.",
      "**Safe & Secure** – Privacy-first platform.",
      "**Basic Matching** – Get suggested profiles daily.",
      "**24/7 Support** – Help whenever you need it.",
    ],
    limitations: [
      "**No Cross-College Chat** – Only your campus network.",
      "**No Gender Filters** – Matches are random.",
      "**Limited Daily Swipes** – Take it slow!",
    ],
    bottomText: "🎓 Campus-focused. Simple. Safe.",
    buttonText: "Start Free",
    buttonColor: "from-emerald-500 to-emerald-600",
    borderColor: "border-teal-400",
    bgColor: "from-white via-gray-50 to-white",
    glow: "shadow-[0_0_25px_rgba(56,189,248,0.5)]",
    logo: "/purr_assit_logo.webp",
    badge: null,
  },
  {
    id: "basic",
    name: "All-Colleges Plan",
    price: "₹99",
    originalPrice: "₹69",
    period: "monthly",
    popular: true,
    urgent: false,
    features: [
      "Same + Inter-College Chat – Video chat across campuses.",
      "Any Verified College – Connect with ANY institute in India.",
      "Unlimited Swipes – Explore freely.",
      "Smart Matching – AI finds your ideal connections.",
      "Priority Support – Faster help when needed.",
      "Profile Booster – 2x visibility for 24 hours.",
      "🌐 Expand beyond your campus, meet the nation.",
    ],
    limitations: ["No Gender Filters – Random verified matches"],
    bottomText: null,
    buttonText: "Get Basic Access",
    buttonColor: "bg-black text-[#FFD300] hover:bg-gray-900",
    borderColor: "border-[#FFD300]",
    bgColor: "bg-[#FFD300] text-black",
    glow: "shadow-[0_0_25px_#FFD300]",
    logo: "/purr_assit_logo.webp",
    badge: "Most Popular",
  },
  {
    id: "premium",
    name: "Premium Ultimate",
    price: "₹169",
    originalPrice: "₹369",
    period: "monthly",
    popular: false,
    urgent: true,
    features: [
      "**Everything in Basic + More!**",
      "**Talk to Who You Want** – Choose your preferred gender.",
      "**Advanced Filters** – Refine matches by interests, location & more.",
      "**VIP Profile Boost** – Get 3x more visibility & likes.",
      "**Exclusive Features** – Unlock hidden perks for better chats.",
      "**Priority Matching** – Skip waiting, meet people faster!",
    ],
    limitations: [],
    bottomText: "✨ Your rules, your connections—pick who you vibe with!",
    buttonText: "Go Premium",
    buttonColor: "bg-black text-[#FF0000] hover:bg-gray-900",
    borderColor: "border-[#FF0000]",
    bgColor: "bg-[#FF0000] text-black",
    glow: "shadow-[0_0_25px_#FF0000]",
    logo: "/purr_assit_logo.webp",
    badge: "🔥 Best Value",
  },
];

/* ======================== Component ======================== */
export default function PricingCards() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  // 3D ring state
  const ringRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [hovering, setHovering] = useState(false);

  // responsive geometry
  const [radius, setRadius] = useState(300);
  const [cardW, setCardW] = useState(300);
  const [cardH, setCardH] = useState(460);
  const [autoSpeed, setAutoSpeed] = useState(0.16); // deg/frame

  // responsive sizing
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 420) {
        setRadius(190);
        setCardW(250);
        setCardH(420);
        setAutoSpeed(0.22);
      } else if (w < 640) {
        setRadius(220);
        setCardW(270);
        setCardH(430);
        setAutoSpeed(0.2);
      } else if (w < 1024) {
        setRadius(260);
        setCardW(290);
        setCardH(450);
        setAutoSpeed(0.18);
      } else {
        setRadius(300);
        setCardW(300);
        setCardH(460);
        setAutoSpeed(0.16);
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // auto loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setAngle((a) => (a + (hovering ? 0 : autoSpeed)) % 360);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoSpeed, hovering]);

  // drag/swipe (with inertia)
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let dragging = false;
    let lastX = 0;
    let vel = 0;
    let raf = 0;

    const inertial = () => {
      if (Math.abs(vel) < 0.01) return;
      setAngle((a) => (a + vel) % 360);
      vel *= 0.95;
      raf = requestAnimationFrame(inertial);
    };

    const onDown = (x: number) => {
      dragging = true;
      lastX = x;
      setHovering(true);
      cancelAnimationFrame(raf);
    };
    const onMove = (x: number) => {
      if (!dragging) return;
      const dx = x - lastX;
      lastX = x;
      const delta = dx * 0.35;
      setAngle((a) => (a + delta) % 360);
      vel = delta;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      setHovering(false);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(inertial);
    };

    // mouse
    const mDown = (e: MouseEvent) => onDown(e.clientX);
    const mMove = (e: MouseEvent) => onMove(e.clientX);
    const mUp = () => onUp();

    // touch
    const tStart = (e: TouchEvent) => onDown(e.touches[0].clientX);
    const tMove = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const tEnd = () => onUp();

    root.addEventListener("mousedown", mDown);
    window.addEventListener("mousemove", mMove);
    window.addEventListener("mouseup", mUp);

    root.addEventListener("touchstart", tStart, { passive: true });
    window.addEventListener("touchmove", tMove, { passive: true });
    window.addEventListener("touchend", tEnd);

    return () => {
      root.removeEventListener("mousedown", mDown);
      window.removeEventListener("mousemove", mMove);
      window.removeEventListener("mouseup", mUp);
      root.removeEventListener("touchstart", tStart);
      window.removeEventListener("touchmove", tMove);
      window.removeEventListener("touchend", tEnd);
      cancelAnimationFrame(raf);
    };
  }, []);

  const per = 360 / PLANS.length;
  const openPlan = (id: string) => setOpenId(id);
  const closePlan = () => setOpenId(null);

  const handlePlanSelect = (id: string) => {
    router.push(`/checkout?plan=${encodeURIComponent(id)}`);
  };

  return (
    <section className="relative w-full overflow-visible bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-black to-zinc-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-3 text-white">
            In today’s world,{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              real connections matter
            </span>
            .
          </h2>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            Click a card to open details. Drag or just watch it rotate.
          </p>
        </div>

        {/* 3D ring viewport */}
        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{
            width: "min(1100px, 96vw)",
            height: "clamp(520px, 64vw, 640px)", // headroom so nothing crops
            perspective: "1200px",
            overflow: "visible",
            touchAction: "pan-y",
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div
            ref={ringRef}
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateZ(-${radius}px) rotateY(${angle}deg)`,
              transition: "transform 0.05s linear",
              overflow: "visible",
            }}
          >
            {PLANS.map((plan, i) => {
              const rot = per * i;
              const isNeon = plan.id === "basic";
              const isPremium = plan.id === "premium";
              return (
                <div
                  key={plan.id}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: cardW,
                    height: cardH,
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${rot}deg) translateZ(${radius}px) translateX(-50%) translateY(-50%)`,
                    cursor: "pointer",
                  }}
                  onClick={() => openPlan(plan.id)}
                >
                  <div
                    className={[
                      "h-full w-full rounded-2xl p-6 md:p-8 transition-all duration-300",
                      "hover:scale-[1.03] hover:-translate-y-1",
                      isNeon
                        ? "bg-[#FFD300] text-black shadow-[0_0_25px_#FFD300]"
                        : isPremium
                        ? "bg-[#FF0000] text-black shadow-[0_0_25px_#FF0000] border border-[#FF0000]"
                        : `bg-gradient-to-br ${plan.bgColor} border ${plan.borderColor} ${plan.glow}`,
                    ].join(" ")}
                    style={{
                      boxShadow:
                        "0 24px 60px -24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* badge */}
                    {plan.badge && (
                      <div className="mx-auto -mt-3 mb-4 w-fit px-3 py-1 rounded-full text-xs font-semibold text-white shadow bg-gradient-to-r from-yellow-400 to-blue-500">
                        {plan.badge}
                      </div>
                    )}

                    {/* title */}
                    <div className="text-center mb-5">
                      <img src={plan.logo} alt="" className="w-12 h-12 mx-auto mb-3" />
                      <h3 className={`text-xl font-bold ${isNeon || isPremium ? "text-black" : "text-gray-900"}`}>
                        {plan.name}
                      </h3>
                    </div>

                    {/* price */}
                    <div className="text-center mb-5">
                      {plan.originalPrice && plan.originalPrice !== plan.price && (
                        <div className="text-sm text-gray-600 line-through mb-1">
                          {plan.originalPrice}
                        </div>
                      )}
                      <div className={`text-3xl font-extrabold ${isNeon || isPremium ? "text-black" : "text-gray-900"}`}>
                        {plan.price}
                        {!plan.price.includes("FREE") && plan.price !== "₹0" && (
                          <span className="text-xs font-medium text-gray-700 ml-1">
                            {plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* short bullets */}
                    <div className="space-y-2">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <img
                            src="/pricing/check-mark-svgrepo-com.svg"
                            alt=""
                            className={`w-4 h-4 mt-1 ${isNeon || isPremium ? "filter invert" : ""}`}
                          />
                          <div
                            className={`text-[13px] leading-relaxed ${isNeon || isPremium ? "text-black" : "text-gray-700"}`}
                            dangerouslySetInnerHTML={{
                              __html: feature.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-xs opacity-70">
                      Click to see details
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* small-screen fallback grid (optional) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:hidden">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={[
                "rounded-2xl p-6",
                plan.id === "basic"
                  ? "bg-[#FFD300] text-black shadow-[0_0_25px_#FFD300]"
                  : plan.id === "premium"
                  ? "bg-[#FF0000] text-black shadow-[0_0_25px_#FF0000] border border-[#FF0000]"
                  : `bg-gradient-to-br ${plan.bgColor} border ${plan.borderColor} ${plan.glow}`,
              ].join(" ")}
            >
              <div className="text-center mb-4">
                <img src={plan.logo} alt="" className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <button
                onClick={() => setOpenId(plan.id)}
                className="w-full rounded-xl py-3 font-semibold bg-black text-white"
              >
                View details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* overlay (cursor auto via data-cursor="ignore") */}
      {openId && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-auto"
          data-cursor="ignore"
        >
          <div
            className="relative w-[min(760px,94vw)] max-h-[90vh] overflow-auto rounded-2xl bg-white text-black shadow-2xl cursor-auto"
            data-cursor="ignore"
          >
            <button
              aria-label="Close"
              onClick={() => setOpenId(null)}
              className="absolute right-3 top-3 h-9 w-9 rounded-full grid place-items-center bg-black text-white"
              style={{ cursor: "pointer" }}
            >
              ×
            </button>

            <PlanDetails
              plan={PLANS.find((p) => p.id === openId)!}
              onChoose={(id) => handlePlanSelect(id)}
              onMaybe={() => setOpenId(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ======================== Details Overlay ======================== */
function PlanDetails({
  plan,
  onChoose,
  onMaybe,
}: {
  plan: Plan;
  onChoose: (id: string) => void;
  onMaybe: () => void;
}) {
  const isNeon = plan.id === "basic";
  const chip = (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: isNeon ? "#22c55e" : "#10b981" }}
    />
  );

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider opacity-60">
            PLAN
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black">
            {plan.name}
          </h3>
          {plan.bottomText && <p className="mt-1 text-slate-600">{plan.bottomText}</p>}
        </div>
        <div className="text-right whitespace-nowrap">
          <div className="text-xs opacity-60">from</div>
          <div className="text-3xl sm:text-4xl font-extrabold">{plan.price}</div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {plan.features.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
          >
            {chip}
            <span
              className="text-slate-800"
              dangerouslySetInnerHTML={{
                __html: f.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </div>
        ))}
        {plan.id === "free" &&
          plan.limitations.map((lim, i) => (
            <div
              key={`lim-${i}`}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-red-200"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              <span
                className="text-slate-800"
                dangerouslySetInnerHTML={{
                  __html: lim.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </div>
          ))}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => onChoose(plan.id)}
          className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold text-white ${
            plan.id === "basic" || plan.id === "premium"
              ? plan.buttonColor
              : `bg-gradient-to-r ${plan.buttonColor}`
          }`}
          style={{ cursor: "pointer" }}
        >
          {plan.id === "basic" ? "Get Basic Access" : "Choose Plan"}
        </button>
        <button
          onClick={onMaybe}
          className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50"
          style={{ cursor: "pointer" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
