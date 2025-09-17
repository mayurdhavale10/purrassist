// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "@/components/Providers";
import GlobalAudio from "@/components/GlobalAudio";
import Navbar from "@/components/Navbar";
import GlobalCursor from "@/components/GlobalCursor";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Purrassist",
  description: "Online Video chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Hide system cursor on large screens only; keep default on touch/small */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-[#050B1A] lg:cursor-none`}>
        <Providers>
          <GlobalAudio />
          <Navbar />
          {/* Custom orange cursor */}
          <GlobalCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
