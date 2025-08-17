"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper: handle protected navigationn
  const handleProtectedClick = (path: string) => {
    if (!session) {
      signIn("google", { callbackUrl: path }); // redirect to login, then back
    } else {
      window.location.href = path; // go directly if logged in
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 h-20 px-4 flex items-center justify-between shadow-lg bg-gradient-to-r from-teal-400 via-pink-400 via-yellow-300 to-blue-400 relative">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Image
            src="/purr_assit_logo.webp"
            alt="PurrAssist Logo"
            width={96}
            height={96}
            className="ml-2 sm:ml-6 object-contain shrink-0 -mt-2 -mb-2"
            priority
          />
        </div>

        {/* Center: Nav links — Desktop only, absolutely centered */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 xl:gap-6">
          {/* Home — glassy */}
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 px-3 xl:px-4 py-1.5 text-[13px] xl:text-sm font-medium text-white hover:bg-white/30 transition"
          >
            Home
          </Link>

          {/* Connections — teal chip, with login check */}
          <button
            onClick={() => handleProtectedClick("/connections")}
            className="inline-flex items-center rounded-xl px-3 xl:px-4 py-1.5 text-[13px] xl:text-sm font-medium
                       bg-teal-200/80 text-teal-900 ring-1 ring-teal-300/70 hover:bg-teal-200 transition"
          >
            Connections
          </button>

          {/* Profile — glassy, with login check */}
          <button
            onClick={() => handleProtectedClick("/profile")}
            className="inline-flex items-center rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 px-3 xl:px-4 py-1.5 text-[13px] xl:text-sm font-medium text-white hover:bg-white/30 transition"
          >
            Profile
          </button>
        </div>

        {/* Right: Auth buttons and Mobile Menu Button */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Auth Section - Responsive */}
          <div className="hidden sm:flex items-center space-x-4">
            {status === "loading" ? (
              <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-2">
                <div className="text-xs sm:text-sm">Loading...</div>
              </div>
            ) : !session ? (
              <button
                onClick={() => signIn("google")}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 border border-white/30 text-xs sm:text-sm"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Image
                  src={session.user?.image || "/default-avatar.png"}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="hidden md:block font-medium text-white max-w-[10ch] xl:max-w-[14ch] truncate text-sm">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 border border-white/30 text-xs sm:text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200 border border-white/30"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}>
          <div 
            className="fixed top-20 left-0 right-0 bg-gradient-to-b from-teal-400 via-pink-400 to-blue-400 shadow-xl border-t border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-3 px-4 rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 text-white font-medium hover:bg-white/30 transition"
                >
                  Home
                </Link>

                <button
                  onClick={() => handleProtectedClick("/connections")}
                  className="block w-full text-center py-3 px-4 rounded-xl bg-teal-200/80 text-teal-900 ring-1 ring-teal-300/70 font-medium hover:bg-teal-200 transition"
                >
                  Connections
                </button>

                <button
                  onClick={() => handleProtectedClick("/profile")}
                  className="block w-full text-center py-3 px-4 rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 text-white font-medium hover:bg-white/30 transition"
                >
                  Profile
                </button>
              </div>

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-white/20">
                {status === "loading" ? (
                  <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-3 text-center">
                    Loading...
                  </div>
                ) : !session ? (
                  <button
                    onClick={() => {
                      signIn("google");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 border border-white/30"
                  >
                    Login with Google
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <Image
                        src={session.user?.image || "/default-avatar.png"}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <span className="font-medium text-white truncate">
                        {session.user?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 border border-white/30"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}