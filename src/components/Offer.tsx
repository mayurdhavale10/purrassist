"use client";

import { useState, useEffect } from "react";

export default function Offer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full py-8 md:py-12 overflow-hidden">
      {/* Independence Day Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-green-50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-orange-400 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-green-400 to-transparent"></div>
        </div>
      </div>

      {/* Animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-4 h-4 bg-orange-300 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute top-20 right-1/4 w-3 h-3 bg-green-300 rounded-full animate-bounce opacity-60" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-orange-400 rounded-full animate-pulse opacity-50"></div>
        <div className="absolute bottom-32 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-pulse opacity-50" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Independence Day Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 via-white to-green-100 border-2 border-orange-200 rounded-full px-4 py-2 mb-6 shadow-lg">
          <span className="text-lg">🇮🇳</span>
          <span className="text-sm font-semibold text-slate-700">Independence Day Special</span>
          <span className="text-lg">🎉</span>
        </div>

        {/* Main Offer Headline */}
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
          <span className="bg-gradient-to-r from-orange-600 via-slate-800 to-green-600 bg-clip-text text-transparent">
            FREEDOM SALE
          </span>
          <br />
          <span className="text-red-600 animate-pulse">90% OFF</span>
          <span className="text-slate-900"> Premium!</span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-slate-700 mb-6 max-w-2xl mx-auto">
          Celebrate freedom with <strong className="text-green-700">unlimited connections</strong>! 
          Premium features at <strong className="text-orange-600">Basic prices</strong> - today only!
        </p>

        {/* Countdown Timer */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-yellow-300 animate-pulse">⚡</span>
            <h3 className="font-bold text-lg">FLASH SALE ENDS IN:</h3>
            <span className="text-yellow-300 animate-pulse">⚡</span>
          </div>
          
          <div className="flex justify-center gap-4 text-center">
            <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black">{timeLeft.hours.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-90">HOURS</div>
            </div>
            <div className="flex items-center text-2xl font-bold">:</div>
            <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black">{timeLeft.minutes.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-90">MINS</div>
            </div>
            <div className="flex items-center text-2xl font-bold">:</div>
            <div className="bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
              <div className="text-2xl font-black animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-90">SECS</div>
            </div>
          </div>
        </div>

        {/* Quick Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200 shadow-md">
            <div className="text-2xl mb-2">🆓</div>
            <div className="font-semibold text-green-700">FREE Basic</div>
            <div className="text-sm text-slate-600">Same college chat</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-orange-200 shadow-md">
            <div className="text-2xl mb-2">🏫</div>
            <div className="font-semibold text-orange-700">₹69 All Colleges</div>
            <div className="text-sm text-slate-600">Inter-college networking</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-red-200 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
              HOT!
            </div>
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold text-red-700">₹69 Premium</div>
            <div className="text-sm text-slate-600">
              <span className="line-through opacity-60">₹269</span> Gender modes!
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="#pricing"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-red-500 to-green-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-xl hover:scale-105 transition-transform duration-300"
        >
          <span className="animate-bounce">🎯</span>
          Claim Your Freedom Deal
          <span className="animate-bounce">🎯</span>
        </a>

        {/* Fine print */}
        <p className="text-xs text-slate-500 mt-4 max-w-lg mx-auto">
          * Independence Day special pricing valid for 24 hours only. Premium features include gender selection (Boys Mode/Girls Mode). Regular pricing applies after midnight.
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0px);
          }
          40%, 43% {
            transform: translateY(-8px);
          }
          70% {
            transform: translateY(-4px);
          }
          90% {
            transform: translateY(-2px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </section>
  );
}