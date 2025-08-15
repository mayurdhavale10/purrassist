"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

  useEffect(() => {
    if (!plan) {
      alert("Invalid plan");
      window.location.href = "/";
    }
  }, [plan]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.orderToken) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/ui/1.0.26/checkout.js";
        script.onload = () => {
          // @ts-ignore
          const cashfree = new window.Cashfree();
          cashfree.initialiseDropin(document.getElementById("cashfree-container"), {
            orderToken: data.orderToken,
            onSuccess: () => {
              alert("Payment successful!");
              window.location.href = "/success";
            },
            onFailure: (err: any) => {
              console.error("Payment failed", err);
              alert("Payment failed. Please try again.");
            },
          });
        };
        document.body.appendChild(script);
      } else {
        alert("Error creating payment order");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting payment");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-6">
          Complete your payment securely to activate your plan.
        </p>

        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <div className="flex justify-between mb-2">
            <span className="text-gray-700 font-medium">Plan</span>
            <span className="font-semibold">{plan?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Price</span>
            <span className="text-green-600 font-bold text-lg">
              ₹{plan?.price}
            </span>
          </div>
        </div>

        {plan?.price > 0 ? (
          <>
            <div id="cashfree-container" className="mb-4"></div>
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition 
                ${loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </>
        ) : (
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg font-bold"
          >
            Continue Free
          </button>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center">
          Payments are securely processed by Cashfree.
        </p>
      </div>
    </div>
  );
}
