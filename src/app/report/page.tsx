// src/app/report/page.tsx
"use client";

import { useMemo, useState } from "react";

type Category =
  | "harassment"
  | "impersonation"
  | "suspicious"
  | "bug"
  | "other";

const CATEGORY_LABEL: Record<Category, string> = {
  harassment: "Harassment / Abuse",
  impersonation: "Impersonation / Fake profile",
  suspicious: "Suspicious activity / Safety",
  bug: "Bug or technical issue",
  other: "Other",
};

export default function ReportPage() {
  const [cat, setCat] = useState<Category>("harassment");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");

  // Compose a mailto link (no server needed)
  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(`Report: ${CATEGORY_LABEL[cat]}`);
    const body = encodeURIComponent(
      [
        `Category: ${CATEGORY_LABEL[cat]}`,
        contact ? `Contact (optional): ${contact}` : undefined,
        "",
        "Details:",
        details || "(no details provided)",
      ]
        .filter(Boolean)
        .join("\n")
    );
    return `mailto:purrassist@gmail.com?subject=${subject}&body=${body}`;
  }, [cat, contact, details]);

  return (
    <main className="min-h-screen bg-[#EAF2FE]">
      {/* Header */}
      <section className="border-b border-[#CBD5E1] bg-[#EAF2FE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <span className="inline-block rounded-full border border-[#F9A8D4] bg-white px-3 py-1 text-xs font-semibold text-[#0F172A]">
            Report
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-[#0F172A]">
            Tell us what went wrong
          </h1>
          <p className="mt-3 max-w-2xl text-[#475569]">
            Use this page to report a user, content, or any safety concern. You can
            also email us directly at{" "}
            <a
              href="mailto:purrassist@gmail.com"
              className="font-semibold text-[#0F766E] hover:text-[#115E59] underline decoration-[#F9A8D4] underline-offset-4"
            >
              purrassist@gmail.com
            </a>
            .
          </p>
        </div>
      </section>

      {/* Form */}
      <section>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 md:p-8 shadow-[0_18px_40px_-20px_rgba(2,6,23,0.08)]">
            {/* Category */}
            <FieldLabel htmlFor="category">What are you reporting?</FieldLabel>
            <div
              id="category"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
              role="group"
              aria-labelledby="category"
            >
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((key) => (
                <label
                  key={key}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-medium transition
                    ${
                      cat === key
                        ? "border-[#F9A8D4] bg-[#EAF2FE]"
                        : "border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]"
                    }`}
                >
                  <input
                    type="radio"
                    name="report-category"
                    className="sr-only"
                    checked={cat === key}
                    onChange={() => setCat(key)}
                  />
                  {CATEGORY_LABEL[key]}
                </label>
              ))}
            </div>

            {/* Details */}
            <FieldLabel htmlFor="details" hint="No sensitive info, please.">
              Describe the issue
            </FieldLabel>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={6}
              placeholder="What happened? Include dates, usernames, links, screenshots (if any)…"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
            />

            {/* Contact (optional) */}
            <FieldLabel htmlFor="contact" hint="We'll only use this to follow up.">
              Your email (optional)
            </FieldLabel>
            <input
              id="contact"
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="you@example.com"
              className="mb-6 w-full rounded-xl border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/40 focus:border-[#0F766E]"
            />

            {/* Actions */}
            <div className="flex items-center">
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-[#0F172A] border border-[#F9A8D4] bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:brightness-105 transition-shadow shadow"
              >
                Send Report
              </a>
            </div>

            {/* Help text */}
            <p className="mt-4 text-xs text-[#475569]">
              For urgent safety concerns, contact your local authorities. We aim to
              review reports within 24–48 hours.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function FieldLabel(props: { children: string; htmlFor: string; hint?: string }) {
  return (
    <div className="mb-2">
      <label
        htmlFor={props.htmlFor}
        className="block text-sm font-semibold text-[#0F172A]"
      >
        {props.children}
      </label>
      {props.hint ? (
        <div className="mt-0.5 text-xs text-[#475569]">{props.hint}</div>
      ) : null}
    </div>
  );
}