"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Copy, Check } from "lucide-react";

type EmailItemProps = {
  label?: string;
  email: string;
};

function EmailItem({ label, email }: EmailItemProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-[#CBD5E1] bg-white p-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white border border-[#CBD5E1] text-[#0F172A]">
          <Mail size={18} />
        </span>
        <div className="min-w-0">
          {label && (
            <div className="text-xs font-semibold tracking-wide text-[#475569]">
              {label}
            </div>
          )}
          <a
            href={`mailto:${email}`}
            className="block truncate font-semibold text-[#0F172A] hover:text-[#0F766E]"
            title={email}
          >
            {email}
          </a>
        </div>
      </div>

      <div className="sm:ml-auto">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-[#F9A8D4] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] hover:brightness-105"
          aria-label={`Copy ${email}`}
        >
          {copied ? (
            <>
              <Check size={16} /> Copied
            </>
          ) : (
            <>
              <Copy size={16} /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#EAF2FE]">
      {/* Header / Hero */}
      <section className="border-b border-[#CBD5E1] bg-[#EAF2FE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <span className="inline-block rounded-full border border-[#F9A8D4] bg-white px-3 py-1 text-xs font-semibold text-[#0F172A]">
            Contact
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-[#0F172A]">
            Let’s talk — we’d love to hear from you
          </h1>
          <p className="mt-3 max-w-2xl text-[#475569]">
            Whether it’s product, partnerships, support, or new projects, drop us a line.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Business Mail */}
            <div className="lg:col-span-1 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-[0_18px_40px_-20px_rgba(2,6,23,0.08)]">
              <h2 className="text-xl font-bold text-[#0F172A]">Business Mail</h2>
              <p className="mt-1 text-sm text-[#475569]">
                General enquiries, support, or partnerships.
              </p>

              <div className="mt-5 space-y-3">
                <EmailItem email="purrassist@gmail.com" />
              </div>

              <div className="mt-6">
                <Link
                  href="/privacy"
                  className="text-sm font-medium text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Read our Privacy Policy
                </Link>
              </div>
            </div>

            {/* Developer Mail */}
            <div className="lg:col-span-2 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-[0_18px_40px_-20px_rgba(2,6,23,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Developer Mail</h2>
                  <p className="mt-1 text-sm text-[#475569]">
                    Mail us for collaboration, freelance work, internships, or any project ideas.
                  </p>
                </div>

                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#F9A8D4] bg-white px-3 py-1 text-xs font-semibold text-[#0F172A]">
                  Open to Projects
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <EmailItem email="sidnagaych4321@gmail.com" />
                <EmailItem email="dhavalemayur746@gmail.com" />
                <EmailItem email="pratapdabhade390@gmail.com" />
              </div>

              {/* CTA row — Start a project removed as requested */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/terms"
                  className="text-sm font-medium text-[#0F766E] hover:text-[#115E59] hover:underline decoration-[#F9A8D4] underline-offset-4"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          {/* Helpful links row */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link
              href="/report"
              className="group rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:shadow-md transition"
            >
              <div className="text-sm font-semibold text-[#0F172A]">Report / Safety</div>
              <p className="mt-1 text-sm text-[#475569]">
                Report a user, safety concern, or policy violation.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59]">
                Open →
              </span>
            </Link>

            <Link
              href="/privacy"
              className="group rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:shadow-md transition"
            >
              <div className="text-sm font-semibold text-[#0F172A]">Privacy Policy</div>
              <p className="mt-1 text-sm text-[#475569]">
                How we collect, use, and protect your data.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59]">
                Read →
              </span>
            </Link>

            <Link
              href="/cookies"
              className="group rounded-2xl border border-[#CBD5E1] bg-white p-5 hover:shadow-md transition"
            >
              <div className="text-sm font-semibold text-[#0F172A]">Cookie Policy</div>
              <p className="mt-1 text-sm text-[#475569]">
                Manage preferences and learn what we store.
              </p>
              <span className="mt-3 inline-block text-sm font-semibold text-[#0F766E] group-hover:text-[#115E59]">
                Manage →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
