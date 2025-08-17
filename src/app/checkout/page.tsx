"use client";

/**
 * Checkout page
 * - Adds `phone` state & input (no more hard-coded number)
 * - Uses NextAuth session email (const { data: session } = useSession())
 * - Light phone validation before calling /api/payment/create-order
 * - Keeps Suspense wrapper to satisfy Next.js CSR bailout build rule
 * - Preserves your npm+CDN Cashfree SDK fallback and all UI/UX
 * - NOW includes FloatingPeopleBg on all plan pages
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import FloatingPeopleBg from "@/components/FloatingPeopleBg"; // <<— add this import

// ----- Cashfree SDK dynamic import (npm first, CDN fallback) -----
let loadCashfree: any = null;
try {
  // Try the official npm package first
  const cf = require("@cashfreepayments/cashfree-js");
  loadCashfree = cf.load;
} catch {
  console.log("[Payment] Cashfree npm package not available, will try CDN fallback");
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

// ----- Plan metadata (unchanged) -----
const PLANS = {
  free: { name: "Basic Free", price: 0 },
  basic: { name: "Basic All-Colleges", price: 1 },
  premium: { name: "Premium Ultimate", price: 169 },
};

// ===== Page wrapper fixes Next.js build warning by wrapping CSR hooks in Suspense =====
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

// ===== Actual client page logic moved here =====
function CheckoutInner() {
  const params = useSearchParams();
  const planId = params.get("plan") as keyof typeof PLANS;
  const plan = PLANS[planId];

  // ✅ Correct way to get session
  const { data: session } = useSession();

  // ---- UI state ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // NEW: phone state from user input (instead of hard-coded)
  const [phone, setPhone] = useState("");

  // Strip non-digits as the user types (keeps UX tidy)
  const onPhoneChange = (v: string) => setPhone(v.replace(/\D/g, ""));

  // ---- Simple phone validation (10+ digits) ----
  const isValidPhone = useMemo(() => phone.replace(/\D/g, "").length >= 10, [phone]);

  // (Optional) Pre-fill phone later from DB if you store it; left blank intentionally for now
  useEffect(() => {
    // placeholder for future autofill logic if you store phone in User model
  }, []);

  // ---- Cashfree loader (npm first, then CDN) ----
  const loadCashfreeSDK = async (): Promise<any> => {
    // 1) Try npm package
    if (loadCashfree) {
      try {
        console.log("[Payment] Loading Cashfree via npm package…");
        // Use env or hardcode sandbox while testing
        const cashfree = await loadCashfree({
          // mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox",
          mode: "production",
        });
        console.log("[Payment] Cashfree loaded via npm package");
        return cashfree;
      } catch (err) {
        console.error("[Payment] NPM load failed, falling back to CDN:", err);
      }
    }

    // 2) Fallback to CDN
    return new Promise<any>((resolve, reject) => {
      if (typeof window !== "undefined" && window.Cashfree) {
        console.log("[Payment] Cashfree SDK already available on window");
        resolve(new window.Cashfree());
        return;
      }

      const cdnUrls = [
        "https://sdk.cashfree.com/js/ui/2.0.0/checkout.js",
        "https://sdk.cashfree.com/js/ui/2.0.1/checkout.js",
        "https://sdk.cashfree.com/js/v3/cashfree.js",
      ];
      let idx = 0;

      const tryUrl = () => {
        if (idx >= cdnUrls.length) {
          reject(new Error("Failed to load Cashfree SDK from all CDN sources"));
          return;
        }

        const src = cdnUrls[idx++];
        console.log(`[Payment] Loading Cashfree CDN: ${src}`);
        const script = document.createElement("script");
        const timeout = setTimeout(() => {
          console.error(`[Payment] Cashfree CDN timeout: ${src}`);
          cleanup();
          tryUrl();
        }, 8000);

        const cleanup = () => {
          clearTimeout(timeout);
          if (document.body.contains(script)) document.body.removeChild(script);
        };

        script.onload = () => {
          clearTimeout(timeout);
          setTimeout(() => {
            if (window.Cashfree) {
              console.log("[Payment] Cashfree SDK ready via CDN");
              cleanup(); // script can be removed; object is on window
              resolve(new window.Cashfree());
            } else {
              console.error("[Payment] window.Cashfree missing after load, trying next CDN");
              cleanup();
              tryUrl();
            }
          }, 250);
        };

        script.onerror = (e) => {
          console.error("[Payment] Cashfree CDN error:", e);
          cleanup();
          tryUrl();
        };

        script.async = true;
        script.src = src;
        document.body.appendChild(script);
      };

      tryUrl();
    });
  };

  // ---- Payment click handler ----
  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate phone before hitting server
      if (!isValidPhone) {
        setError("Please enter a valid phone number (10+ digits).");
        setLoading(false);
        return;
      }

      // Load Cashfree SDK
      const cashfree = await loadCashfreeSDK();

      // ✅ Use email from session (webhook uses this to update the correct user)
      const email = session?.user?.email || undefined;

      // Create order on your API
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          customerEmail: email,   // ← dynamic from session
          customerPhone: phone,   // ← dynamic from input
        }),
      });

      const data = await res.json();
      console.log("[Payment] /create-order response:", data);

      if (!res.ok || !data?.payment_session_id && !data?.paymentSessionId) {
        // support either snake_case or camelCase depending on your backend response
        throw new Error(data?.error || "Failed to initialize payment session");
      }

      const sessionId = data.paymentSessionId ?? data.payment_session_id;

      // Kick off Cashfree checkout
      if (cashfree?.checkout) {
        await cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: "_self",
        });
      } else if (cashfree?.redirect) {
        await cashfree.redirect({
          paymentSessionId: sessionId,
          returnUrl: `${window.location.origin}/payment/return`,
        });
      } else {
        throw new Error("Cashfree checkout method not available");
      }
    } catch (err) {
      console.error("Payment error:", err);
      const msg = err instanceof Error ? err.message : "Payment failed - please try again";
      setError(msg);
      setRetryCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  };

  // ===== Free plan fast path (WITH FLOATING BACKGROUND) =====
  if (plan && plan.price === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#d2e8fe" }}>
        {/* floating people behind card */}
        <FloatingPeopleBg />
        
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="flex justify-center mb-6">
              <img src="/purr_assit_logo.webp" alt="PurrAssist Logo" className="w-20 h-20 object-contain" />
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Free Plan Activated</h1>
              <p className="text-gray-600 font-medium">Your {plan.name} is ready to use</p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => (window.location.href = "/video")}
                className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-orange-400 via-yellow-400 to-blue-500 text-white font-bold rounded-2xl hover:opacity-90 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                Start Video Chat →
              </button>

              <button
                onClick={() => (window.location.href = "/#pricing")}
                className="w-full py-4 px-6 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                ← Back to Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== Invalid plan guard =====
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Plan</h2>
          <p className="mt-2 mb-4">The selected plan does not exist.</p>
          <button onClick={() => (window.location.href = "/")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ===== Paid plan UI (WITH FLOATING BACKGROUND) =====
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f0f7ff] via-white to-[#f6fff6]">
      {/* floating people behind card */}
      <FloatingPeopleBg />

      {/* Soft gradient background blobs */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute -top-20 -left-16 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-slate-200/70 p-7">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/purr_assit_logo.webp" alt="PurrAssist" className="h-10 w-10 rounded-md" />
            <div className="text-lg font-extrabold tracking-tight text-slate-900">PurrAssist Checkout</div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-2">Complete Payment</h1>

          {/* Plan & Amount summary */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-700">
              <span>Plan</span>
              <span className="font-semibold text-slate-900">{plan.name}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-700">
              <span>Amount</span>
              <span className="font-extrabold text-emerald-600">₹{plan.price}</span>
            </div>
          </div>

          {/* NEW: Phone input (sent to backend & Cashfree) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Phone number</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="e.g., 9876543210"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">Used for payment confirmation & receipts.</p>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">
              <div className="text-sm font-medium">{error}</div>
              {retryCount < 3 ? (
                <button onClick={() => setError(null)} className="mt-2 text-xs underline">
                  Try again
                </button>
              ) : (
                <p className="mt-2 text-xs">Still stuck? Please retry in a moment or contact support.</p>
              )}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !isValidPhone}
            className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-lg transition-all ${
              loading || !isValidPhone
                ? "bg-emerald-400/70 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                  <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Processing…
              </>
            ) : (
              "Proceed Securely"
            )}
          </button>

          {/* Trust row (no emojis) */}
          <div className="mt-6">
            <div className="flex items-center justify-center text-[11px] text-slate-500">
              <span>SSL Encrypted</span>
              <span className="mx-2">•</span>
              <span>Bank Grade Security</span>
              <span className="mx-2">•</span>
              <span>PCI Compliant</span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 opacity-80">
              <img src="/UPI-Logo.webp" alt="UPI" className="h-6 w-auto" />
              <img src="/visa.webp" alt="Visa" className="h-6 w-auto" />
              <img src="/mastercard.webp" alt="Mastercard" className="h-6 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}