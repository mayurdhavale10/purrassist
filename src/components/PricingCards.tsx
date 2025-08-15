"use client";

import { useState } from "react";

export default function PricingCards() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "free",
      name: "Basic Free",
      price: "₹0",
      originalPrice: null,
      period: "Today Only",
      popular: false,
      urgent: false,
      features: [
        "Same college video chat only",
        "Verified student profiles",
        "Safe & secure platform",
        "Basic matching system",
        "24/7 support"
      ],
      limitations: [
        "Cannot chat with other colleges",
        "No gender preferences",
        "Limited daily matches"
      ],
      buttonText: "Start Free",
      buttonColor: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      bgColor: "from-green-50 via-white to-green-50",
      icon: "🆓",
      badge: null
    },
    {
      id: "basic",
      name: "Basic All-Colleges",
      price: "₹69",
      originalPrice: "₹69",
      period: "one-time",
      popular: true,
      urgent: false,
      features: [
        "Same college + inter-college chat",
        "Connect with ANY verified college",
        "Unlimited daily matches",
        "Advanced matching algorithm",
        "Priority customer support",
        "Profile boost features"
      ],
      limitations: [
        "No gender preference options"
      ],
      buttonText: "Get Basic Access",
      buttonColor: "from-orange-500 to-orange-600",
      borderColor: "border-orange-300",
      bgColor: "from-orange-50 via-white to-orange-50",
      icon: "🏫",
      badge: "Most Popular"
    },
    {
      id: "premium",
      name: "Premium Ultimate",
      price: "₹69",
      originalPrice: "₹269",
      period: "one-time",
      popular: false,
      urgent: true,
      features: [
        "Everything in Basic +",
        "🚹 Boys Mode - Connect with verified male students",
        "🚺 Girls Mode - Women-only safe space",
        "Advanced filters & preferences",
        "VIP profile visibility",
        "Exclusive premium features",
        "Priority matching queue"
      ],
      limitations: [],
      buttonText: "Claim 90% OFF",
      buttonColor: "from-red-500 via-red-600 to-red-700",
      borderColor: "border-red-300",
      bgColor: "from-red-50 via-white to-red-50",
      icon: "👥",
      badge: "90% OFF"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would typically integrate with payment gateway
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <section id="pricing" className="relative w-full py-12 md:py-16">
      {/* Independence Day Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50 opacity-60"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 via-white to-green-100 border border-orange-200 rounded-full px-4 py-2 mb-6">
            <span className="text-orange-600">🇮🇳</span>
            <span className="font-semibold text-slate-700">Independence Day Pricing</span>
            <span className="text-green-600">🎉</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Choose Your <span className="bg-gradient-to-r from-orange-600 via-slate-800 to-green-600 bg-clip-text text-transparent">Freedom</span>
          </h2>
          
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Connect with verified college students nationwide. Start free, upgrade anytime!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br ${plan.bgColor} border-2 ${plan.borderColor} ${
                plan.popular ? 'scale-105 ring-2 ring-orange-300 ring-opacity-50' : ''
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white ${
                  plan.urgent ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' : 
                  plan.popular ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                  'bg-gradient-to-r from-green-500 to-green-600'
                }`}>
                  {plan.badge}
                </div>
              )}

              {/* Urgent Timer for Premium */}
              {plan.urgent && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                  ENDS MIDNIGHT!
                </div>
              )}

              {/* Icon & Title */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                
                {/* Pricing */}
                <div className="mb-4">
                  {plan.originalPrice && plan.originalPrice !== plan.price && (
                    <div className="text-sm text-slate-500 line-through mb-1">
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className="text-3xl font-black text-slate-900">
                    {plan.price}
                    {plan.price !== "₹0" && (
                      <span className="text-sm font-medium text-slate-600 ml-1">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {plan.urgent && (
                    <div className="text-green-600 font-bold text-sm mt-1">
                      Save ₹200 today!
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
                
                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="border-t pt-3 mt-4">
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-3 opacity-60">
                        <span className="text-slate-400 font-bold mt-0.5">✗</span>
                        <span className="text-slate-600 text-sm leading-relaxed">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 bg-gradient-to-r ${plan.buttonColor} shadow-lg hover:shadow-xl ${
                  plan.urgent ? 'animate-pulse' : ''
                }`}
              >
                {plan.buttonText}
              </button>

              {/* Additional CTA for Premium */}
              {plan.urgent && (
                <div className="text-center mt-3">
                  <p className="text-xs text-slate-600">
                    <span className="text-red-600 font-semibold">Limited time:</span> Regular price ₹269 from tomorrow
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 bg-white/80 backdrop-blur rounded-2xl px-8 py-6 shadow-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-green-500 text-lg">🛡️</span>
              <span className="font-medium">100% Verified Students</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-blue-500 text-lg">🔒</span>
              <span className="font-medium">Safe & Secure</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-purple-500 text-lg">⚡</span>
              <span className="font-medium">Instant Access</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mt-6 max-w-2xl mx-auto">
            All plans include access to verified college students only. No bots, no fake profiles, no monthly subscriptions. 
            <strong> Pay once, connect forever!</strong>
          </p>
        </div>


      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0px);
          }
          40%, 43% {
            transform: translateY(-6px);
          }
          70% {
            transform: translateY(-3px);
          }
          90% {
            transform: translateY(-1px);
          }
        }
      `}</style>
    </section>
  );
}