"use client";

import Image from "next/image";
import { Mail, Users, MessageCircle, Building, Star, Heart } from "lucide-react";

export default function ConnectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-teal-100 to-yellow-50">
      {/* Header Section */}
      <div className="pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/purr_assit_logo.webp"
              alt="PurrAssist Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          
          <h1 className="text-4xl font-bold text-teal-800 mb-4">
            Connections Hub
          </h1>
          
          {/* Coming Soon Badge - Navbar gradient style */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-6 py-2 bg-gradient-to-r from-teal-400 via-pink-400 via-yellow-300 to-blue-400 text-white font-semibold rounded-full text-lg shadow-lg">
              🚀 Coming Soon
            </span>
          </div>
          
          <p className="text-lg text-teal-700 max-w-2xl mx-auto leading-relaxed">
            Connect, chat, and build communities with your video chat friends. 
            The ultimate hub for authentic student connections and brand opportunities.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Friend Chat Feature */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-teal-800">Friend Chat</h3>
            </div>
            
            <p className="text-teal-700 mb-6 leading-relaxed">
              Continue conversations with friends you've met during video chats. 
              Text chat, share moments, and stay connected beyond video calls.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Direct messaging with video chat friends</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Share photos and moments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Group chats with multiple friends</span>
              </div>
            </div>
          </div>

          {/* Community Listing Feature */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-teal-800">Communities</h3>
            </div>
            
            <p className="text-teal-700 mb-6 leading-relaxed">
              Discover and join student communities. From study groups to hobby clubs, 
              find your tribe and make lasting connections.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Browse college communities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Join interest-based groups</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Create your own communities</span>
              </div>
            </div>
          </div>

          {/* Brand Promotion Feature */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-teal-800">Brand Promotion</h3>
            </div>
            
            <p className="text-teal-700 mb-6 leading-relaxed">
              Showcase your brand, startup, or creative projects to engaged student communities. 
              Build authentic connections with your target audience.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Promote your startup or brand</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Share creative projects</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-teal-600">Connect with potential customers</span>
              </div>
            </div>
          </div>

          {/* Early Access CTA */}
          <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8 border border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-teal-800">Early Brand Deals</h3>
            </div>
            
            <p className="text-teal-700 mb-6 leading-relaxed">
              Get exclusive access to brand partnership opportunities and secure early deals 
              before the feature launches publicly.
            </p>
            
            <div className="bg-white/60 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <span className="text-teal-800 font-medium">
                  Mail us at: 
                  <a 
                    href="mailto:purrassist@gmail.com" 
                    className="text-teal-600 hover:text-teal-800 underline ml-1"
                  >
                    purrassist@gmail.com
                  </a>
                </span>
              </div>
            </div>
            
            <p className="text-sm text-teal-600 italic">
              💡 Limited spots available for early brand partnerships
            </p>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-teal-200 max-w-2xl mx-auto">
            <Heart className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-teal-800 mb-4">
              Get Notified When We Launch
            </h3>
            <p className="text-teal-700 mb-6">
              Be the first to experience the future of student connections and brand partnerships.
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl">
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}