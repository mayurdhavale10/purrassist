"use client";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

type Role = "initiator" | "answerer";
type Message = {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
};

type MatchingOption = {
  type: string;
  label: string;
  description: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
  requiresGender?: boolean;
};

type UserPlan = {
  user: {
    email: string;
    name: string;
    image?: string;
    gender: string;
    college: string;
    planType: "free" | "gender" | "intercollege";
    hasActivePlan: boolean;
    planExpiry?: string;
    daysRemaining?: number;
  };
  matchingOptions: MatchingOption[];
  planStatus: {
    isActive: boolean;
    planName: string;
    expiresAt?: string;
    daysRemaining?: number;
  };
};

const SOCKET_URL = "https://3d0a9a98866f.ngrok-free.app";

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "turn:111.93.74.158:3478", username: "freeuser", credential: "freepassword" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];

export default function VideoPageClient() {
  const { data: session, status } = useSession();

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const candidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI/State
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Plan-related
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [selectedMatchingOption, setSelectedMatchingOption] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("any");
  const [showToast, setShowToast] = useState<{ message: string; type: "error" | "info" | "success" } | null>(null);

  // Registration / lifecycle helpers
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasEmittedRegister, setHasEmittedRegister] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Smooth scroll to bottom of chat (without viewport jumping)
  const scrollToBottom = () => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  };

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Fetch user plan after session ready
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setStatusMessage("Please sign in to use the chat");
      setLoading(false);
      return;
    }

    if (session?.user?.email) {
      fetchUserPlan();
    }
  }, [session, status]);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const planData: UserPlan = {
        user: {
          email: session?.user?.email || "",
          name: session?.user?.name || "",
          image: session?.user?.image||'/purr_assit_logo.webp',
          gender: "male",
          college: "IIT Delhi",
          planType: "gender",
          hasActivePlan: true,
          daysRemaining: 15
        },
        matchingOptions: [],
        planStatus: {
          isActive: true,
          planName: "Gender Premium Plan",
          daysRemaining: 15
        }
      };

      // Generate matching options based on plan
      const matchingOptions = generateMatchingOptions(planData);
      setUserPlan({ ...planData, matchingOptions });

      // Auto-select the first enabled option
      const firstEnabled = matchingOptions.find(opt => !opt.disabled);
      if (firstEnabled) {
        setSelectedMatchingOption(firstEnabled.type);
      }

      setStatusMessage("✨ Ready to connect! Choose your matching preference.");
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to load user data. Please refresh.");
      setShowToast({ message: "Failed to load user data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Generate matching options based on user's plan
  const generateMatchingOptions = (planData: UserPlan): MatchingOption[] => {
    const { planType, hasActivePlan } = planData.user;
    const activePlan = hasActivePlan ? planType : "free";

    const options: MatchingOption[] = [
      {
        type: "same_any",
        label: "Same College",
        description: "Connect with anyone from your college",
        icon: "🏫",
        disabled: false,
      },
    ];

    // Inter-college options
    const interCollegeOption: MatchingOption = {
      type: "inter_any",
      label: "Any College",
      description: "Connect globally with any college",
      icon: "🌍",
      disabled: activePlan === "free",
      disabledReason: activePlan === "free" ? "Upgrade to unlock global matching" : undefined,
    };
    options.push(interCollegeOption);

    // Gender-specific options
    if (activePlan === "gender") {
      options.push(
        {
          type: "same_male",
          label: "Males (Same)",
          description: "Connect with males from your college",
          icon: "👨‍🎓",
          requiresGender: true,
        },
        {
          type: "same_female",
          label: "Females (Same)",
          description: "Connect with females from your college",
          icon: "👩‍🎓",
          requiresGender: true,
        },
        {
          type: "inter_male",
          label: "Males (Global)",
          description: "Connect with males from any college",
          icon: "🌍👨",
          requiresGender: true,
        },
        {
          type: "inter_female",
          label: "Females (Global)",
          description: "Connect with females from any college",
          icon: "🌍👩",
          requiresGender: true,
        }
      );
    } else {
      // Show locked gender options
      options.push(
        {
          type: "same_male",
          label: "Males (Same)",
          description: "Connect with males from your college",
          icon: "👨‍🎓",
          disabled: true,
          disabledReason: "Upgrade to Gender Premium",
        },
        {
          type: "same_female",
          label: "Females (Same)",
          description: "Connect with females from your college",
          icon: "👩‍🎓",
          disabled: true,
          disabledReason: "Upgrade to Gender Premium",
        }
      );
    }

    return options;
  };

  // Camera initialization with mirror fix
  useEffect(() => {
    if (showVideo) initializeCamera();
    else stopCamera();
  }, [showVideo]);

  const initializeCamera = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1920 }, 
          height: { ideal: 720, max: 1080 }, 
          facingMode: "user",
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Fix mirror image by applying CSS transform
        localVideoRef.current.style.transform = "scaleX(-1)";
        localVideoRef.current.play().catch(() => {});
      }
      
      setStatusMessage("📹 Camera ready! Choose preference and start connecting...");
      setShowToast({ message: "Camera activated successfully!", type: "success" });
    } catch (err) {
      console.error("Camera error:", err);
      setStatusMessage("Camera access needed for video chat. Text chat still works!");
      setShowVideo(false);
      setShowToast({ message: "Camera permission required for video", type: "error" });
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.style.transform = "none";
    }
  };

  // Handle option selection
  function handleOptionSelect(optionType: string, option: MatchingOption) {
    if (option.disabled) {
      setShowToast({
        message: option.disabledReason || "This feature requires plan upgrade",
        type: "error"
      });
      return;
    }
    setSelectedMatchingOption(optionType);
    setShowToast({ message: `Selected: ${option.label}`, type: "info" });
  }

  // Start flow
  function handleStart() {
    if (!selectedMatchingOption || !session?.user?.email) return;

    const selectedOption = userPlan?.matchingOptions.find(opt => opt.type === selectedMatchingOption);
    if (selectedOption?.disabled) {
      setShowToast({
        message: selectedOption.disabledReason || "Feature not available in current plan",
        type: "error"
      });
      return;
    }

    // Simulate connection process
    setStatusMessage("🔍 Searching for the perfect match...");
    setShowToast({ message: "Searching for someone awesome!", type: "info" });
    
    setTimeout(() => {
      // Simulate finding a match
      setIsConnected(true);
      setPartnerId("demo-partner");
      setRole("initiator");
      setStatusMessage("🎉 Connected! Say hi to your new chat buddy!");
      setMessages([
        {
          id: Date.now().toString(),
          text: "You're now connected with a random stranger. Say hello! 👋",
          sender: "stranger",
          timestamp: new Date(),
        },
      ]);
      setShowToast({ message: "Match found! Start chatting!", type: "success" });
    }, 2000);
  }

  function handleNext() {
    setStatusMessage("🔄 Finding you someone new...");
    setIsConnected(false);
    setMessages([]);
    setPartnerId(null);
    setRole(null);
    setShowToast({ message: "Looking for a new connection...", type: "info" });
    
    setTimeout(() => handleStart(), 1500);
  }

  function handleEnd() {
    setStatusMessage("👋 Disconnected. Ready for a new adventure?");
    setIsConnected(false);
    setMessages([]);
    setPartnerId(null);
    setRole(null);
    setShowToast({ message: "Chat ended. Hope you had fun!", type: "info" });
  }

  function handleSendMessage() {
    if (!messageInput.trim() || !isConnected) return;
    
    const message = { 
      id: Date.now().toString(), 
      text: messageInput, 
      sender: "you" as const, 
      timestamp: new Date() 
    };
    
    setMessages((prev) => [...prev, message]);
    setMessageInput("");
    
    // Simulate stranger response
    setTimeout(() => {
      const responses = [
        "Hey there! 👋",
        "That's awesome! Tell me more 😊",
        "I totally agree with you!",
        "Haha, that's funny! 😂",
        "What do you think about...?",
        "Nice to meet you! 🌟"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "stranger",
        timestamp: new Date(),
      }]);
    }, 1000 + Math.random() * 2000);
  }

  function handleTyping() {
    // Simulate typing indicator
    setStrangerTyping(true);
    setTimeout(() => setStrangerTyping(false), 3000);
  }

  // Loading states
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
        <div className="text-center text-white">
          <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Your Chat Experience</h2>
          <p className="text-purple-200">Preparing something amazing...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold mb-2">Authentication Required</h2>
          <p className="text-red-100">Please sign in to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-lg border transform transition-all duration-500 ease-out ${
          showToast.type === "error" 
            ? "bg-red-500/90 border-red-400 text-white" 
            : showToast.type === "success"
            ? "bg-green-500/90 border-green-400 text-white"
            : "bg-blue-500/90 border-blue-400 text-white"
        } animate-bounce`}>
          <div className="flex items-center gap-3">
            <div className="text-xl">
              {showToast.type === "error" ? "⚠️" : showToast.type === "success" ? "✅" : "ℹ️"}
            </div>
            <p className="font-semibold">{showToast.message}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`relative z-10 h-screen flex ${
        isMobile ? "flex-col" : "flex-row"
      } p-4 gap-4`}>
        
        {/* Video Section */}
        {showVideo && (
          <div className={`${
            isMobile ? "h-64" : isTablet ? "w-80" : "w-96"
          } bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20`}>
            <div className={`h-full flex ${
              isMobile ? "flex-row" : "flex-col"
            } gap-4`}>
              {/* Local Video */}
              <div className="flex-1">
                <div className="text-white/70 text-sm mb-2 font-semibold">📹 You</div>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover rounded-2xl bg-black/50 shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Remote Video */}
              <div className="flex-1">
                <div className="text-white/70 text-sm mb-2 font-semibold">🌟 Stranger</div>
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover rounded-2xl bg-black/50 shadow-lg transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
          {/* Status Bar */}
          <div className={`px-6 py-4 ${
            isConnected 
              ? "bg-gradient-to-r from-green-500/80 to-emerald-500/80" 
              : "bg-gradient-to-r from-blue-500/80 to-indigo-500/80"
          } text-white backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-300 animate-pulse" : "bg-blue-300 animate-pulse"
              }`}></div>
              <span className="font-semibold">{statusMessage}</span>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 ${
                      msg.sender === "you"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg"
                        : "bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-bl-lg"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {msg.sender === "you" ? "You" : "Stranger"} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                </div>
              ))}
              
              {strangerTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-lg border border-white/30">
                    <div className="flex items-center gap-2 text-white/70">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-200"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce animation-delay-400"></div>
                      </div>
                      <span className="text-sm">Stranger is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-6 bg-white/5 backdrop-blur-sm">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isConnected ? "Type your message... ✨" : "Connect to start chatting"}
                disabled={!isConnected}
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !messageInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isMobile ? "📤" : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className={`${
          isMobile ? "h-auto" : isTablet ? "w-80" : "w-96"
        } space-y-4`}>
          
          {/* Plan Info Card */}
          {userPlan && (
            <div className={`p-6 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 ${
              userPlan.planStatus.isActive 
                ? "bg-gradient-to-br from-green-500/20 to-emerald-600/20" 
                : "bg-white/10"
            }`}>
              <div className="text-center">
                <div className="text-3xl mb-3">
                  {userPlan.planStatus.isActive ? "💎" : "🆓"}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                  {userPlan.planStatus.planName}
                </h3>
                <p className="text-white/70 text-sm mb-2">
                  🏫 {userPlan.user.college}
                </p>
                {userPlan.planStatus.daysRemaining && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 text-xs font-semibold">
                    ⏰ {userPlan.planStatus.daysRemaining} days remaining
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matching Options */}
          {userPlan && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
              <h4 className="text-white font-bold text-lg mb-4 text-center">
                🎯 Choose Your Match
              </h4>
              
              <div className="space-y-3">
                {userPlan.matchingOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleOptionSelect(option.type, option)}
                    disabled={option.disabled}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 transform hover:scale-105 ${
                      selectedMatchingOption === option.type
                        ? "bg-gradient-to-r from-blue-500/40 to-purple-600/40 border-blue-400 shadow-lg"
                        : option.disabled
                        ? "bg-white/5 border-white/20 opacity-50 cursor-not-allowed hover:scale-100"
                        : "bg-white/10 border-white/30 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          {option.label}
                        </div>
                        <div className="text-white/70 text-xs mt-1">
                          {option.description}
                        </div>
                        {option.disabled && (
                          <div className="text-red-300 text-xs mt-2 font-semibold">
                            🔒 {option.disabledReason}
                          </div>
                        )}
                      </div>
                      {selectedMatchingOption === option.type && (
                        <div className="text-green-400 text-lg">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            {!isConnected ? (
              <button
                onClick={handleStart}
                disabled={!selectedMatchingOption}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                🚀 Start Adventure
              </button>
            ) : (
              <div className="space-y-3 mb-4">
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  ➡️ Next Person
                </button>
                <button
                  onClick={handleEnd}
                  className="w-full py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  🛑 End Chat
                </button>
              </div>
            )}

            {/* Video Toggle */}
            <label className="flex items-center justify-center gap-3 cursor-pointer p-3 bg-white/10 rounded-2xl border border-white/30 hover:bg-white/20 transition-all duration-200">
              <input
                type="checkbox"
                checked={showVideo}
                onChange={(e) => setShowVideo(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                showVideo 
                  ? "bg-green-500 border-green-400" 
                  : "bg-transparent border-white/50"
              }`}>
                {showVideo && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <span className="text-white font-semibold">
                {showVideo ? "📹 Video ON" : "💬 Text Only"}
              </span>
            </label>
          </div>

          {/* Info Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 text-center">
              ✨ How It Works
            </h3>
            
            <div className="space-y-3 text-white/80 text-sm">
              <div className="flex items-start gap-3">
                <div className="text-lg">🎯</div>
                <p>Choose your perfect matching preference</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-lg">🚀</div>
                <p>Click "Start Adventure" to find someone</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-lg">💬</div>
                <p>Chat via text or enable video calling</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-lg">🔄</div>
                <p>Use "Next" to meet new people anytime</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-lg">🛡️</div>
                <p>Stay safe, be respectful, have fun!</p>
              </div>
            </div>

            {/* Premium Features Highlight */}
            {userPlan?.user.hasActivePlan && userPlan.user.planType !== "free" && (
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl border border-yellow-400/30">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <p className="text-yellow-200 text-sm font-semibold">
                    Premium Active!
                  </p>
                  <p className="text-yellow-200/80 text-xs mt-1">
                    {userPlan.user.planType === "gender" && "Gender filtering + Global matching unlocked!"}
                    {userPlan.user.planType === "intercollege" && "Global college matching unlocked!"}
                  </p>
                </div>
              </div>
            )}

            {/* Upgrade CTA for Free Users */}
            {(!userPlan?.user.hasActivePlan || userPlan.user.planType === "free") && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-purple-400/30">
                <div className="text-center">
                  <div className="text-2xl mb-2">💎</div>
                  <p className="text-purple-200 text-sm font-semibold">
                    Want More Connections?
                  </p>
                  <p className="text-purple-200/80 text-xs mt-1">
                    Upgrade for global matching & gender filters!
                  </p>
                  <button className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-semibold transform hover:scale-105 transition-all duration-200">
                    🚀 Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Card (Optional) */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 text-center">
              📊 Your Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-2xl">
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-white/70 text-xs">Connections</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-2xl">
                <div className="text-2xl font-bold text-white">4.8</div>
                <div className="text-white/70 text-xs">Rating ⭐</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-2xl">
                <div className="text-2xl font-bold text-white">2.1k</div>
                <div className="text-white/70 text-xs">Messages</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-2xl">
                <div className="text-2xl font-bold text-white">45m</div>
                <div className="text-white/70 text-xs">Chat Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setShowVideo(!showVideo)}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl transform hover:scale-110 transition-all duration-200"
          >
            {showVideo ? "📹" : "💬"}
          </button>
        </div>
      )}

      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-track-transparent {
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }

        .scrollbar-thumb-white\/20 {
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .scrollbar-thumb-white\/30:hover {
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }

        /* WebKit scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Hide scrollbar track on mobile */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 3px;
          }
        }

        /* Smooth scroll behavior */
        .scroll-smooth {
          scroll-behavior: smooth;
        }

        /* Custom glassmorphism effects */
        .backdrop-blur-xl {
          backdrop-filter: blur(20px);
        }

        /* Enhanced shadow effects */
        .shadow-glow {
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(45deg, #60a5fa, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Custom button hover effects */
        .btn-hover-glow:hover {
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.6);
        }

        /* Pulsing animation for connection status */
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
          }
        }
      `}</style>
    </div>
  );
}