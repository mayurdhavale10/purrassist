"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

import Footer from "@/components/Footer";

import PricingCards from "@/components/PricingCards";
import { useEffect, useRef, useState } from "react";
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

  // Function to scroll to pricing section
  const scrollToPricing = () => {
    const pricingSection = document.querySelector('#pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Offer Ticker at the very top */}
    

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



        {/* Freedom Sale Tricolor Offer Marquee - Updated */}
        <div className="relative w-full h-18 overflow-hidden cursor-pointer" onClick={scrollToPricing}>
          {/* Animated tricolor background with blur effect */}
          <div className="absolute inset-0 flex flex-col backdrop-blur-md">
            <div className="flex-1 bg-gradient-to-r from-orange-400/80 via-orange-500/70 to-orange-600/80"></div>
            <div className="flex-1 bg-gradient-to-r from-white/90 via-gray-100/80 to-white/90"></div>
            <div className="flex-1 bg-gradient-to-r from-green-500/80 via-green-600/70 to-green-700/80"></div>
          </div>

          {/* Glass overlay for glassmorphism effect */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm border-t border-white/20 shadow-lg"></div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="floating-particle particle-1"></div>
            <div className="floating-particle particle-2"></div>
            <div className="floating-particle particle-3"></div>
            <div className="floating-particle particle-4"></div>
          </div>

          {/* Chakra (wheel) in the center with glass effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border-2 border-blue-800/70 bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <div className="text-blue-900 text-xl font-bold drop-shadow-sm">⚡</div>
            </div>
          </div>

          {/* Updated Marquee content overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="tricolor-marquee whitespace-nowrap flex items-center">
              <span className="marquee-item">
                🇮🇳 <strong>FREEDOM SALE ENDS SOON:</strong> FREE Basic Access + Premium VIP at ₹169 only! 
              </span>
              <span className="marquee-item">
                🎯 <strong>Today Only:</strong> Lock in Premium features forever at 90% OFF! 
              </span>
              <span className="marquee-item">
                ⚡ <strong>Exclusive:</strong> Boys Mode • Girls Mode • Multi-campus • All at Freedom Sale prices! 
              </span>
              <span className="marquee-item">
                🔥 <strong>Hurry:</strong> Sale ends at midnight - Basic ₹69, Premium ₹169. Get VIP access now! 
              </span>
              <span className="marquee-item">
                🇮🇳 <strong>Jai Hind:</strong> Connect with verified students across India - your campus awaits! 
              </span>
              
              {/* Duplicate for seamless loop */}
              <span className="marquee-item">
                🇮🇳 <strong>FREEDOM SALE ENDS SOON:</strong> FREE Basic Access + Premium VIP at ₹169 only! 
              </span>
              <span className="marquee-item">
                🎯 <strong>Today Only:</strong> Lock in Premium features forever at 90% OFF! 
              </span>
              <span className="marquee-item">
                ⚡ <strong>Exclusive:</strong> Boys Mode • Girls Mode • Multi-campus • All at Freedom Sale prices! 
              </span>
              <span className="marquee-item">
                🔥 <strong>Hurry:</strong> Sale ends at midnight - Basic ₹69, Premium ₹169. Get VIP access now! 
              </span>
              <span className="marquee-item">
                🇮🇳 <strong>Jai Hind:</strong> Connect with verified students across India - your campus awaits! 
              </span>
            </div>
          </div>

          {/* Enhanced gradient edges with glass effect */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white/40 via-white/20 to-transparent backdrop-blur-sm pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white/40 via-white/20 to-transparent backdrop-blur-sm pointer-events-none"></div>
        </div>

        {/* Main content - Always show unless explicitly hidden */}
        {showContent && (
          <main className="min-h-[calc(100vh-5rem)] w-full flex flex-col items-center justify-start relative overflow-hidden pt-24 md:pt-28">
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

              {/* Centered CTA Button */}
              <div className="mt-6 flex justify-center animate-fade-in-up animation-delay-800">
                {session.data ? (
                  <a
                    href="/video"
                    className="px-8 py-4 rounded-xl text-white font-semibold shadow-lg transition bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 hover:opacity-90 text-lg"
                  >
                    Start Video Chatting
                  </a>
                ) : (
                  <button
                    onClick={() => signIn("google")}
                    className="px-8 py-4 rounded-xl text-white font-semibold shadow-lg transition bg-gradient-to-r from-pink-500 via-yellow-400 to-blue-500 hover:opacity-90 text-lg"
                  >
                    Start Video Chatting
                  </button>
                )}
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
                    <span className="text-2xl">🏋‍♂</span>
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

            {/* ===== PRICING CARDS - Added right after features chat ===== */}
            <div id="pricing-section">
              <PricingCards />
            </div>

            {/* Real Connection Stories with Images - NEW SECTION */}
            <section className="relative z-10 w-full max-w-6xl mx-auto mt-16 px-4 scroll-animate slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Bike Story */}
                <article className="reveal-on-scroll connection-story-card">
                  <div className="relative rounded-2xl overflow-hidden mb-4 shadow-lg">
                    <Image
                      src="/bike.webp"
                      alt="Bike riding sessio"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🏍️ BIKE CREW
                      </span>
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl shadow-lg border border-orange-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">The Great Bike Debate</h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-slate-700 italic mb-4">
                        Soham and Sahil connected for a ride... but now they&apos;re arguing over which 350cc bike is better!
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        <p><strong>Soham:</strong> <em>&quot;The Classic 350&apos;s thump is unbeatable—pure heritage!&quot;</em></p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        <p><strong>Sahil:</strong> <em>&quot;The CB350 is smoother and more refined—modern wins!&quot;</em></p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                        <p><strong>Pratap:</strong> <em>&quot;You&apos;re both wrong—the Splendor is the true king of Indian roads!&quot;</em></p>
                      </div>
                      <p className="text-center font-semibold text-orange-600 mt-4">
                        Whose side are you on?
                      </p>
                    </div>
                  </div>
                </article>

                {/* Go-Karting Story */}
                <article className="reveal-on-scroll connection-story-card">
                  <div className="relative rounded-2xl overflow-hidden mb-4 shadow-lg">
                    <Image
                      src="/go_karting.webp"
                      alt="Go-karting session"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🏎️ F1 FANATICS
                      </span>
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl shadow-lg border border-red-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">F1 Legends Debate</h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-slate-700 italic mb-4">
                        Shreyas, Payal, and Shripad connected through the community and immediately ignited the ultimate F1 debate.
                      </p>
                      <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                        <p><strong>Kartik:</strong> <em>&quot;Seven championships don&apos;t lie - Lewis Hamilton&apos;s consistency and racecraft make him the greatest of all time.&quot;</em></p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        <p><strong>Shreyas:</strong> <em>&quot;Max&apos;s relentless speed and record-breaking performances define the new era of Formula 1.&quot;</em></p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                        <p><strong>Shripad:</strong> <em>&quot;Meanwhile, Ferrari&apos;s strategists are still trying to figure out tire choices...&quot;</em></p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        <p><strong>Payal:</strong> <em>&quot;And Fernando Alonso watches from a distance, amused by it all.&quot;</em></p>
                      </div>
                      <p className="text-center font-semibold text-red-600 mt-4">
                        Join the conversation - where do you stand in the Hamilton vs Verstappen debate?
                      </p>
                    </div>
                  </div>
                </article>

                {/* Shayari Story */}
                <article className="reveal-on-scroll connection-story-card">
                  <div className="relative rounded-2xl overflow-hidden mb-4 shadow-lg">
                    <Image
                      src="/shayri.webp"
                      alt="Shayari poetry session"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        📚 POETRY SOULS
                      </span>
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl shadow-lg border border-purple-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Poetry & Soul</h3>
                    <div className="space-y-3 text-sm">
                      <p className="text-slate-700 italic mb-4">
                        Yashas and Adi sat immersed in poetry, unraveling the magic of timeless verses...
                      </p>
                      <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
                        <p><strong>Yashas:</strong> <em>&quot;When Ghalib penned &apos;हज़ारों ख़्वाहिशें ऐसी...&apos;, he didn&apos;t just write words—he captured the very essence of longing.&quot;</em></p>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-400">
                        <p><strong>Adi:</strong> <em>&quot;And Faiz&apos;s &apos;बोल कि लब आज़ाद हैं तेरे&apos;—that&apos;s not poetry, that&apos;s revolution distilled into ink.&quot;</em></p>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-400">
                        <p><strong>Yashas:</strong> <em>&quot;But Jaun&apos;s &apos;मैंने सोचा पत्थर पिघल जाएगा&apos;... God! That&apos;s the kind of pain that carves its way into your soul.&quot;</em></p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-400">
                        <p><strong>Adi:</strong> <em>&quot;Some lines don&apos;t just speak—they ignite. And these? These are fire.&quot;</em></p>
                      </div>
                      <p className="text-center font-semibold text-purple-600 mt-4">
                        Join the Shayari session
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* CONNECTIONS SECTION - Enhanced */}
            <section className="relative z-10 w-full max-w-6xl mx-auto mt-16 px-4 scroll-animate slide-up">
              <div className="text-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 md:p-10 border border-purple-100 shadow-lg mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Connections Are Just the Beginning
                </h2>
                
                <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-6">
                  We curate the hottest cafés, secret study spots, and hidden gems near campus - so you can go from chat to chill in seconds.
                </p>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Find Your Vibe. Find Your Tribe.</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
                      <span className="text-lg">⚡️ <strong>Thrill-Seekers</strong></span>
                      <p className="text-sm text-slate-600 mt-1">Go-karting • F1 • Bike crews</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <span className="text-lg">⚡️ <strong>Sports Buffs</strong></span>
                      <p className="text-sm text-slate-600 mt-1">Football • Cricket • Gym squads</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <span className="text-lg">⚡️ <strong>Culture Creators</strong></span>
                      <p className="text-sm text-slate-600 mt-1">Foodie gangs • Shayari nights • Rap battles</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <span className="text-lg">⚡️ <strong>Brainiacs</strong></span>
                      <p className="text-sm text-slate-600 mt-1">Hackathons • Competitive coding</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200 mb-8">
                    <h4 className="text-xl font-bold text-slate-900 mb-4">Your Campus Perks:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex items-start gap-3">
                        <span className="text-green-500 font-bold text-lg">✅</span>
                        <span className="text-slate-700">Exclusive student discounts (food, fun, shopping)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-green-500 font-bold text-lg">✅</span>
                        <span className="text-slate-700">Perfectly vibe-matched spots (silent libraries • 24/7 study dens • lit food joints)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200 mb-8">
                    <div className="flex items-center justify-center gap-4 text-lg font-bold text-slate-900">
                      <span className="bg-teal-100 px-3 py-2 rounded-full">1️⃣ Sign Up</span>
                      <span className="text-teal-500">→</span>
                      <span className="bg-teal-100 px-3 py-2 rounded-full">2️⃣ Video Chat</span>
                      <span className="text-teal-500">→</span>
                      <span className="bg-teal-100 px-3 py-2 rounded-full">3️⃣ Crew Up</span>
                    </div>
                    <p className="text-slate-600 mt-4">
                      Make friends • Build groups • Join communities • Live your best campus life
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-xl border border-pink-300">
                    <p className="text-lg font-bold text-slate-900">
                      Your tribe is waiting. Claim your spot now!
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        <Footer />
      </div>

      {/* Local CSS for marquee, cards, chat bubbles, reduced motion */}
      <style jsx>{`
        /* Connection story cards */
        .connection-story-card {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .connection-story-card.in-view {
          opacity: 1;
          transform: translateY(0);
        }
        .connection-story-card:hover {
          transform: translateY(-8px);
          transition: transform 0.3s ease;
        }

        /* Enhanced glassmorphism tricolor marquee styles */
        .tricolor-marquee {
          animation: tricolorMove 45s linear infinite;
          display: flex;
          will-change: transform;
          font-size: 1rem;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .marquee-item {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          padding: 0 3rem;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          margin: 0 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .floating-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 100%);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }
        
        .particle-1 {
          top: 20%;
          left: 10%;
          animation-delay: 0s;
          animation-duration: 6s;
        }
        
        .particle-2 {
          top: 70%;
          left: 30%;
          animation-delay: 2s;
          animation-duration: 8s;
        }
        
        .particle-3 {
          top: 40%;
          left: 70%;
          animation-delay: 4s;
          animation-duration: 7s;
        }
        
        .particle-4 {
          top: 80%;
          left: 90%;
          animation-delay: 1s;
          animation-duration: 9s;
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-10px) scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes tricolorMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .tricolor-marquee:hover {
          animation-play-state: paused;
        }

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
          .marquee,
          .tricolor-marquee {
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