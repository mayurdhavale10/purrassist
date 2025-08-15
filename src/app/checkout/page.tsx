"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

// Try to import the npm package instead of dynamic loading
let loadCashfree: any = null;
try {
  const cashfreeModule = require("@cashfreepayments/cashfree-js");
  loadCashfree = cashfreeModule.load;
} catch (e) {
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

export default function CheckoutPage() {
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
        console.log('[Payment] Loading Cashfree via npm package...');
        const cashfree = await loadCashfree({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox",
        });
        console.log('[Payment] Cashfree loaded via npm package');
        return cashfree;
      } catch (error) {
        console.error('[Payment] Failed to load via npm package:', error);
        // Fall through to CDN method
      }
    }

    // Fallback to CDN method
    return new Promise<any>((resolve, reject) => {
      // Check if already loaded via CDN
      if (typeof window !== "undefined" && window.Cashfree) {
        console.log('[Payment] Cashfree SDK already loaded via CDN');
        resolve(new window.Cashfree());
        return;
      }

      console.log('[Payment] Loading Cashfree SDK via CDN...');

      const script = document.createElement("script");
      // Try different CDN URLs
      const cdnUrls = [
        "https://sdk.cashfree.com/js/ui/2.0.0/checkout.js",
        "https://sdk.cashfree.com/js/ui/2.0.1/checkout.js",
        "https://sdk.cashfree.com/js/v3/cashfree.js"
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
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
          currentUrlIndex++;
          tryLoadScript();
        }, 8000);
        
        script.onload = () => {
          clearTimeout(timeout);
          console.log('[Payment] SDK script loaded, checking Cashfree object...');
          
          setTimeout(() => {
            if (typeof window !== "undefined" && window.Cashfree) {
              console.log('[Payment] Cashfree SDK ready via CDN');
              resolve(new window.Cashfree());
            } else {
              console.error('[Payment] Cashfree object not available after script load');
              currentUrlIndex++;
              tryLoadScript();
            }
          }, 300);
        };
        
        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error(`[Payment] SDK script failed to load from ${script.src}:`, error);
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
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
      console.log('[Payment] Starting payment process for plan:', planId);

      // Load SDK and get cashfree instance
      let cashfree;
      try {
        cashfree = await loadCashfreeSDK();
        console.log('[Payment] SDK loaded successfully');
      } catch (sdkError) {
        console.error("[Payment] SDK load error:", sdkError);
        throw new Error("Failed to load payment processor. Please try again.");
      }

      // Create payment session
      console.log('[Payment] Creating payment session...');
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          planId,
          customerEmail: "user@example.com", // You can make this dynamic
          customerPhone: "9999999999" // You can make this dynamic
        }),
      });

      const data = await res.json();
      console.log('[Payment] API response:', data);

      if (!res.ok) {
        console.error('[Payment] API error:', data);
        throw new Error(data.error || `Payment initialization failed (${res.status})`);
      }

      if (!data.paymentSessionId) {
        console.error('[Payment] No payment session ID in response');
        throw new Error("Invalid payment session - please try again");
      }

      // Initialize Cashfree payment
      console.log('[Payment] Initializing Cashfree checkout with session ID:', data.paymentSessionId);
      
      // Use the cashfree instance we got from loading
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
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Handle free plan
  if (plan && plan.price === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Free Plan Activated!</h1>
            <p className="text-gray-600">Your {plan.name} is now active.</p>
          </div>
          
          <button 
            onClick={() => window.location.href = "/dashboard"}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600">Invalid Plan</h2>
          <p className="mt-2 mb-4">The selected plan does not exist.</p>
          <button 
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Complete Payment</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Amount:</span>
            <span className="text-green-600 font-bold">₹{plan.price}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="flex-1">
                <p className="font-medium text-sm">{error}</p>
                {retryCount < 3 && (
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-sm underline text-red-700 hover:text-red-800"
                  >
                    Try Again
                  </button>
                )}
                {retryCount >= 3 && (
                  <p className="mt-2 text-sm text-red-600">
                    Still having trouble? Please contact support or try a different payment method.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : "Proceed to Payment"}
        </button>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Payments securely processed by Cashfree
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>SSL Encrypted</span>
            <span>•</span>
            <span>Bank Grade Security</span>
            <span>•</span>
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}