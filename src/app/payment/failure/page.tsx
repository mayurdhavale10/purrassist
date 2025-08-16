"use client";

import { useRouter } from "next/navigation";

export default function PaymentFailurePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        {/* soft glow background */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-200 via-amber-200 to-red-200 blur-xl opacity-60" />
        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/70 p-7">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7 text-rose-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-slate-900 text-center">
            Payment Failed
          </h1>

          <p className="mt-1 text-center text-slate-600">
            Something went wrong while processing your payment.
          </p>

          <p className="mt-2 text-center text-sm text-slate-500">
            If money was deducted, don’t worry — it will be refunded
            automatically. You can try again below.
          </p>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/#pricing")}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            >
              Back to Pricing
            </button>
            <button
              onClick={() => router.push("/checkout?plan=basic")}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-blue-700 hover:opacity-95 shadow-md"
            >
              Try Again
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-5 text-center text-xs text-slate-500">
            Secure • Student-first • No auto-renew
          </div>
        </div>
      </div>
    </div>
  );
}
