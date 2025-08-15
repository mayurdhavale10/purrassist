"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Role = "initiator" | "answerer";
type Message = {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: Date;
};

const SOCKET_URL = "https://9dca788ac8cc.ngrok-free.app";

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:196.240.60.197:3478",
    username: "freeuser",
    credential: "freepassword",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export default function VideoPageClient() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const candidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [status, setStatus] = useState("Initializing...");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get camera with improved error handling
  useEffect(() => {
    if (showVideo) {
      initializeCamera();
    } else {
      stopCamera();
    }
  }, [showVideo]);

  const initializeCamera = async () => {
    try {
      // Stop existing stream if any
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user" // Front camera on mobile
        }, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      
      // Set local video immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Ensure video plays
        localVideoRef.current.play().catch(e => console.log("Video play failed:", e));
      }
      
      setStatus("Camera ready. Click 'Start' to find a stranger...");
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("Camera permission required. You can still use text chat.");
      setShowVideo(false);
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected to server. Click 'Start' to find a stranger...");
    });

    socket.on("searching", () => {
      setStatus("Looking for someone you can chat with...");
      setIsConnected(false);
      setMessages([]);
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    });

    socket.on("matchFound", async ({ partnerId: pid, role }: { partnerId: string; role: Role }) => {
      setPartnerId(pid);
      setRole(role);
      setStatus("You're now chatting with a random stranger. Say hi!");
      setIsConnected(true);
      setMessages([{
        id: Date.now().toString(),
        text: "You're now chatting with a random stranger. Say hi!",
        sender: "stranger",
        timestamp: new Date()
      }]);
      
      if (showVideo && localStreamRef.current) {
        await startPeer(pid, role);
      }
    });

    // Chat message handling
    socket.on("chatMessage", ({ message, sender }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: message,
        sender: sender === socket.id ? "you" : "stranger",
        timestamp: new Date()
      }]);
    });

    socket.on("strangerTyping", ({ isTyping }) => {
      setStrangerTyping(isTyping);
    });

    // WebRTC signaling
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
      setStatus("Stranger has disconnected.");
      setIsConnected(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Stranger has disconnected.",
        sender: "stranger",
        timestamp: new Date()
      }]);
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    });

    return () => {
      socket.disconnect();
      teardownPeer();
      stopCamera();
    };
  }, [showVideo]);

  // Start peer connection with improved video handling
  async function startPeer(partner: string, myRole: Role) {
    if (!localStreamRef.current || !showVideo) return;

    if (pcRef.current) {
      pcRef.current.close();
    }

    pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local stream tracks
    localStreamRef.current.getTracks().forEach((track) => {
      if (pcRef.current && localStreamRef.current) {
        pcRef.current.addTrack(track, localStreamRef.current);
      }
    });

    pcRef.current.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => console.log("Remote video play failed:", e));
      }
    };

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { candidate: event.candidate.toJSON(), target: partner });
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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }

  async function drainCandidateBuffer() {
    if (!pcRef.current) return;
    for (const c of candidateBufferRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
    }
    candidateBufferRef.current = [];
  }

  function handleStart() {
    if (socketRef.current) {
      socketRef.current.emit("findPartner");
      setStatus("Looking for someone you can chat with...");
    }
  }

  function handleNext() {
    if (socketRef.current) {
      socketRef.current.emit("skip");
      setStatus("Looking for a new person to chat with...");
      setIsConnected(false);
      setMessages([]);
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    }
  }

  function handleSendMessage() {
    if (!messageInput.trim() || !isConnected || !socketRef.current) return;
    
    const message = {
      id: Date.now().toString(),
      text: messageInput,
      sender: "you" as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    socketRef.current.emit("chatMessage", { message: messageInput, target: partnerId });
    setMessageInput("");
  }

  function handleTyping() {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", { target: partnerId, isTyping: true });
      
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit("typing", { target: partnerId, isTyping: false });
        }
      }, 2000);
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "Arial, sans-serif"
  };

  const headerStyle: React.CSSProperties = {
    background: "#fff",
    padding: isMobile ? "10px 15px" : "15px 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    borderBottom: "3px solid #4f46e5"
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: isMobile ? "20px" : "28px",
    background: "linear-gradient(45deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold"
  };

  const mainContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    height: isMobile ? "auto" : "calc(100vh - 100px)",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: isMobile ? "10px" : "20px",
    gap: isMobile ? "15px" : "20px"
  };

  const videoSectionStyle: React.CSSProperties = {
    flex: isMobile ? "none" : "0 0 400px",
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: showVideo ? "block" : "none"
  };

  const videoContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    gap: "15px"
  };

  const videoWrapperStyle: React.CSSProperties = {
    flex: isMobile ? "1" : "none"
  };

  const videoStyle: React.CSSProperties = {
    width: "100%",
    height: isMobile ? "150px" : "200px",
    background: "#000",
    borderRadius: "10px",
    objectFit: "cover"
  };

  const chatSectionStyle: React.CSSProperties = {
    flex: 1,
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    minHeight: isMobile ? "400px" : "auto"
  };

  const controlsSectionStyle: React.CSSProperties = {
    flex: isMobile ? "none" : "0 0 200px",
    display: "flex",
    flexDirection: isMobile ? "row" : "column",
    gap: "15px"
  };

  const controlsCardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "15px",
    padding: isMobile ? "15px" : "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    flex: isMobile ? "1" : "none"
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: isMobile ? "12px" : "15px",
    border: "none",
    borderRadius: "10px",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "10px"
  };

  const startButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "linear-gradient(45deg, #10b981, #059669)",
    color: "white"
  };

  const nextButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "linear-gradient(45deg, #ef4444, #dc2626)",
    color: "white"
  };

  return (
    <div style={containerStyle}>
    

      <div style={mainContainerStyle}>
        
        {/* Video Section */}
        {showVideo && (
          <div style={videoSectionStyle}>
            <div style={videoContainerStyle}>
              <div style={videoWrapperStyle}>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666", 
                  marginBottom: "5px" 
                }}>
                  You
                </div>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  style={videoStyle}
                />
              </div>
              <div style={videoWrapperStyle}>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666", 
                  marginBottom: "5px" 
                }}>
                  Stranger
                </div>
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  style={videoStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div style={chatSectionStyle}>
          {/* Status */}
          <div style={{
            background: isConnected ? "#10b981" : "#6b7280",
            color: "white",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "15px",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "500"
          }}>
            {status}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            border: "2px solid #e5e7eb",
            borderRadius: "10px",
            padding: "15px",
            background: "#f9fafb",
            overflowY: "auto",
            marginBottom: "15px",
            minHeight: isMobile ? "200px" : "300px",
            maxHeight: isMobile ? "300px" : "none"
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                marginBottom: "10px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: msg.sender === "you" ? "#3b82f6" : "#e5e7eb",
                color: msg.sender === "you" ? "white" : "#374151",
                alignSelf: msg.sender === "you" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                wordWrap: "break-word",
                fontSize: isMobile ? "14px" : "16px"
              }}>
                <div style={{ 
                  fontSize: "10px", 
                  opacity: 0.7, 
                  marginBottom: "2px" 
                }}>
                  {msg.sender === "you" ? "You" : "Stranger"}
                </div>
                {msg.text}
              </div>
            ))}
            {strangerTyping && (
              <div style={{ 
                color: "#6b7280", 
                fontSize: "12px", 
                fontStyle: "italic",
                padding: "8px 12px"
              }}>
                Stranger is typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div style={{ 
            display: "flex", 
            gap: "10px",
            flexDirection: isMobile ? "column" : "row"
          }}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
              disabled={!isConnected}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
                background: isConnected ? "white" : "#f3f4f6"
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
                minWidth: isMobile ? "auto" : "80px"
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={controlsSectionStyle}>
          
          {/* Start/Next Buttons */}
          <div style={controlsCardStyle}>
            {!isConnected ? (
              <button onClick={handleStart} style={startButtonStyle}>
                🚀 Start
              </button>
            ) : (
              <button onClick={handleNext} style={nextButtonStyle}>
                ➡️ Next
              </button>
            )}

            <label style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              fontSize: isMobile ? "12px" : "14px"
            }}>
              <input
                type="checkbox"
                checked={showVideo}
                onChange={(e) => setShowVideo(e.target.checked)}
                style={{ transform: "scale(1.2)" }}
              />
              <span style={{ color: "#374151" }}>Enable Video</span>
            </label>
          </div>

          {/* Info Panel - Hide on mobile when space is limited */}
          {(!isMobile || !showVideo) && (
            <div style={{
              ...controlsCardStyle,
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: "1.5"
            }}>
              <h3 style={{ 
                margin: "0 0 10px", 
                color: "#374151", 
                fontSize: isMobile ? "12px" : "14px" 
              }}>
                How it works:
              </h3>
              <p>• Click "Start" to find a random stranger</p>
              <p>• Chat via text or enable video</p>
              <p>• Click "Next" to find a new person</p>
              <p>• Be respectful and have fun!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}