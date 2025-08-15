// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import GlobalAudio from "@/components/GlobalAudio"; // you'll create this
import Navbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Purrassist",
  description: "Online Video chat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SessionProvider>

     
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Background audio + mute/unmute button, available globally */}
        <GlobalAudio />

        {/* Your existing context providers */}
        <Navbar/>
        <Providers>{children}</Providers>
      </body>
       </SessionProvider>
    </html>
  );
}
