"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PricingCards() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "free",
      name: "Basic Plan – Free",
      price: "₹0",
      originalPrice: null,
      period: "Today Only",
      popular: false,
      urgent: false,
      features: [
        "**Same-College Video Chat** – Connect only with students from your college.",
        "**Verified Profiles** – Real students, no fake accounts.",
        "**Safe & Secure** – Privacy-first platform.",
        "**Basic Matching** – Get suggested profiles daily.",
        "**24/7 Support** – Help whenever you need it."
      ],
      limitations: [
        "**No Cross-College Chat** – Only your campus network.",
        "**No Gender Filters** – Matches are random.",
        "**Limited Daily Swipes** – Take it slow!"
      ],
      bottomText: "🎓 Campus-focused. Simple. Safe.",
      buttonText: "Start Free",
      buttonColor: "from-green-500 to-green-600",
      borderColor: "border-green-200",
      bgColor: "from-green-50 via-white to-green-50",
      logo: "/purr_assit_logo.webp",
      badge: null
    },
    {
      id: "basic",
      name: "Basic All-Colleges Plan",
      price: "FREE TODAY!",
      originalPrice: "₹69",
      period: "freedom sale",
      popular: true,
      urgent: false,
      features: [
        "**Same + Inter-College Chat** – Video chat across campuses",
        "**Any Verified College** – Connect with ANY institute in India",
        "**Unlimited Swipes** – No restrictions today!",
        "**Smart Matching** – AI finds your ideal connections",
        "**Priority Support** – Instant help when needed",
        "**Profile Booster** – 2x visibility for 24 hours"
      ],
      limitations: [
        "**No Gender Filters** – Random verified matches"
      ],
      bottomText: "🎉 Celebrate Freedom to Connect!",
      buttonText: "Get Basic Access",
      buttonColor: "from-orange-500 to-orange-600",
      borderColor: "border-orange-300",
      bgColor: "from-orange-50 via-white to-orange-50",
      logo: "/purr_assit_logo.webp",
      badge: "Most Popular"
    },
    {
      id: "premium",
      name: "Premium Ultimate",
      price: "₹169",
      originalPrice: "₹369",
      period: "monthly (One-Time Offer!)",
      popular: false,
      urgent: true,
      features: [
        "**Everything in Basic + More!**",
        "**Talk to Who You Want** – Choose your preferred gender (boys/girls) for connections.",
        "**Advanced Filters** – Refine matches by interests, location & more.",
        "**VIP Profile Boost** – Get 3x more visibility & likes.",
        "**Exclusive Features** – Unlock hidden perks for better chats.",
        "**Priority Matching** – Skip waiting, meet people faster!"
      ],
      limitations: [],
      bottomText: "✨ Your rules, your connections—pick who you vibe with!",
      buttonText: "Claim Offer",
      buttonColor: "from-red-500 via-red-600 to-red-700",
      borderColor: "border-red-300",
      bgColor: "from-red-50 via-white to-red-50",
      logo: "/purr_assit_logo.webp",
      badge: "🔥 Save ₹200 Today!"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    router.push(`/checkout?plan=${planId}`);
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 md:p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br ${plan.bgColor} border-2 ${plan.borderColor} ${
                plan.popular ? 'scale-105 ring-2 ring-orange-300 ring-opacity-50' : ''
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white ${
                  plan.urgent ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' : 
                  plan.popular ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                  'bg-gradient-to-r from-green-500 to-green-600'
                }`}>
                  {plan.badge}
                </div>
              )}

              {plan.urgent && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                  ENDS MIDNIGHT!
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <img 
                    src={plan.logo} 
                    alt="PurrAssist Logo" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                
                <div className="mb-4">
                  {plan.originalPrice && plan.originalPrice !== plan.price && (
                    <div className="text-sm text-slate-500 line-through mb-1">
                      {plan.originalPrice}
                    </div>
                  )}
                  <div className="text-3xl font-black text-slate-900">
                    {plan.price}
                    {!plan.price.includes("FREE") && plan.price !== "₹0" && (
                      <span className="text-sm font-medium text-slate-600 ml-1">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {plan.period && plan.price.includes("FREE") && (
                    <div className="text-orange-600 font-bold text-sm mt-1">
                      {plan.period}
                    </div>
                  )}
                  {plan.urgent && (
                    <div className="text-green-600 font-bold text-sm mt-1">
                      Save ₹200 today!
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">😻</span>
                    <div 
                      className="text-slate-700 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                  </div>
                ))}
                
                {plan.limitations.length > 0 && (
                  <div className="border-t pt-3 mt-4">
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-3 opacity-70">
                        <span className="text-2xl mt-0.5">😾</span>
                        <div 
                          className="text-slate-600 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: limitation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {plan.bottomText && (
                  <div className="border-t pt-4 mt-4 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {plan.bottomText}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 bg-gradient-to-r ${plan.buttonColor} shadow-lg hover:shadow-xl ${
                  plan.urgent ? 'animate-pulse' : ''
                }`}
              >
                {plan.buttonText}
              </button>

              {plan.urgent && (
                <div className="text-center mt-3">
                  <p className="text-xs text-slate-600">
                    <span className="text-red-600 font-semibold">Limited time:</span> Regular price ₹369 from tomorrow
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}