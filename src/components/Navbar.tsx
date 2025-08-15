"use client";

import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 h-20 px-4 flex justify-between items-center shadow-lg bg-gradient-to-r from-teal-400 via-pink-400 via-yellow-300 to-blue-400">
      {/* Logo */}
      <Image
        src="/purr_assit_logo.webp"
        alt="PurrAssist Logo"
        width={96}
        height={96}
        className="ml-6 object-contain shrink-0 -mt-2 -mb-2"
        priority
      />
      
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
            <span className="font-medium text-white">
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