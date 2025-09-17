// src/app/legal/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Copy, Check, ShieldCheck, FileText, Flag, Gavel, Moon, Sun, Camera, AlertTriangle } from "lucide-react";

const OFFICIAL_EMAIL = "purrassist@gmail.com";

function CopyEmail({ email = OFFICIAL_EMAIL }: { email?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 rounded-lg border border-pink-300 dark:border-pink-400 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:brightness-105 transition-all"
      >
        <Mail size={16} /> {email}
      </a>
      <button
        onClick={handle}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-slate-900 dark:text-white hover:brightness-105 transition-all"
        aria-label="Copy email"
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
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-gray-600" />
      )}
    </button>
  );
}

function InfoCard({
  icon,
  title,
  desc,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg dark:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-pink-300 dark:border-pink-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-white">
          {icon}
        </span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{desc}</p>

      <ul className="mt-4 space-y-2 text-sm text-slate-900 dark:text-gray-200">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-pink-400 dark:bg-pink-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WarningCard() {
  return (
    <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
          <Camera size={24} className="text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Video Chat Content Warning</h3>
      </div>

      <div className="space-y-4">
        <p className="text-red-700 dark:text-red-300 font-semibold">
          ⚠️ STRICTLY PROHIBITED ON VIDEO CHAT:
        </p>
        
        <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            <span><strong>Nudity or Sexual Content:</strong> Any form of nudity, sexual acts, or sexually explicit material is strictly forbidden.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            <span><strong>Abuse & Harassment:</strong> Verbal abuse, bullying, harassment, hate speech, or discriminatory behavior.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            <span><strong>Illegal Activities:</strong> Drug use, violence, self-harm, or any illegal activities on camera.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
            <span><strong>Inappropriate Behavior:</strong> Any behavior that violates community guidelines or makes others uncomfortable.</span>
          </li>
        </ul>

        <div className="bg-red-100 dark:bg-red-800/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
          <p className="text-red-800 dark:text-red-200 font-medium mb-2">
            🚨 USER RESPONSIBILITY DISCLAIMER:
          </p>
          <p className="text-sm text-red-700 dark:text-red-300">
            <strong>You are solely responsible for your conduct during video chats.</strong> Any violation of these guidelines may result in immediate account suspension or termination. PurrAssist is not liable for user behavior, and users engaging in prohibited activities do so at their own risk and may face legal consequences.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          All video chats are subject to community guidelines and may be monitored for safety.
        </div>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      
      <main>
        {/* Header */}
        <section className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <span className="inline-block rounded-full border border-pink-300 dark:border-pink-400 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-white">
              Legal
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
              Legal Notices & Content Requests
            </h1>
            <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">
              Need something removed or corrected? Email us officially and we'll review within a
              reasonable time. We honor lawful requests for copyright, privacy, impersonation, and
              safety concerns.
            </p>

            <div className="mt-5">
              <CopyEmail />
            </div>
          </div>
        </section>

        {/* Content */}
        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            
            {/* Video Chat Warning */}
            <WarningCard />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoCard
                icon={<FileText size={18} />}
                title="Content Removal / Changes"
                desc="Ask us to remove or modify content you own, appear in, or have authority over."
                items={[
                  "Exact URL(s) or in-app locations",
                  "What should be removed/changed",
                  "Reason (copyright, privacy, impersonation, etc.)",
                  "Proof (rights or identity) if applicable",
                ]}
              />
              <InfoCard
                icon={<ShieldCheck size={18} />}
                title="Privacy / Personal Data"
                desc="Request removal of personal data or content that identifies you."
                items={[
                  "Link(s) or where it appears",
                  "What personal data to remove",
                  "Reason (privacy, safety, sensitive information)",
                  "We may verify identity to protect users",
                ]}
              />
              <InfoCard
                icon={<Gavel size={18} />}
                title="Trademark / Branding"
                desc="Report misuse or infringement of your mark, logo, or brand on PurrAssist."
                items={[
                  "Your mark/logo/name & proof (if available)",
                  "Where the misuse occurs",
                  "How it may confuse or mislead users",
                ]}
              />
              <InfoCard
                icon={<Flag size={18} />}
                title="Report Harmful Content"
                desc="Flag harassment, hate, self-harm, illegal content, or rule violations."
                items={[
                  "Where it happened (links, screenshots)",
                  "What happened and when",
                  "Any context that helps us act quickly",
                ]}
              />
            </div>

            {/* Helpful links */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link
                href="/privacy"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Privacy Policy</div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  How we collect, use, and protect your data.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-teal-700 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300">
                  Read →
                </span>
              </Link>

              <Link
                href="/terms"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Terms of Service</div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Rules for using PurrAssist and your responsibilities.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-teal-700 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300">
                  Read →
                </span>
              </Link>

              <Link
                href="/cookies"
                className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md dark:hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Cookie Policy</div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Manage preferences and learn what we store.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-teal-700 dark:text-teal-400 group-hover:text-teal-800 dark:group-hover:text-teal-300">
                  Manage →
                </span>
              </Link>
            </div>

            {/* Jurisdiction & disclaimer */}
            <div className="mt-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Jurisdiction & Process</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                PurrAssist operates from India. We honor lawful requests under applicable laws,
                including the Indian Copyright Act, 1957, information technology and intermediary
                guidelines, and other consumer/safety regulations. We may request additional details
                to verify the requester's identity or authority and to prevent fraudulent notices.
                This page is for general information and is not legal advice.
              </p>
            </div>

            {/* Contact line */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-900 dark:text-white">Official contact:</span>
              <CopyEmail />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}