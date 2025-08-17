"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  // Helper: handle protected navigation
  const handleProtectedClick = (path: string) => {
    if (!session) {
      signIn("google", { callbackUrl: path }); // redirect to login, then back
    } else {
      window.location.href = path; // go directly if logged in
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-20 px-4 flex items-center justify-between shadow-lg bg-gradient-to-r from-teal-400 via-pink-400 via-yellow-300 to-blue-400 relative">
      {/* Left: Logo */}
      <Image
        src="/purr_assit_logo.webp"
        alt="PurrAssist Logo"
        width={96}
        height={96}
        className="ml-6 object-contain shrink-0 -mt-2 -mb-2"
        priority
      />

      {/* Center: Nav links — absolutely centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-6">
        {/* Home — glassy */}
        <Link
          href="/"
          className="inline-flex items-center rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 px-3 sm:px-4 py-1.5 text-[13px] sm:text-sm font-medium text-white hover:bg-white/30 transition"
        >
          Home
        </Link>

        {/* Connections — teal chip, with login check */}
        <button
          onClick={() => handleProtectedClick("/connections")}
          className="inline-flex items-center rounded-xl px-3 sm:px-4 py-1.5 text-[13px] sm:text-sm font-medium
                     bg-teal-200/80 text-teal-900 ring-1 ring-teal-300/70 hover:bg-teal-200 transition"
        >
          Connections
        </button>

        {/* Profile — glassy, with login check */}
        <button
          onClick={() => handleProtectedClick("/profile")}
          className="inline-flex items-center rounded-xl bg-white/25 backdrop-blur-[2px] ring-1 ring-white/30 px-3 sm:px-4 py-1.5 text-[13px] sm:text-sm font-medium text-white hover:bg-white/30 transition"
        >
          Profile
        </button>
      </div>

      {/* Right: Auth buttons (unchanged) */}
      <div className="flex items-center space-x-4">
        {status === "loading" ? (
          <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-2">
            Loading...
          </div>
        ) : !session ? (
          <button
            onClick={() => signIn("google")}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 border border-white/30"
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
            <span className="font-medium text-white max-w-[14ch] truncate">
              {session.user?.name}
            </span>
            <button
              onClick={() => signOut()}
              className="ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-3 py-1 rounded-lg transition-all duration-200 border border-white/30 text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
