"use client";

import Image from "next/image";
import { UserCheck, UserX, Shield, Users, Settings, Heart, Crown } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
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
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
            Your Profile Hub
          </h1>
          
          {/* Coming Soon Badge - Navbar gradient style */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="px-6 py-2 bg-gradient-to-r from-teal-400 via-pink-400 via-yellow-300 to-blue-400 text-white font-semibold rounded-full text-lg shadow-lg">
              ✨ Coming Soon
            </span>
          </div>
          
          <p className="text-lg text-rose-700 max-w-2xl mx-auto leading-relaxed">
            Manage your connections, communities, and create your perfect student profile. 
            Your personal space for authentic college networking.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Friend Management */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-rose-800">Friend Management</h3>
            </div>
            
            <p className="text-rose-700 mb-6 leading-relaxed">
              Organize and manage all your video chat friends in one place. 
              Keep your connections meaningful and authentic.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">View all your friends list</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Add new friends easily</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Remove or block users</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Friend activity and status</span>
              </div>
            </div>
          </div>

          {/* Privacy & Safety Controls */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-rose-800">Privacy & Safety</h3>
            </div>
            
            <p className="text-rose-700 mb-6 leading-relaxed">
              Complete control over your privacy settings and safety preferences. 
              Your comfort and security are our top priority.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Block and report management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Privacy settings control</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Safe space preferences</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Activity visibility options</span>
              </div>
            </div>
          </div>

          {/* Community Interests */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-400 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-rose-800">My Communities</h3>
            </div>
            
            <p className="text-rose-700 mb-6 leading-relaxed">
              Track all the communities you're part of and discover new ones that match your interests. 
              Build meaningful connections around shared passions.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">List of joined communities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Interest-based recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Community activity tracker</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Create your own communities</span>
              </div>
            </div>
          </div>

          {/* Profile Customization */}
          <div className="bg-gradient-to-br from-pink-100/80 to-rose-100/80 backdrop-blur-md rounded-2xl p-8 border border-pink-300/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-rose-800">Profile Customization</h3>
            </div>
            
            <p className="text-rose-700 mb-6 leading-relaxed">
              Express your personality with custom profile themes, badges, and preferences. 
              Make your profile uniquely yours.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Custom profile themes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Achievement badges</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Interest tags and bio</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                <span className="text-rose-600">Profile visibility controls</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Stats Preview */}
        <div className="mt-16">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-pink-200/50 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Crown className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-rose-800 mb-2">
                Your Student Journey
              </h3>
              <p className="text-rose-700">
                Track your connections, communities, and campus engagement all in one place
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200/50">
                <div className="text-3xl font-bold text-rose-600 mb-2">0</div>
                <div className="text-rose-700 text-sm">Friends Connected</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-200/50">
                <div className="text-3xl font-bold text-pink-600 mb-2">0</div>
                <div className="text-pink-700 text-sm">Communities Joined</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200/50">
                <div className="text-3xl font-bold text-rose-600 mb-2">0</div>
                <div className="text-rose-700 text-sm">Chat Conversations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-pink-200/50 max-w-2xl mx-auto">
            <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-rose-800 mb-4">
              Ready to Build Your Profile?
            </h3>
            <p className="text-rose-700 mb-6">
              Join thousands of students creating meaningful connections and building their college network.
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl">
              Get Early Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}