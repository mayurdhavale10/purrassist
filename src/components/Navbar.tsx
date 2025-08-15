import { ReactNode } from "react";
import Image from "next/image";

interface NavbarProps {
  children?: ReactNode;
}

export default function Navbar({ children }: NavbarProps) {
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
        <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 border border-white/30">
          Login
        </button>
        {children}
      </div>
    </nav>
  );
}