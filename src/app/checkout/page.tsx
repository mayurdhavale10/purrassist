"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

// Try to import the npm package instead of dynamic loading
let loadCashfree: any = null;
try {
  const cashfreeModule = require("@cashfreepayments/cashfree-js");
  loadCashfree = cashfreeModule.load;
} catch {
  console.log("Cashfree npm package not available, will try CDN fallback");
}

declare global {
  interface Window {
    Cashfree: any;
  }
}

const PLANS = {
  free: { name: "Basic Free", price: 0 },
  basic: { name: "Basic All-Colleges", price: 69 },
  premium: { name: "Premium Ultimate", price: 169 },
};

// ---- Page wrapper: keeps build happy (Suspense around CSR bailout) ----
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

// ---- Your original client logic moved here unchanged ----
function CheckoutInner() {
  const params = useSearchParams();
  const planId = params.get("plan") as keyof typeof PLANS;
  const plan = PLANS[planId];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadCashfreeSDK = async (): Promise<any> => {
    // Try npm package first
    if (loadCashfree) {
      try {
        console.log("[Payment] Loading Cashfree via npm package...");
        const cashfree = await loadCashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox",
        });
        console.log("[Payment] Cashfree loaded via npm package");
        return cashfree;
      } catch (error) {
        console.error("[Payment] Failed to load via npm package:", error);
        // Fall through to CDN method
      }
    }

    // Fallback to CDN method
    return new Promise<any>((resolve, reject) => {
      if (typeof window !== "undefined" && window.Cashfree) {
        console.log("[Payment] Cashfree SDK already loaded via CDN");
        resolve(new window.Cashfree());
        return;
      }

      console.log("[Payment] Loading Cashfree SDK via CDN...");

      const script = document.createElement("script");
      const cdnUrls = [
        "https://sdk.cashfree.com/js/ui/2.0.0/checkout.js",
        "https://sdk.cashfree.com/js/ui/2.0.1/checkout.js",
        "https://sdk.cashfree.com/js/v3/cashfree.js",
      ];

      let currentUrlIndex = 0;

      const tryLoadScript = () => {
        if (currentUrlIndex >= cdnUrls.length) {
          reject(new Error("Failed to load payment system from all CDN sources"));
          return;
        }

        script.src = cdnUrls[currentUrlIndex];
        console.log(`[Payment] Trying CDN URL: ${script.src}`);

        const timeout = setTimeout(() => {
          console.error(`[Payment] SDK load timeout for URL: ${script.src}`);
          if (document.body.contains(script)) document.body.removeChild(script);
          currentUrlIndex++;
          tryLoadScript();
        }, 8000);

        script.onload = () => {
          clearTimeout(timeout);
          console.log("[Payment] SDK script loaded, checking Cashfree object...");
          setTimeout(() => {
            if (typeof window !== "undefined" && window.Cashfree) {
              console.log("[Payment] Cashfree SDK ready via CDN");
              resolve(new window.Cashfree());
            } else {
              console.error("[Payment] Cashfree object not available after script load");
              if (document.body.contains(script)) document.body.removeChild(script);
              currentUrlIndex++;
              tryLoadScript();
            }
          }, 300);
        };

        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`[Payment] SDK script failed to load from ${script.src}:`, error);
          if (document.body.contains(script)) document.body.removeChild(script);
          currentUrlIndex++;
          tryLoadScript();
        };

        script.async = true;
        document.body.appendChild(script);
      };

      tryLoadScript();
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("[Payment] Starting payment process for plan:", planId);

      let cashfree;
      try {
        cashfree = await loadCashfreeSDK();
        console.log("[Payment] SDK loaded successfully");
      } catch (sdkError) {
        console.error("[Payment] SDK load error:", sdkError);
        throw new Error("Failed to load payment processor. Please try again.");
      }

      console.log("[Payment] Creating payment session...");
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          customerEmail: "user@example.com", // make dynamic if you want
          customerPhone: "9999999999", // make dynamic if you want
        }),
      });

      const data = await res.json();
      console.log("[Payment] API response:", data);

      if (!res.ok) {
        console.error("[Payment] API error:", data);
        throw new Error(data.error || `Payment initialization failed (${res.status})`);
      }

      if (!data.paymentSessionId) {
        console.error("[Payment] No payment session ID in response");
        throw new Error("Invalid payment session - please try again");
      }

      console.log("[Payment] Initializing Cashfree checkout with session ID:", data.paymentSessionId);

      if (cashfree && cashfree.checkout) {
        await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
        });
      } else if (cashfree && cashfree.redirect) {
        await cashfree.redirect({
          paymentSessionId: data.paymentSessionId,
          returnUrl: `${window.location.origin}/payment/return`,
        });
      } else {
        throw new Error("Payment processor method not available");
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage = err instanceof Error ? err.message : "Payment failed - please try again";
      setError(errorMessage);
      setRetryCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Free plan fast-path UI
  if (plan && plan.price === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#d2e8fe" }}>
        <div className="w-full max-w-md">
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

  // Invalid plan UI
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Plan</h2>
          <p className="mt-2 mb-4">The selected plan does not exist.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Paid plan UI
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f0f7ff] via-white to-[#f6fff6]">
      {/* soft gradient blob */}
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

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">
              <div className="text-sm font-medium">{error}</div>
              {retryCount < 3 ? (
                <button onClick={() => setError(null)} className="mt-2 text-xs underline">
                  Try again
                </button>
              ) : (
                <p className="mt-2 text-xs">
                  Still stuck? Please retry in a moment or contact support.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-lg transition-all ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95"
            }`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                Processing…
              </>
            ) : (
              "Proceed Securely"
            )}
          </button>

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
