"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Page component: ONLY wraps content in <Suspense>.
 * This fixes the Next.js build error for useSearchParams.
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading payment details...</div>}>
      <SuccessInner />
    </Suspense>
  );
}

/**
 * Inner client component: uses useSearchParams + all your logic/UI.
 * Keeping this in the same file avoids creating a second file.
 */
function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();

  // Cashfree can return order_id / orderId / order
  const orderId =
    params.get("order_id") || params.get("orderId") || params.get("order");

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [msg, setMsg] = useState("Verifying your payment…");

  // Poll your backend to see if the webhook flipped the user's plan
  useEffect(() => {
    let tries = 0;
    let alive = true;

    const poll = async () => {
      try {
        // Your API that returns { planType: "free" | "intercollege" | "gender" }
        const res = await fetch("/api/user/plan", { cache: "no-store" });
        const data = await res.json();
        const plan = data?.planType as "free" | "intercollege" | "gender" | null;

        if (plan === "intercollege" || plan === "gender") {
          if (!alive) return;
          setStatus("success");
          setMsg("Payment confirmed. Your plan is active!");
          return;
        }
      } catch {
        // Ignore single poll errors; continue retrying
      }

      tries += 1;
      if (!alive) return;
      if (tries < 10) {
        setTimeout(poll, 2000); // ~20s total
      } else {
        setStatus("error");
        setMsg("We couldn’t confirm the payment yet. It may take a moment.");
      }
    };

    if (!orderId) {
      setStatus("error");
      setMsg("Missing order id.");
      return;
    }

    poll();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const success = status === "success";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        {/* soft glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-200 via-amber-200 to-sky-200 blur-xl opacity-60" />
        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200/70 p-7">
          <div
            className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              success ? "bg-emerald-100" : "bg-yellow-100"
            }`}
          >
            {success ? (
              <svg
                className="w-7 h-7 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-yellow-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 text-center">
            {success ? "Payment Successful!" : status === "pending" ? "Verifying…" : "Payment Pending"}
          </h1>

          <p className="mt-1 text-center text-slate-600">{msg}</p>

          {!!orderId && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/video")}
              disabled={!success}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-blue-700 hover:opacity-95 shadow-md disabled:opacity-60"
            >
              Start Video Chat
            </button>
            <button
              onClick={() => router.push("/#pricing")}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
            >
              Back to Pricing
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Secure • Student-first • No auto-renew
          </div>

          {status === "error" && (
            <div className="mt-4 rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-center text-sm text-yellow-800">
              If you just completed payment, the confirmation can take a few seconds.
              You can refresh or check later; your access unlocks as soon as it’s verified by the webhook.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
