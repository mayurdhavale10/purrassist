"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
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
  requiresGender?: string;
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

// Keep TURN/STUN as you haddd
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

  // Plan-related
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [selectedMatchingOption, setSelectedMatchingOption] = useState<string>("");

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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch user plan");

      const planData: UserPlan = await res.json();
      setUserPlan(planData);

      // Auto-select the first option (covers free plan with a single option)
      if (planData.matchingOptions?.length > 0) {
        setSelectedMatchingOption(planData.matchingOptions[0].type);
      }

      setStatusMessage("Ready to start! Choose your matching preference.");
    } catch (e) {
      console.error(e);
      setStatusMessage("Failed to load user data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // Camera lifecycle
  useEffect(() => {
    if (showVideo) initializeCamera();
    else stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Socket setup (connect once we have plan + email)
  useEffect(() => {
    if (!userPlan || !session?.user?.email) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatusMessage("Connected. Choose preference and click 'Start'...");
      // Ensure we register as soon as socket is ready
      if (!hasEmittedRegister) {
        socket.emit("registerUser", { email: session.user!.email! });
        setHasEmittedRegister(true);
      }
    });

    socket.on("registrationSuccess", () => {
      setIsRegistered(true);
      setStatusMessage("Ready to start! Choose your matching preference.");
      // If user already clicked start before registration finished, run it now
      if (pendingStart && selectedMatchingOption) {
        socket.emit("findPartner", {
          email: session.user!.email!,
          matchingPreference: selectedMatchingOption,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Start flow: If not registered yet, queue the start
  function handleStart() {
    if (!selectedMatchingOption || !session?.user?.email) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setStatusMessage("Connecting… please wait a moment.");
      setPendingStart(true);
      return;
    }

    if (!isRegistered) {
      // ensure we've sent register request at least once
      if (!hasEmittedRegister) {
        socket.emit("registerUser", { email: session.user.email });
        setHasEmittedRegister(true);
      }
      setPendingStart(true);
      setStatusMessage("Registering… we’ll start as soon as that’s done.");
      return;
    }

    // registered → go
    socket.emit("findPartner", { email: session.user.email, matchingPreference: selectedMatchingOption });
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
  }

  function handleTyping() {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit("typing", { target: partnerId, isTyping: true });
    setTimeout(() => socketRef.current?.emit("typing", { target: partnerId, isTyping: false }), 2000);
  }

  // Loading & unauthenticated
  if (loading || status === "loading") {
    return (
      <div style={centeredPage}>Loading...</div>
    );
  }
  if (status === "unauthenticated") {
    return (
      <div style={centeredPage}>Please sign in to use the chat</div>
    );
  }

  // Styles (unchanged aside from reuse)
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "Arial, sans-serif",
  };
  const mainContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    height: isMobile ? "auto" : "calc(100vh - 20px)",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: isMobile ? "10px" : "20px",
    gap: isMobile ? "15px" : "20px",
  };
  const videoSectionStyle: React.CSSProperties = {
    flex: isMobile ? "none" : "0 0 400px",
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: showVideo ? "block" : "none",
  };
  const videoContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    gap: "15px",
  };
  const videoWrapperStyle: React.CSSProperties = { flex: isMobile ? "1" : "none" };
  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: isMobile ? "150px" : "200px",
    background: "#000",
    borderRadius: "10px",
    objectFit: "cover",
  };
  const chatSectionStyle: React.CSSProperties = {
    flex: 1,
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    minHeight: isMobile ? "400px" : "auto",
  };
  const controlsSectionStyle: React.CSSProperties = {
    flex: isMobile ? "none" : "0 0 280px",
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    gap: "15px",
  };
  const controlsCardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    flex: isMobile ? "1" : "none",
  };

  const onlyOneOption = userPlan?.matchingOptions?.length === 1;

  return (
    <div style={containerStyle}>
      <div style={mainContainerStyle}>
        {/* Video Section */}
        {showVideo && (
          <div style={videoSectionStyle}>
            <div style={videoContainerStyle}>
              <div style={videoWrapperStyle}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>You</div>
                <video ref={localVideoRef} autoPlay muted playsInline style={videoStyle} />
              </div>
              <div style={videoWrapperStyle}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>Stranger</div>
                <video ref={remoteVideoRef} autoPlay playsInline style={videoStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div style={chatSectionStyle}>
          {/* Status */}
          <div
            style={{
              background: isConnected ? "#10b981" : "#6b7280",
              color: "white",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "15px",
              fontSize: isMobile ? "12px" : "14px",
              fontWeight: "500",
            }}
          >
            {statusMessage}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              padding: "15px",
              background: "#f9fafb",
              overflowY: "auto",
              marginBottom: "15px",
              minHeight: isMobile ? "200px" : "300px",
              maxHeight: isMobile ? "300px" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "you" ? "flex-end" : "flex-start",
                  marginBottom: "0",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: msg.sender === "you" ? "#3b82f6" : "#e5e7eb",
                  color: msg.sender === "you" ? "white" : "#374151",
                  maxWidth: "80%",
                  wordWrap: "break-word",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                <div style={{ fontSize: "10px", opacity: 0.7, marginBottom: "2px" }}>
                  {msg.sender === "you" ? "You" : "Stranger"}
                </div>
                {msg.text}
              </div>
            ))}
            {strangerTyping && (
              <div style={{ color: "#6b7280", fontSize: "12px", fontStyle: "italic", padding: "8px 12px" }}>
                Stranger is typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
                background: isConnected ? "white" : "#f3f4f6",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !messageInput.trim()}
              style={{
                padding: "12px 20px",
                background: isConnected && messageInput.trim() ? "#3b82f6" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: isConnected && messageInput.trim() ? "pointer" : "not-allowed",
                fontWeight: "500",
                minWidth: isMobile ? "auto" : "80px",
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={controlsSectionStyle}>
          {/* Plan Info */}
          {userPlan && (
            <div
              style={{
                ...controlsCardStyle,
                background: userPlan.planStatus.isActive ? "linear-gradient(45deg, #10b981, #059669)" : "#f3f4f6",
                color: userPlan.planStatus.isActive ? "white" : "#374151",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: isMobile ? "14px" : "16px" }}>
                {userPlan.planStatus.planName}
              </h3>
              <p style={{ margin: "0 0 5px", fontSize: "12px", opacity: 0.8 }}>
                College: {userPlan.user.college}
              </p>
              {userPlan.planStatus.daysRemaining !== undefined &&
                userPlan.planStatus.daysRemaining !== null && (
                  <p style={{ margin: "0", fontSize: "12px", opacity: 0.8 }}>
                    {userPlan.planStatus.daysRemaining} days remaining
                  </p>
                )}
            </div>
          )}

          {/* Matching Options */}
          {userPlan && (
            <div style={controlsCardStyle}>
              <h4 style={{ margin: "0 0 10px", fontSize: isMobile ? "12px" : "14px", color: "#374151" }}>
                Matching Preference
              </h4>

              {/* If only one option (free plan), render it as a pill (non-radio) and it's already selected */}
              {onlyOneOption ? (
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#e0e7ff",
                    fontSize: "12px",
                  }}
                >
                  <strong>{userPlan.matchingOptions[0].icon} {userPlan.matchingOptions[0].label}</strong>
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                    {userPlan.matchingOptions[0].description}
                  </div>
                </div>
              ) : (
                userPlan.matchingOptions.map((option) => (
                  <label
                    key={option.type}
                    style={{
                      display: "block",
                      padding: "8px",
                      margin: "5px 0",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      background: selectedMatchingOption === option.type ? "#e0e7ff" : "white",
                    }}
                  >
                    <input
                      type="radio"
                      name="matchingOption"
                      value={option.type}
                      checked={selectedMatchingOption === option.type}
                      onChange={(e) => setSelectedMatchingOption(e.target.value)}
                      style={{ marginRight: "8px" }}
                    />
                    <span style={{ fontWeight: "500" }}>
                      {option.icon} {option.label}
                    </span>
                    <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                      {option.description}
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={controlsCardStyle}>
            {!isConnected ? (
              <button
                onClick={handleStart}
                // ⬇️ Enable Start as long as we have a selected option; registration will be queued if not ready
                disabled={!selectedMatchingOption}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "bold",
                  cursor: selectedMatchingOption ? "pointer" : "not-allowed",
                  marginBottom: "10px",
                  background: selectedMatchingOption
                    ? "linear-gradient(45deg, #10b981, #059669)"
                    : "#9ca3af",
                  color: "white",
                }}
              >
                🚀 Start Chatting
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={handleNext}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    background: "linear-gradient(45deg, #ef4444, #dc2626)",
                    color: "white",
                  }}
                >
                  ➡️ Next
                </button>
                <button
                  onClick={handleEnd}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    background: "linear-gradient(45deg, #6b7280, #4b5563)",
                    color: "white",
                  }}
                >
                  🛑 End Chat
                </button>
              </div>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: isMobile ? "12px" : "14px",
                marginTop: "15px",
              }}
            >
              <input
                type="checkbox"
                checked={showVideo}
                onChange={(e) => setShowVideo(e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
              <span style={{ color: "#374151" }}>Enable Video Chat</span>
            </label>
          </div>

          {/* Info Panel */}
          {(!isMobile || !showVideo) && (
            <div style={{ ...controlsCardStyle, fontSize: "12px", color: "#6b7280", lineHeight: "1.5" }}>
              <h3 style={{ margin: "0 0 10px", color: "#374151", fontSize: isMobile ? "12px" : "14px" }}>
                How it works:
              </h3>
              <p>• Choose your matching preference</p>
              <p>• Click "Start" to find someone</p>
              <p>• Chat via text or enable video</p>
              <p>• Use "Next" to find a new person</p>
              <p>• Click "End" to stop completely</p>
              <p>• Be respectful and have fun! 🎉</p>

              {userPlan?.planStatus.isActive && userPlan.planStatus.planName !== "Free Plan" && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    background: "#f0f9ff",
                    borderRadius: "6px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <p style={{ margin: "0", color: "#0369a1", fontSize: "11px" }}>
                    🎉 You have {userPlan.planStatus.planName}!
                    {userPlan.user.planType === "gender" && " Filter by gender in your college."}
                    {userPlan.user.planType === "intercollege" && " Match with any college & filter by gender!"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Small shared style */
const centeredPage: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  fontSize: "18px",
};
