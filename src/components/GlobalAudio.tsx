"use client";
import { useEffect, useRef, useState } from "react";

export default function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // ensure attributes & state are consistent for autoplay policies
    a.muted = true;
    a.volume = 0.4;
    a.play().catch(() => {/* waiting for user gesture */});
  }, []);

  const toggleMute = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isMuted) {
      a.muted = false;
      try { await a.play(); } catch {}
    } else {
      a.muted = true;
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/purr_audio.mp3"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-[100] rounded-full px-4 py-2 shadow-lg border bg-white/80 backdrop-blur hover:bg-white transition text-sm font-medium"
        title={isMuted ? "Unmute background audio" : "Mute background audio"}
      >
        {isMuted ? "🔊 Unmute" : "🔇 Mute"}
      </button>
    </>
  );
}
