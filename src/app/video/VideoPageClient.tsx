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

  // Refss
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const candidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [isTyping, setIsTyping] = useState(false);

  // Plan-related
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [selectedMatchingOption, setSelectedMatchingOption] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("any");
  const [showToast, setShowToast] = useState<{ message: string; type: "error" | "info" } | null>(null);

  // Registration / lifecycle helpers
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasEmittedRegister, setHasEmittedRegister] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [loading, setLoading] = useState(true);

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll chat only when new messages arrive, not when typing
  useEffect(() => {
    if (!isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000);
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
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch user plan");

      const planData: UserPlan = await res.json();
      setUserPlan(planData);

      // Generate matching options based on plan
      const matchingOptions = generateMatchingOptions(planData);
      setUserPlan({ ...planData, matchingOptions });

      // Auto-select the first enabled option
      const firstEnabled = matchingOptions.find(opt => !opt.disabled);
      if (firstEnabled) {
        setSelectedMatchingOption(firstEnabled.type);
      }

      setStatusMessage("Ready to start! Choose your matching preference.");
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to load user data. Please refresh.");
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
        label: "Same College (Anyone)",
        description: "Match with anyone from your college",
        icon: "🏫",
        disabled: false,
      },
    ];

    // Inter-college options
    const interCollegeOption: MatchingOption = {
      type: "inter_any",
      label: "Inter College (Anyone)",
      description: "Match with anyone from any college",
      icon: "🌍",
      disabled: activePlan === "free",
      disabledReason: activePlan === "free" ? "Upgrade to Inter-College or Gender plan" : undefined,
    };
    options.push(interCollegeOption);

    // Gender-specific options (only for gender plan)
    if (activePlan === "gender") {
      options.push(
        {
          type: "same_male",
          label: "Same College (Males)",
          description: "Match with males from your college",
          icon: "🏫👨",
          requiresGender: true,
        },
        {
          type: "same_female",
          label: "Same College (Females)",
          description: "Match with females from your college",
          icon: "🏫👩",
          requiresGender: true,
        },
        {
          type: "inter_male",
          label: "Inter College (Males)",
          description: "Match with males from any college",
          icon: "🌍👨",
          requiresGender: true,
        },
        {
          type: "inter_female",
          label: "Inter College (Females)",
          description: "Match with females from any college",
          icon: "🌍👩",
          requiresGender: true,
        }
      );
    } else {
      // Show disabled gender options for other plans
      options.push(
        {
          type: "same_male",
          label: "Same College (Males)",
          description: "Match with males from your college",
          icon: "🏫👨",
          disabled: true,
          disabledReason: "Upgrade to Gender plan",
          requiresGender: true,
        },
        {
          type: "same_female",
          label: "Same College (Females)",
          description: "Match with females from your college",
          icon: "🏫👩",
          disabled: true,
          disabledReason: "Upgrade to Gender plan",
          requiresGender: true,
        },
        {
          type: "inter_male",
          label: "Inter College (Males)",
          description: "Match with males from any college",
          icon: "🌍👨",
          disabled: true,
          disabledReason: "Upgrade to Gender plan",
          requiresGender: true,
        },
        {
          type: "inter_female",
          label: "Inter College (Females)",
          description: "Match with females from any college",
          icon: "🌍👩",
          disabled: true,
          disabledReason: "Upgrade to Gender plan",
          requiresGender: true,
        }
      );
    }

    return options;
  };

  // Camera lifecycle
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
        video: { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, facingMode: "user" },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Fix mirror effect - show original image
        localVideoRef.current.style.transform = "scaleX(1)";
        localVideoRef.current.play().catch(() => {});
      }
      setStatusMessage("Camera ready. Choose your matching preference and click 'Start'...");
    } catch (err) {
      console.error("Camera error:", err);
      setStatusMessage("Camera permission required. You can still use text chat.");
      setShowVideo(false);
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  // Socket setup
  useEffect(() => {
    if (!userPlan || !session?.user?.email) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatusMessage("Connected. Choose preference and click 'Start'...");
      if (!hasEmittedRegister) {
        socket.emit("registerUser", { email: session.user!.email! });
        setHasEmittedRegister(true);
      }
    });

    socket.on("registrationSuccess", () => {
      setIsRegistered(true);
      setStatusMessage("Ready to start! Choose your matching preference.");
      if (pendingStart && selectedMatchingOption) {
        const genderFilter = selectedMatchingOption.includes("_male") ? "male" :
                           selectedMatchingOption.includes("_female") ? "female" : "any";
        socket.emit("findPartner", {
          email: session.user!.email!,
          matchingPreference: selectedMatchingOption,
          preferredGender: genderFilter !== "any" ? genderFilter : undefined,
        });
        setPendingStart(false);
        setStatusMessage("Looking for someone you can chat with...");
      }
    });

    socket.on("registrationFailed", () => {
      setIsRegistered(false);
      setStatusMessage("Registration failed. Please refresh the page.");
    });

    socket.on("searching", () => {
      setStatusMessage("Looking for someone you can chat with...");
      setIsConnected(false);
      setMessages([]);
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    });

    socket.on("matchFound", async ({ partnerId: pid, role }: { partnerId: string; role: Role }) => {
      setPartnerId(pid);
      setRole(role);
      setStatusMessage("You're now chatting with a random stranger. Say hi!");
      setIsConnected(true);
      setMessages([
        {
          id: Date.now().toString(),
          text: "You're now chatting with a random stranger. Say hi!",
          sender: "stranger",
          timestamp: new Date(),
        },
      ]);

      if (showVideo && localStreamRef.current) {
        await startPeer(pid, role);
      }
    });

    socket.on("chatMessage", ({ message, sender }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: message,
          sender: sender === socket.id ? "you" : "stranger",
          timestamp: new Date(),
        },
      ]);
    });

    socket.on("strangerTyping", ({ isTyping }) => setStrangerTyping(isTyping));

    socket.on("offer", async ({ sdp, caller }) => {
      setPartnerId(caller);
      setRole("answerer");
      if (!pcRef.current && showVideo) await startPeer(caller, "answerer");
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await drainCandidateBuffer();
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("answer", { sdp: answer, target: caller });
      }
    });

    socket.on("answer", async ({ sdp }) => {
      if (pcRef.current?.signalingState === "have-local-offer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await drainCandidateBuffer();
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!pcRef.current) return;
      if (!pcRef.current.remoteDescription) {
        candidateBufferRef.current.push(candidate);
      } else {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("partner-left", () => {
      setStatusMessage("Stranger has disconnected.");
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Stranger has disconnected.", sender: "stranger", timestamp: new Date() },
      ]);
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      teardownPeer();
      stopCamera();
      setIsRegistered(false);
      setHasEmittedRegister(false);
      setPendingStart(false);
    };
  }, [userPlan, session, selectedMatchingOption, showVideo]);

  // WebRTC helpers
  async function startPeer(partner: string, myRole: Role) {
    if (!localStreamRef.current || !showVideo) return;
    if (pcRef.current) pcRef.current.close();

    pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStreamRef.current.getTracks().forEach((t) => {
      if (pcRef.current && localStreamRef.current) pcRef.current.addTrack(t, localStreamRef.current);
    });

    pcRef.current.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { candidate: e.candidate.toJSON(), target: partner });
      }
    };

    if (myRole === "initiator") {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current!.emit("offer", { sdp: offer, target: partner });
    }
  }

  function teardownPeer() {
    candidateBufferRef.current = [];
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  async function drainCandidateBuffer() {
    if (!pcRef.current) return;
    for (const c of candidateBufferRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
    }
    candidateBufferRef.current = [];
  }

  // Handle option selection
  function handleOptionSelect(optionType: string, option: MatchingOption) {
    if (option.disabled) {
      setShowToast({
        message: option.disabledReason || "This feature is not available in your current plan",
        type: "error"
      });
      return;
    }
    setSelectedMatchingOption(optionType);
  }

  // Start flow
  function handleStart() {
    if (!selectedMatchingOption || !session?.user?.email) return;

    const selectedOption = userPlan?.matchingOptions.find(opt => opt.type === selectedMatchingOption);
    if (selectedOption?.disabled) {
      setShowToast({
        message: selectedOption.disabledReason || "This feature is not available in your current plan",
        type: "error"
      });
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setStatusMessage("Connecting… please wait a moment.");
      setPendingStart(true);
      return;
    }

    if (!isRegistered) {
      if (!hasEmittedRegister) {
        socket.emit("registerUser", { email: session.user.email });
        setHasEmittedRegister(true);
      }
      setPendingStart(true);
      setStatusMessage("Registering… we'll start as soon as that's done.");
      return;
    }

    const genderFilter = selectedMatchingOption.includes("_male") ? "male" :
                        selectedMatchingOption.includes("_female") ? "female" : "any";

    socket.emit("findPartner", { 
      email: session.user.email, 
      matchingPreference: selectedMatchingOption,
      preferredGender: genderFilter !== "any" ? genderFilter : undefined,
    });
    setStatusMessage("Looking for someone you can chat with...");
  }

  function handleNext() {
    if (!socketRef.current) return;
    socketRef.current.emit("skip");
    setStatusMessage("Looking for a new person to chat with...");
    setIsConnected(false);
    setMessages([]);
    teardownPeer();
    setPartnerId(null);
    setRole(null);
  }

  function handleEnd() {
    if (!socketRef.current) return;
    socketRef.current.emit("leave");
    setStatusMessage("Disconnected. Choose your preference and click 'Start' to begin again.");
    setIsConnected(false);
    setMessages([]);
    teardownPeer();
    setPartnerId(null);
    setRole(null);
  }

  function handleSendMessage() {
    if (!messageInput.trim() || !isConnected || !socketRef.current) return;
    const message = { id: Date.now().toString(), text: messageInput, sender: "you" as const, timestamp: new Date() };
    setMessages((prev) => [...prev, message]);
    socketRef.current.emit("chatMessage", { message: messageInput, target: partnerId });
    setMessageInput("");
    setIsTyping(false);
  }

  function handleTyping() {
    if (!socketRef.current || !isConnected) return;
    setIsTyping(true);
    socketRef.current.emit("typing", { target: partnerId, isTyping: true });
    
    // Stop typing indicator after 2 seconds
    setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("typing", { target: partnerId, isTyping: false });
    }, 2000);
  }

  // Loading & unauthenticated
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
          <p className="text-white text-xl font-light">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
          <p className="text-white text-xl font-light">Please sign in to use the chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite alternate`
            }}
          />
        ))}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl backdrop-blur-lg shadow-2xl transform transition-all duration-300 ${
          showToast.type === "error" 
            ? "bg-red-500/90 text-white border border-red-400/50" 
            : "bg-blue-500/90 text-white border border-blue-400/50"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{showToast.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span className="font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`relative z-10 ${isMobile ? "p-4 space-y-4" : "p-6 min-h-screen flex gap-6"} max-w-7xl mx-auto`}>
        
        {/* Video Section */}
        {showVideo && (
          <div className={`${isMobile ? "order-2" : "flex-none w-96"} bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl`}>
            <div className={`${isMobile ? "flex gap-4" : "space-y-4"}`}>
              {/* Local Video */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">You</span>
                </div>
                <div className="relative group">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className={`w-full ${isMobile ? "h-32" : "h-48"} bg-gray-900 rounded-xl object-cover transition-all duration-300 group-hover:scale-105`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none"></div>
                </div>
              </div>
              
              {/* Remote Video */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-sm font-medium">Stranger</span>
                </div>
                <div className="relative group">
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline
                    className={`w-full ${isMobile ? "h-32" : "h-48"} bg-gray-900 rounded-xl object-cover transition-all duration-300 group-hover:scale-105`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className={`${isMobile ? "order-1" : "flex-1"} bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl flex flex-col ${isMobile ? "min-h-[500px]" : "min-h-[600px]"}`}>
          {/* Status Header */}
          <div className={`p-4 border-b border-white/20`}>
            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
              isConnected 
                ? "bg-green-500/20 border border-green-400/30" 
                : "bg-orange-500/20 border border-orange-400/30"
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? "bg-green-400" : "bg-orange-400"}`}></div>
              <span className="text-white font-medium text-sm">{statusMessage}</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ minHeight: isMobile ? "300px" : "400px" }}>
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                  msg.sender === "you"
                    ? "bg-blue-500/90 text-white border-blue-400/50 rounded-br-md"
                    : "bg-white/20 text-white border-white/30 rounded-bl-md"
                }`}>
                  <div className="text-xs opacity-70 mb-1">
                    {msg.sender === "you" ? "You" : "Stranger"}
                  </div>
                  <div className="text-sm leading-relaxed">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {strangerTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-sm">Stranger is typing</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/20">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  if (e.target.value && !isTyping) {
                    handleTyping();
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
                disabled={!isConnected}
                className="flex-1 p-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-blue-400/50 focus:bg-white/20 transition-all duration-300"
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !messageInput.trim()}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  isConnected && messageInput.trim()
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="mr-1">✈️</span>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className={`${isMobile ? "order-3 space-y-4" : "flex-none w-80 space-y-4 overflow-y-auto max-h-screen"}`}>
          
          {/* Plan Info Card */}
          {userPlan && (
            <div className={`p-6 rounded-2xl border shadow-2xl transition-all duration-300 hover:scale-105 ${
              userPlan.planStatus.isActive 
                ? "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 border-emerald-400/50" 
                : "bg-white/10 backdrop-blur-lg border-white/20"
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${userPlan.planStatus.isActive ? "bg-white/20" : "bg-purple-500/20"}`}>
                  <span className="text-xl">{userPlan.planStatus.isActive ? "💎" : "🆓"}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">{userPlan.planStatus.planName}</h3>
                  <p className="text-white/70 text-sm">{userPlan.user.college}</p>
                </div>
              </div>
              
              {userPlan.planStatus.daysRemaining !== undefined && userPlan.planStatus.daysRemaining !== null && (
                <div className="bg-white/10 rounded-lg p-2 mt-3">
                  <p className="text-white/80 text-xs text-center">
                    <span className="font-medium">{userPlan.planStatus.daysRemaining}</span> days remaining
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Matching Preferences */}
          {userPlan && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
              <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Matching Preferences
              </h4>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {userPlan.matchingOptions.map((option) => (
                  <label
                    key={option.type}
                    className={`block p-2.5 rounded-lg border cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      option.disabled 
                        ? "bg-gray-500/20 border-gray-400/30 cursor-not-allowed opacity-60" 
                        : selectedMatchingOption === option.type 
                          ? "bg-blue-500/30 border-blue-400/50 shadow-lg" 
                          : "bg-white/5 border-white/20 hover:bg-white/10"
                    }`}
                    onClick={() => handleOptionSelect(option.type, option)}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="matchingOption"
                        value={option.type}
                        checked={selectedMatchingOption === option.type}
                        disabled={option.disabled}
                        onChange={() => {}}
                        className="mt-0.5 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 w-3 h-3"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-base">{option.icon}</span>
                          <span className="text-white font-medium text-xs leading-tight">{option.label}</span>
                        </div>
                        <p className="text-white/70 text-xs leading-relaxed">{option.description}</p>
                        
                        {option.disabled && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-red-400 text-xs">🔒</span>
                            <span className="text-red-400 text-xs font-medium">{option.disabledReason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Plan Features Summary */}
              <div className="mt-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                <div className="text-white/80 text-xs font-medium mb-1.5">Your Plan Features:</div>
                <div className="text-white/60 text-xs leading-relaxed">
                  {userPlan.user.planType === "free" && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Same college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-red-400">❌</span> Inter-college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-red-400">❌</span> Gender filtering</div>
                    </div>
                  )}
                  {userPlan.user.planType === "intercollege" && userPlan.user.hasActivePlan && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Same college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Inter-college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-red-400">❌</span> Gender filtering</div>
                    </div>
                  )}
                  {userPlan.user.planType === "gender" && userPlan.user.hasActivePlan && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Same college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Inter-college matching</div>
                      <div className="flex items-center gap-1.5"><span className="text-green-400">✅</span> Gender filtering <span className="text-purple-400 text-xs">(Premium!)</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
            {!isConnected ? (
              <button
                onClick={handleStart}
                disabled={!selectedMatchingOption}
                className={`w-full p-3 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 ${
                  selectedMatchingOption
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                }`}
              >
                <span className="mr-2 text-lg">🚀</span>
                Start Chatting
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  onClick={handleNext}
                  className="w-full p-3 rounded-xl font-bold text-base bg-gradient-to-r from-orange-500 to-red-600 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2 text-lg">⏭️</span>
                  Next Person
                </button>
                <button
                  onClick={handleEnd}
                  className="w-full p-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="mr-2">🛑</span>
                  End Chat
                </button>
              </div>
            )}

            {/* Video Toggle */}
            <label className="flex items-center gap-2.5 mt-3 p-2.5 rounded-xl bg-white/5 border border-white/20 cursor-pointer transition-all duration-300 hover:bg-white/10">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showVideo}
                  onChange={(e) => setShowVideo(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-all duration-300 ${showVideo ? "bg-blue-500" : "bg-gray-600"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${showVideo ? "translate-x-5" : "translate-x-0.5"} mt-0.5`}></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">📹</span>
                <span className="text-white font-medium text-sm">Enable Video Chat</span>
              </div>
            </label>
          </div>

          {/* Info Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
            <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              How it works
            </h3>
            
            <div className="space-y-1.5 text-white/80 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400">•</span>
                <span>Choose your matching preference</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-400">•</span>
                <span>Click "Start" to find someone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-400">•</span>
                <span>Chat via text or enable video</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-orange-400">•</span>
                <span>Use "Next" to find a new person</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-400">•</span>
                <span>Click "End" to stop completely</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30">
              <p className="text-white/90 text-xs text-center font-medium">
                <span className="text-base mr-1">🎉</span>
                Be respectful and have fun!
              </p>
            </div>

            {/* Plan-specific messages */}
            {userPlan?.planStatus.isActive && userPlan.planStatus.planName !== "Free Plan" && (
              <div className="mt-3 p-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-400/30">
                <p className="text-white/90 text-xs text-center">
                  <span className="text-base mr-1">💎</span>
                  You have {userPlan.planStatus.planName}!
                  {userPlan.user.planType === "gender" && " Filter by gender in your college and inter-college!"}
                  {userPlan.user.planType === "intercollege" && " Match with any college!"}
                </p>
              </div>
            )}

            {(!userPlan?.user.hasActivePlan || userPlan.user.planType === "free") && (
              <div className="mt-3 p-2.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-400/30">
                <p className="text-white/90 text-xs text-center">
                  <span className="text-base mr-1">⭐</span>
                  Want more options? Upgrade to unlock inter-college matching and gender filtering!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        /* Prevent scroll when typing */
        .chat-container {
          scroll-behavior: smooth;
        }
        
        /* Video mirror fix */
        video {
          transform: scaleX(1) !important;
        }
        
        /* Glassmorphism effect */
        .backdrop-blur-lg {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        
        /* Enhanced hover effects */
        .transform {
          transition: transform 0.2s ease-in-out;
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        /* Gradient animations */
        .bg-gradient-to-br {
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}