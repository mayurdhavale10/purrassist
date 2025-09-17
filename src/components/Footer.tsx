"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent } from "react";
import { Mail, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const onSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to your newsletter endpoint
    // const email = new FormData(e.currentTarget).get("email");
    // await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) });
  };

  return (
    <footer className="mt-24 border-t bg-[#EAF2FE] border-[#CBD5E1] text-[#0F172A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + status */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <Image
                  src="/purr_assit_logo.webp"
                  alt="PurrAssist"
                  fill
                  className="object-contain"
                  sizes="36px"
                  priority
                />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">PurrAssist</h3>
            </div>

            <p className="text-sm leading-6 text-[#475569]">
              Real students. Real connections. Built with care in India.
            </p>

            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs border-[#CBD5E1] bg-white"
              aria-label="Service status"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "#22C55E" }}
                aria-hidden
              />
              <span className="font-medium">All systems operational</span>
            </div>

            <p className="text-sm text-[#475569]">
              Questions?{" "}
              <a
                className="font-semibold text-[#0F766E] hover:text-[#115E59] underline decoration-[#F9A8D4] underline-offset-4"
                href="mailto:support@purrassist.app"
              >
                support@purrassist.app
              </a>
            </p>
          </div>

          {/* Company */}
          <nav className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Report
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Legal Notices
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav className="space-y-3">
            <h4 className="text-sm font-semibold tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </nav>

          {/* Newsletter + Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold tracking-wide">Stay in the loop</h4>
            <form onSubmit={onSubscribe} className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border px-3 py-2.5 text-sm bg-white placeholder-[#94A3B8] border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold text-[#0F172A] border border-[#F9A8D4] bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:brightness-105 transition-shadow shadow"
              >
                Subscribe
              </button>
            </form>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="mailto:support@purrassist.app"
                aria-label="Email"
                className="grid h-9 w-9 place-items-center rounded-full bg-white border border-[#CBD5E1] text-[#0F172A] hover:shadow-sm"
              >
                <Mail size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="grid h-9 w-9 place-items-center rounded-full bg-white border border-[#CBD5E1] text-[#0F172A] hover:shadow-sm"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full bg-white border border-[#CBD5E1] text-[#0F172A] hover:shadow-sm"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="grid h-9 w-9 place-items-center rounded-full bg-white border border-[#CBD5E1] text-[#0F172A] hover:shadow-sm"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-[#CBD5E1] pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
            <p className="text-[#475569]">© {year} PurrAssist. All rights reserved.</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/privacy"
                className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
              >
                Cookie Policy
              </Link>
            </div>
          </div>

          {/* subtle pink accent line */}
          <div className="mt-4 h-[3px] w-24 rounded-full bg-[#F9A8D4]" />
        </div>
      </div>
    </footer>
  );
}
