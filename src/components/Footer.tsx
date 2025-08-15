// components/Footer.tsx
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#EAF2FE] text-[#0F172A] mt-20">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/purr_assit_logo.webp"
                alt="PurrAssist Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <span className="text-xl font-bold text-[#0F172A]">PurrAssist</span>
            </div>
            <p className="text-[#475569] text-sm leading-relaxed mb-6">
              Verified college video chat connecting real students for authentic conversations. No bots, no creeps—just genuine connections.
            </p>
            <div className="flex gap-4">
              {/* Facebook */}
              <a href="#" className="w-10 h-10 bg-white hover:bg-[#0F766E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-[#CBD5E1] hover:text-white group">
                <svg className="w-5 h-5 text-[#0F766E] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="w-10 h-10 bg-white hover:bg-[#0F766E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-[#CBD5E1] hover:text-white group">
                <svg className="w-5 h-5 text-[#0F766E] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.73-3.016-1.797L3.43 16.988c.568 1.067 1.719 1.797 3.016 1.797h7.102c1.297 0 2.448-.73 3.016-1.797l2.003-1.797c-.568 1.067-1.719 1.797-3.016 1.797H8.449z"/>
                  <path d="M12 7.056c-2.731 0-4.944 2.213-4.944 4.944S9.269 16.944 12 16.944s4.944-2.213 4.944-4.944S14.731 7.056 12 7.056zm0 8.167c-1.775 0-3.222-1.447-3.222-3.222S10.225 8.778 12 8.778s3.222 1.447 3.222 3.222-1.447 3.223-3.222 3.223z"/>
                  <circle cx="16.806" cy="7.207" r="1.078"/>
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" className="w-10 h-10 bg-white hover:bg-[#0F766E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-[#CBD5E1] hover:text-white group">
                <svg className="w-5 h-5 text-[#0F766E] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="w-10 h-10 bg-white hover:bg-[#0F766E] rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-[#CBD5E1] hover:text-white group">
                <svg className="w-5 h-5 text-[#0F766E] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">Product</h3>
            <ul className="space-y-3">
              <li><a href="/chat" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Video Chat</a></li>
              <li><a href="/features" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Features</a></li>
              <li><a href="/safety" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Safety & Verification</a></li>
              <li><a href="/campus-connect" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Campus Connect</a></li>
              <li><a href="/global-mode" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Global Mode</a></li>
              <li><a href="/coming-soon" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm flex items-center gap-2 hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">
                Local Hangouts <span className="text-xs bg-[#F9A8D4] text-[#9D174D] px-2 py-0.5 rounded-full font-medium">Soon</span>
              </a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">Support</h3>
            <ul className="space-y-3">
              <li><a href="/help" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Help Center</a></li>
              <li><a href="/contact" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Contact Us</a></li>
              <li><a href="/report" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Report Issue</a></li>
              <li><a href="/feedback" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Give Feedback</a></li>
              <li><a href="/status" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">System Status</a></li>
              <li><a href="/community" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Community Guidelines</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#0F172A]">Company</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">About Us</a></li>
              <li><a href="/careers" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Careers</a></li>
              <li><a href="/press" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Press Kit</a></li>
              <li><a href="/blog" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Blog</a></li>
              <li><a href="/privacy" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Privacy Policy</a></li>
              <li><a href="/terms" className="text-[#0F766E] hover:text-[#115E59] transition-colors text-sm hover:underline decoration-[#F9A8D4] decoration-2 underline-offset-2">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-[#F9A8D4]">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-3 text-[#0F172A]">Stay Updated</h3>
            <p className="text-[#475569] text-sm mb-6">
              Get early access to new features, campus events, and exclusive student perks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your college email"
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E] text-sm"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D97706] rounded-lg font-medium transition-all text-sm text-[#0F172A] shadow-sm">
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#F9A8D4] bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[#475569] text-sm text-center sm:text-left">
              © 2025 PurrAssist. All rights reserved. Made with 💜 for college students in India.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="text-[#0F766E] hover:text-[#115E59] transition-colors">Privacy</a>
              <a href="/terms" className="text-[#0F766E] hover:text-[#115E59] transition-colors">Terms</a>
              <a href="/cookies" className="text-[#0F766E] hover:text-[#115E59] transition-colors">Cookies</a>
              <div className="flex items-center gap-2 text-[#475569]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs bg-[#F9A8D4] text-[#9D174D] px-2 py-1 rounded-full font-medium">Verified</span>
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}