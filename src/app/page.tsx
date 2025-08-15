"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { use, useEffect, useRef, useState } from "react";
import GenderModal from "@/components/GenderModal";

export default function Home() {
  const session = useSession();
  const [showContent, setShowContent] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Simplified logic for showing content and modal
  useEffect(() => {
    console.log("Session status:", session.status);
    console.log("Session data:", session.data);
    console.log("User gender:", session.data?.user?.gender);
    
    if (session.status === 'loading') {
      // Still loading, don't change anything yet
      return;
    } else if (session.status === 'unauthenticated') {
      // Not logged in - show content, hide modal
      setShowContent(true);
      setShowGenderModal(false);
    } else if (session.status === 'authenticated') {
      const hasGender = session.data?.user?.gender;
      
      if (hasGender) {
        // User has gender - show content, hide modal
        setShowContent(true);
        setShowGenderModal(false);
      } else {
        // User doesn't have gender - show content but also show modal
        setShowContent(true); // Keep content visible
        setShowGenderModal(true);
      }
    }
  }, [session.status, session.data?.user?.gender]);

  // --- Audio setup ---
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 1.0;
    a.muted = true;
    a.play().catch(() => {});
  }, []);

  const toggleMute = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isMuted) {
      a.muted = false;
      a.volume = 1.0;
      try {
        await a.play();
      } catch {}
    } else {
      a.muted = true;
    }
    setIsMuted(!isMuted);
  };

  // --- Scroll reveal ---
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(
      ".reveal-on-scroll, .scroll-animate"
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Background audio */}
      <audio
        ref={audioRef}
        src="/purr_audio.mp3"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Gender Modal */}
      {showGenderModal && (
        <GenderModal
          onSuccess={() => {
            setShowGenderModal(false);
          }}
        />
      )}

      {/* Main content wrapper - blur only when modal is showing */}
      <div className={showGenderModal ? "blur-sm" : ""}>
        {/* Unmute/Mute control */}
        <button
          onClick={toggleMute}
          className="fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 shadow-lg border bg-white/80 backdrop-blur hover:bg-white transition text-sm font-medium"
          title={isMuted ? "Unmute background audio" : "Mute background audio"}
        >
          {isMuted ? "🔊 Unmute" : "🔇 Mute"}
        </button>

        <Navbar>
          {session.status === 'loading' ? (
            <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-2">
              Loading...
            </div>
          ) : !session.data ? (
            <button
              onClick={() => signIn("google")}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition"
            >
              Login with Google
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Image
                src={session.data?.user?.image || "/default-avatar.png"}
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-medium">{session.data?.user?.name}</span>
            </div>
          )}
        </Navbar>

        {/* Main content - Always show unless explicitly hidden */}
        {showContent && (
          <main className="min-h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-start relative overflow-hidden pt-10 md:pt-12">
            {/* Soft multi-color aura behind the logo */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-20">
              <div className="h-[30rem] w-[30rem] rounded-full blur-3xl opacity-40 bg-teal-300 absolute" />
              <div className="h-[26rem] w-[26rem] rounded-full blur-3xl opacity-40 bg-pink-300 absolute animate-pulse" />
              <div className="h-[22rem] w-[22rem] rounded-full blur-3xl opacity-40 bg-yellow-200 absolute" />
              <div className="h-[18rem] w-[18rem] rounded-full blur-3xl opacity-40 bg-blue-300 absolute" />
            </div>

            {/* Top content (logo + text + CTAs) */}
            <div className="relative z-10 flex flex-col items-center">
              <Image
                src="/purr_assit_logo.webp"
                alt="PurrAssist Logo"
                width={512}
                height={512}
                priority
                className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-xl animate-fade-in-up"
              />

              <h1 className="mt-6 text-center text-2xl md:text-3xl font-extrabold tracking-tight animate-fade-in-up animation-delay-200">
                <span className="text-teal-600">
                  Verified College Video Chat
                </span>
                <span className="text-slate-900">
                  {" "}
                  – Real Students, Real Connections
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-center text-slate-700 animate-fade-in-up animation-delay-400">
                Meet classmates from your campus or explore verified students
                across the globe.
                <span className="text-blue-700 font-medium">
                  {" "}
                  No bots, no creeps
                </span>{" "}
                — just authentic conversations.
              </p>

              {/* Marquee */}
              <div className="mt-5 w-[92vw] max-w-3xl overflow-hidden animate-fade-in-up animation-delay-600">
                <div className="relative h-10 md:h-12 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                  <div className="marquee whitespace-nowrap">
                    <span className="mx-6 font-semibold">
                      Connect • Vibe • Enjoy • Connect • Vibe • Enjoy • Connect
                      • Vibe • Enjoy
                    </span>
                    <span className="mx-6 font-semibold">
                      Connect • Vibe • Enjoy • Connect • Vibe • Enjoy • Connect
                      • Vibe • Enjoy
                    </span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-6 flex items-center gap-4 animate-fade-in-up animation-delay-800">
                {session.data ? (
                  <a
                    href="/video"
                    className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 hover:opacity-90"
                  >
                    Start Video Chatting
                  </a>
                ) : (
                  <button
                    onClick={() => signIn("google")}
                    className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 hover:opacity-90"
                  >
                    Start Video Chatting
                  </button>
                )}
                <a
                  href="#how-it-works"
                  className="px-6 py-3 rounded-xl font-semibold border border-teal-500 text-teal-700 hover:bg-teal-50 transition"
                >
                  How It Works
                </a>
              </div>
            </div>

            {/* Cat animation */}
            <section className="relative z-10 w-full flex justify-center mt-10 md:mt-14 lg:mt-16 scroll-animate slide-up">
              <video
                src="/purr_cat_dancing.mp4"
                className="w-[240px] sm:w-[300px] md:w-[420px] lg:w-[520px] xl:w-[640px] drop-shadow-2xl rounded-xl"
                autoPlay
                loop
                muted
                playsInline
                aria-label="Cat dancing animation"
              />
            </section>

            {/* STORIES (below cat) */}
            <section className="relative z-10 w-full max-w-6xl mx-auto mt-12 px-4 scroll-animate fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <article
                  className="reveal-on-scroll card-base border-t-4 border-teal-400 bg-teal-50"
                  data-card="teal"
                >
                  <div className="card-accent teal"></div>
                  <header className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🤝</span>
                    <h3 className="font-semibold text-lg text-teal-700">
                      New Connection
                    </h3>
                  </header>
                  <p className="text-slate-700">
                    Soham from <strong>Shah Anchor</strong> just connected with{" "}
                    <strong>Tanvi</strong> from <strong>VIT Wadala</strong>.
                  </p>
                </article>

                <article
                  className="reveal-on-scroll card-base border-t-4 border-pink-400 bg-pink-50"
                  data-card="pink"
                >
                  <div className="card-accent pink"></div>
                  <header className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🌏</span>
                    <h3 className="font-semibold text-lg text-pink-700">
                      Cultural Exchange
                    </h3>
                  </header>
                  <p className="text-slate-700">
                    Viraj from <strong>KJ Somaiya</strong> and{" "}
                    <strong>Babita</strong> from{" "}
                    <strong>Suvidya Institute</strong> discussing cultural
                    exchange.
                  </p>
                </article>

                <article
                  className="reveal-on-scroll card-base border-t-4 border-yellow-400 bg-yellow-50"
                  data-card="yellow"
                >
                  <div className="card-accent yellow"></div>
                  <header className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🏋️‍♂️</span>
                    <h3 className="font-semibold text-lg text-yellow-700">
                      Gym Session
                    </h3>
                  </header>
                  <p className="text-slate-700">
                    Kartik from <strong>VIT Wadala</strong> and{" "}
                    <strong>Smith</strong> joined a gym session.
                  </p>
                </article>
              </div>
            </section>

            {/* ===== FEATURES CHAT (WhatsApp-like layout) ===== */}
            <section className="relative z-10 w-full max-w-3xl mx-auto mt-12 px-4 scroll-animate slide-left">
              <div className="rounded-3xl border bg-gradient-to-b from-emerald-50 via-slate-50 to-blue-50 shadow-md p-4 md:p-6">
                {/* Message 1: Received (left) */}
                <div className="mb-5 flex items-end gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-300/70 flex items-center justify-center text-white text-sm font-semibold">
                    A
                  </div>
                  <div className="chat-bubble bubble-left">
                    <div className="text-xs text-slate-500 mb-1">
                      Feature 1 • College → College
                    </div>
                    <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                      <video
                        src="/feature1_cat.mp4"
                        className="w-[240px] sm:w-[280px] md:w-[320px]"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label="Feature 1 demo"
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      Connect and communicate exclusively with peers from your
                      own college.
                    </p>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Seen • 7:42 PM
                    </div>
                  </div>
                </div>

                {/* Message 2: Sent (right) */}
                <div className="mb-5 flex items-end gap-3 justify-end">
                  <div className="chat-bubble bubble-right">
                    <div className="text-xs text-slate-600 mb-1">
                      Feature 2 • Inter-College
                    </div>
                    <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                      <video
                        src="/feature2_cat.mp4"
                        className="w-[240px] sm:w-[280px] md:w-[320px]"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label="Feature 2 demo"
                      />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      Connect with verified students from other
                      colleges—network, chat, and have fun!
                    </p>
                    <div className="mt-1 text-[11px] text-slate-600">
                      Delivered • 7:44 PM
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-400/80 flex items-center justify-center text-white text-sm font-semibold">
                    U
                  </div>
                </div>

                {/* Message 3: Received (left) - NEW */}
                <div className="mb-2 flex items-end gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-300/70 flex items-center justify-center text-white text-sm font-semibold">
                    A
                  </div>
                  <div className="chat-bubble bubble-left">
                    <div className="text-xs text-slate-500 mb-1">
                      Feature 3 • Global Connect
                    </div>
                    <div className="rounded-xl overflow-hidden ring-1 ring-black/5">
                      <video
                        src="/feature3_cat.mp4"
                        className="w-[240px] sm:w-[280px] md:w-[320px]"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-label="Feature 3 demo"
                      />
                    </div>
                    <div className="mt-2 text-sm text-slate-700 space-y-1">
                      <p>
                        <strong>Feeling social?</strong>{" "}
                        <strong>&apos;Badmosi karni hai?&apos;</strong> Switch
                        to <em>Boys Mode</em> and squad up!
                      </p>
                      <p>
                        <strong>Want women-only conversations?</strong>{" "}
                        <strong>&apos;Mahila mitra banani hai?&apos;</strong>{" "}
                        Select <em>&apos;Girls Mode&apos;</em> for a comfortable
                        space.
                      </p>
                      <p className="text-xs italic text-slate-600">
                        Sab verified, sab safe – &apos;apni marzi ka vibe
                        chuno!&apos;
                      </p>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Seen • 7:46 PM
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CONNECTIONS SECTION - NEW */}
            <section className="relative z-10 w-full max-w-4xl mx-auto mt-16 px-4 scroll-animate slide-up">
              <div className="text-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 md:p-10 border border-purple-100 shadow-lg">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Connections are just the beginning.
                </h2>

                <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-6">
                  We handpick the best cafés, study nooks, and hidden gems near
                  your campus—so you can move from chat to chill without missing
                  a beat.
                </p>

                <div className="text-left max-w-2xl mx-auto mb-6">
                  <p className="text-lg font-medium text-slate-800 mb-4">
                    ✨ Soon you&apos;ll discover:
                  </p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-500 font-bold">•</span>
                      Exclusive student discounts at cafés, go-karting, and
                      shopping spots
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-500 font-bold">•</span>
                      Curated, vibe-checked spaces (quiet libraries, lively food
                      joints, 24/7 study hubs)
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-500 font-bold">•</span>
                      Group deals when you bring your new squad
                    </li>
                  </ul>
                </div>

                <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-6 py-3 border">
                  <span className="text-2xl">🔒</span>
                  <span className="text-slate-700">
                    This feature is <strong>&apos;coming soon&apos;</strong>
                    —enter your campus to get early access.
                  </span>
                </div>
              </div>
            </section>
          </main>
        )}

        <Footer />
      </div>

      {/* Local CSS for marquee, cards, chat bubbles, reduced motion */}
      <style jsx>{`
        .marquee {
          position: absolute;
          top: 0;
          left: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          animation: marquee 18s linear infinite;
          will-change: transform;
          font-size: 0.95rem;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Card base styles + hover animation */
        .card-base {
          position: relative;
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 0 4px 16px rgba(2, 6, 23, 0.06);
          transition: transform 220ms ease, box-shadow 220ms ease,
            background-color 220ms ease;
          overflow: hidden;
        }
        .card-base:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12);
        }

        /* Hero animations */
        .animate-fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Animated accent blob inside each card */
        .card-accent {
          position: absolute;
          inset: auto -40% -40% auto;
          width: 200px;
          height: 200px;
          border-radius: 9999px;
          filter: blur(28px);
          opacity: 0.25;
          animation: floaty 6s ease-in-out infinite;
          pointer-events: none;
        }
        .card-accent.teal {
          background: #5eead4;
        } /* teal-300 */
        .card-accent.pink {
          background: #f9a8d4;
        } /* pink-300 */
        .card-accent.yellow {
          background: #fde68a;
        } /* yellow-300 */

        @keyframes floaty {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-12px, -10px) scale(1.05);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        /* Scroll animations */
        .scroll-animate {
          opacity: 0;
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .scroll-animate.in-view {
          opacity: 1;
        }

        /* Animation variants */
        .slide-up {
          transform: translateY(40px);
        }
        .slide-up.in-view {
          transform: translateY(0);
        }

        .slide-left {
          transform: translateX(-40px);
        }
        .slide-left.in-view {
          transform: translateX(0);
        }

        .slide-right {
          transform: translateX(40px);
        }
        .slide-right.in-view {
          transform: translateX(0);
        }

        .fade-in {
          transform: scale(0.95);
        }
        .fade-in.in-view {
          transform: scale(1);
        }

        /* Staggered animations for cards */
        .reveal-on-scroll:nth-child(1) {
          transition-delay: 0ms;
        }
        .reveal-on-scroll:nth-child(2) {
          transition-delay: 150ms;
        }
        .reveal-on-scroll:nth-child(3) {
          transition-delay: 300ms;
        }

        /* Chat bubbles (WhatsApp-like) */
        .chat-bubble {
          max-width: min(92vw, 22rem);
          border-radius: 1rem;
          padding: 0.5rem;
          box-shadow: 0 1px 2px rgba(2, 6, 23, 0.08);
          position: relative;
        }
        .bubble-left {
          background: #ffffff; /* receiver bubble */
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .bubble-right {
          background: #dcf8c6; /* classic WhatsApp green */
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        /* subtle tails */
        .bubble-left::after {
          content: "";
          position: absolute;
          left: -6px;
          bottom: 10px;
          border-width: 6px 6px 6px 0;
          border-style: solid;
          border-color: transparent #ffffff transparent transparent;
          filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.06));
        }
        .bubble-right::after {
          content: "";
          position: absolute;
          right: -6px;
          bottom: 10px;
          border-width: 6px 0 6px 6px;
          border-style: solid;
          border-color: transparent transparent transparent #dcf8c6;
          filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.06));
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee {
            animation: none !important;
            white-space: normal;
            position: static;
          }
          .card-base,
          .reveal-on-scroll,
          .animate-fade-in-up,
          .scroll-animate {
            transition: none !important;
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .card-accent {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}