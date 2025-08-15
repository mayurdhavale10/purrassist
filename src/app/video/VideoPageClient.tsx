"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Role = "initiator" | "answerer";
const SOCKET_URL = "https://3798aec9d38e.ngrok-free.app";

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:196.240.60.202:3478",
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
  const [status, setStatus] = useState("Initializing...");
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // Get camera
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus("Camera ready. Connecting...");
      } catch (err) {
        setStatus("Camera permission required");
        console.error(err);
      }
    })();
  }, []);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected to server — searching...");
      socket.emit("findPartner");
    });

    socket.on("searching", () => {
      setStatus("Searching for partner...");
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    });

    socket.on("matchFound", async ({ partnerId: pid, role }: { partnerId: string; role: Role }) => {
      setPartnerId(pid);
      setRole(role);
      setStatus("Partner found — connecting...");
      await startPeer(pid, role);
    });

    socket.on("offer", async ({ sdp, caller }) => {
      setPartnerId(caller);
      setRole("answerer");
      if (!pcRef.current) await startPeer(caller, "answerer");
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(sdp));
      await drainCandidateBuffer();
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      socket.emit("answer", { sdp: answer, target: caller });
      setStatus("Answer sent — connecting...");
    });

    socket.on("answer", async ({ sdp }) => {
      if (pcRef.current?.signalingState === "have-local-offer") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        await drainCandidateBuffer();
        setStatus("Connected!");
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
      setStatus("Partner disconnected — requeueing...");
      teardownPeer();
      setPartnerId(null);
      setRole(null);
      socket.emit("findPartner");
    });

    return () => {
      socket.disconnect();
      teardownPeer();
    };
  }, []);

  // Start peer connection
  async function startPeer(partner: string, myRole: Role) {
    if (!localStreamRef.current) {
      setStatus("Waiting for camera...");
      await new Promise((res) => setTimeout(res, 500));
      if (!localStreamRef.current) return;
    }

    if (pcRef.current) return;

    pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) =>
      pcRef.current!.addTrack(track, localStreamRef.current!)
    );

    // Handle remote tracks
    pcRef.current.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      setStatus("Connected!");
    };

    // Handle ICE candidates
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { candidate: event.candidate.toJSON(), target: partner });
      }
    };

    // Debug states
    pcRef.current.onconnectionstatechange = () => {
      console.log("Connection state:", pcRef.current?.connectionState);
    };
    pcRef.current.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pcRef.current?.iceConnectionState);
    };

    if (myRole === "initiator") {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current!.emit("offer", { sdp: offer, target: partner });
      setStatus("Offer sent — waiting for answer...");
    } else {
      setStatus("Waiting for partner's offer...");
    }
  }

  // Teardown peer
  function teardownPeer() {
    candidateBufferRef.current = [];
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  // Add buffered ICE candidates
  async function drainCandidateBuffer() {
    if (!pcRef.current) return;
    for (const c of candidateBufferRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
    }
    candidateBufferRef.current = [];
  }

  // Skip / Next
  function handleNext() {
    if (socketRef.current) {
      socketRef.current.emit("skip");
      setStatus("Searching for new partner...");
      teardownPeer();
      setPartnerId(null);
      setRole(null);
    }
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h1>Omegle Clone</h1>
      <p>{status}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#666" }}>You</div>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 360, background: "#000" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#666" }}>Partner</div>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 360, background: "#000" }} />
        </div>
      </div>
      <button
        onClick={handleNext}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          fontSize: 16,
          borderRadius: 6,
          cursor: "pointer",
          backgroundColor: "#ff5e5e",
          color: "#fff",
          border: "none",
        }}
      >
        Next
      </button>
    </div>
  );
}
