"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Refs for entrance animation
  const logoRef = useRef<HTMLDivElement>(null);
  const linkWrapRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLDivElement>(null);

  // Toggle
  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);

  // Auth-gated nav action
  const gotoProtected = (path: string) => {
    if (!session) {
      signIn("google", { callbackUrl: path });
    } else {
      window.location.href = path;
    }
    setIsMobileMenuOpen(false);
  };

  // On mount: GSAP intro (respect reduced motion)
  useLayoutEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set([logoRef.current, linkWrapRef.current, authRef.current], {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: "all",
        });
        return;
      }
      gsap.set(logoRef.current, { autoAlpha: 0, y: -8, scale: 0.95 });
      gsap.set([linkWrapRef.current, authRef.current], { autoAlpha: 0, y: 10 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(logoRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45 });
      tl.to(linkWrapRef.current, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.1");
      tl.to(authRef.current, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.15");
    });

    return () => ctx.revert();
  }, []);

  // Scroll state (morph glass → solid)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Styles
  const barBase =
    "fixed top-0 inset-x-0 z-50 transition-all duration-300 will-change-transform";
  const barSkin = scrolled
    ? "bg-black/70 ring-1 ring-white/10 backdrop-blur-md"
    : "bg-white/10 ring-1 ring-white/20 backdrop-blur-md";
  const barHeight = scrolled ? "h-14" : "h-16";

  const linkBase =
    "inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";
  const isActive = (href: string) =>
    pathname === href ? "bg-white/15 text-white" : "";

  return (
    <>
      {/* NAVBAR */}
      <nav className={`${barBase} ${barSkin} ${barHeight}`} role="navigation" aria-label="Primary">
        <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand */}
          <div ref={logoRef} className="flex items-center gap-2">
            <Link href="/" aria-label="Go to homepage" className="flex items-center gap-2">
              <Image
                src="/purr_assit_logo.webp"
                alt="PurrAssist"
                width={36}
                height={36}
                className="rounded-md"
                priority
              />
              <span className="hidden sm:block font-bold tracking-tight text-white">PurrAssist</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div ref={linkWrapRef} className="hidden lg:flex items-center gap-2">
            <Link href="/" className={`${linkBase} ${isActive("/")}`}>
              Home
            </Link>
            <button
              onClick={() => gotoProtected("/connections")}
              className={`${linkBase} ${isActive("/connections")}`}
            >
              Connections
            </button>
            <button
              onClick={() => gotoProtected("/profile")}
              className={`${linkBase} ${isActive("/profile")}`}
            >
              Profile
            </button>
          </div>

          {/* Right: auth + mobile trigger */}
          <div ref={authRef} className="flex items-center gap-3">
            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {status === "loading" ? (
                <div className="h-9 w-[96px] rounded-lg bg-white/15 animate-pulse" aria-hidden />
              ) : !session ? (
                <button
                  onClick={() => signIn("google")}
                  className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold bg-white text-black hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  Login
                </button>
              ) : (
                <>
                  <Image
                    src={session.user?.image || "/default-avatar.png"}
                    alt="Your avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="hidden xl:block max-w-[14ch] truncate text-white/90 text-sm">
                    {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold bg-white/10 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-white/90 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SHEET */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[49] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileMenu}
        >
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            className="fixed top-[--nav-h] left-0 right-0 mt-[64px] sm:mt-[72px] max-h-[70vh] overflow-auto
                       mx-4 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md p-4 space-y-3 text-white"
            style={
              {
                // keep this in sync with barHeight so the sheet sits below the bar
                ["--nav-h" as any]: "0px",
              } as React.CSSProperties
            }
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block w-full ${linkBase} ${isActive("/")} !justify-center`}
            >
              Home
            </Link>
            <button
              onClick={() => gotoProtected("/connections")}
              className={`block w-full ${linkBase} ${isActive("/connections")} !justify-center`}
            >
              Connections
            </button>
            <button
              onClick={() => gotoProtected("/profile")}
              className={`block w-full ${linkBase} ${isActive("/profile")} !justify-center`}
            >
              Profile
            </button>

            <div className="pt-3 border-t border-white/10">
              {status === "loading" ? (
                <div className="h-10 w-full rounded-xl bg-white/15 animate-pulse" />
              ) : !session ? (
                <button
                  onClick={() => {
                    signIn("google");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-white text-black hover:bg-zinc-100"
                >
                  Login with Google
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={session.user?.image || "/default-avatar.png"}
                      alt="Your avatar"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <span className="max-w-[18ch] truncate">{session.user?.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
