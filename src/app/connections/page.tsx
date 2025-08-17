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

        {/* Connected Brands/Community Members Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-800 mb-4">Our Growing Community</h2>
            <p className="text-teal-700 max-w-2xl mx-auto">
              Meet the amazing creators and brands who have joined our community and are lighting up conversations across campuses
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Niyate Shaukh Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: Profile Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="flex-shrink-0">
                      <Image
                        src="/connections/Niyat.webp"
                        alt="Niyate Shaukh Logo"
                        width={80}
                        height={80}
                        className="rounded-full object-cover shadow-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-teal-800 mb-2">Niyate Shaukh</h3>
                      <p className="text-teal-700 mb-4 leading-relaxed">
                        <span className="font-medium">Niyate Shaukh</span> joined our community and brought a beautiful light to our 
                        shayari and poetry community. Their authentic voice and creative expressions have inspired countless 
                        students to explore the art of words and connect through meaningful conversations.
                      </p>
                      
                      {/* Social Media Links */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-teal-700">Connect with them:</span>
                        
                        {/* Instagram */}
                        <a 
                          href="https://www.instagram.com/niyateshaukh?igsh=YWNmdHB6bWo1bncw" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg group"
                          title="Follow on Instagram"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>

                        {/* YouTube */}
                        <a 
                          href="https://youtube.com/@niyateshaukh?feature=shared" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg group"
                          title="Subscribe on YouTube"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Community Impact */}
                  <div className="bg-gradient-to-r from-teal-50 to-yellow-50 rounded-lg p-4 border border-teal-200/50">
                    <h4 className="text-lg font-semibold text-teal-800 mb-2">Community Impact</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">Poetry & Shayari</span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Creative Writing</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">Student Inspiration</span>
                    </div>
                  </div>
                </div>

                {/* Right: Featured Post */}
                <div className="lg:w-80 flex-shrink-0">
                  <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-sm">
                    <h4 className="text-sm font-medium text-teal-800 mb-3">Featured Post</h4>
                    <Image
                      src="/connections/niyat_zakir.webp"
                      alt="Niyate Shaukh Featured Post"
                      width={280}
                      height={280}
                      className="w-full h-64 object-cover rounded-lg shadow-sm"
                    />
                    <p className="text-xs text-teal-600 mt-2 text-center">
                      Inspiring the poetry community ✨
                    </p>
                  </div>
                </div>
              </div>
            </div>
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