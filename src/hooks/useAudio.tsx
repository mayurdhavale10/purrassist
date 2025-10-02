// src/hooks/useAudio.tsx
"use client";

import * as React from "react";

/**
 * useAudio — centralized audio manager hook
 *
 * Features:
 * - SFX playback with a small pooled <audio> elements (no stutter)
 * - Looped ringtone / ringback (start/stop)
 * - Global mute & per-channel volumes (sfx, ringtone, media)
 * - Unlock-on-gesture to satisfy browser autoplay policies
 * - Mic recording (MediaRecorder) for voice notes (start/stop/cancel)
 * - Input device selection (choose mic), remembers preference
 * - Optional output device switching (sinkId) where supported
 * - Visibility handling (auto-pause looped sounds when tab hidden)
 *
 * All state is stored in a singleton manager so multiple components
 * can call this hook without duplicating audio resources.
 */

/** ---- Types ---- */
export type AudioChannel = "sfx" | "ringtone" | "media";

export type PlayOptions = {
  volume?: number; // 0..1 overrides sfx volume
  rate?: number;   // playback rate (1.0 = normal)
};

export type RecordingState =
  | { status: "idle" }
  | { status: "recording"; startedAt: number }
  | { status: "paused"; startedAt: number };

type RegisteredSound = {
  name: string;
  src: string;
  channel: AudioChannel; // "sfx" | "ringtone"
  preload?: boolean;
};

/** ---- Constants / Storage Keys ---- */
const LS_KEYS = {
  MUTED: "audio.muted",
  VOL_SFX: "audio.volume.sfx",
  VOL_RING: "audio.volume.ringtone",
  VOL_MEDIA: "audio.volume.media",
  INPUT_DEVICE: "audio.input.deviceId",
  OUTPUT_DEVICE: "audio.output.deviceId",
} as const;

/** ---- Utility ---- */
const isClient = typeof window !== "undefined";

/** Small pool so rapid SFX overlap nicely */
class AudioPool {
  private pool: HTMLAudioElement[] = [];
  private maxSize: number;
  private channel: AudioChannel;

  constructor(channel: AudioChannel, size = 4) {
    this.maxSize = size;
    this.channel = channel;
  }

  acquire(): HTMLAudioElement {
    const idle = this.pool.find((a) => a.paused && !a.loop);
    if (idle) return idle;
    if (this.pool.length < this.maxSize) {
      const a = new Audio();
      a.preload = "auto";
      (a as any).__channel = this.channel;
      this.pool.push(a);
      return a;
    }
    // Reuse the oldest
    return this.pool[0];
  }

  all(): HTMLAudioElement[] {
    return this.pool;
  }
}

type ManagerState = {
  unlocked: boolean;
  muted: boolean;
  volume: Record<AudioChannel, number>; // 0..1
  inputDeviceId?: string | null;
  outputDeviceId?: string | null;

  // registry
  sounds: Map<string, RegisteredSound>;

  // looped ringtone
  ring?: {
    name: string;
    el: HTMLAudioElement;
  };

  // recording
  rec: {
    state: RecordingState;
    mediaStream: MediaStream | null;
    mr: MediaRecorder | null;
    chunks: Blob[];
    mimeType?: string;
    // resolve on stop
    onStop?: (file: File | null) => void;
  };

  // pools
  pools: {
    sfx: AudioPool;
    ringtone: AudioPool;
  };
};

class AudioManager {
  state: ManagerState;

  // subscribers (for React hook)
  private subs = new Set<() => void>();

  constructor() {
    // defaults
    const muted = this.loadBool(LS_KEYS.MUTED, false);
    const volSfx = this.loadNum(LS_KEYS.VOL_SFX, 0.75);
    const volRing = this.loadNum(LS_KEYS.VOL_RING, 0.75);
    const volMedia = this.loadNum(LS_KEYS.VOL_MEDIA, 1.0);

    this.state = {
      unlocked: false,
      muted,
      volume: { sfx: volSfx, ringtone: volRing, media: volMedia },
      inputDeviceId: this.loadStr(LS_KEYS.INPUT_DEVICE, null),
      outputDeviceId: this.loadStr(LS_KEYS.OUTPUT_DEVICE, null),
      sounds: new Map(),
      ring: undefined,
      rec: {
        state: { status: "idle" },
        mediaStream: null,
        mr: null,
        chunks: [],
        mimeType: undefined,
        onStop: undefined,
      },
      pools: {
        sfx: new AudioPool("sfx", 4),
        ringtone: new AudioPool("ringtone", 2),
      },
    };

    if (isClient) {
      // Auto-pause looped sounds when tab hidden
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stopRingtone();
        }
      });
    }
  }

  /** ---- Persistence helpers ---- */
  private save(key: string, val: string) {
    try {
      if (isClient) localStorage.setItem(key, val);
    } catch {}
  }
  private loadBool(key: string, def: boolean) {
    try {
      const v = isClient ? localStorage.getItem(key) : null;
      if (v === null) return def;
      return v === "1";
    } catch {
      return def;
    }
  }
  private loadNum(key: string, def: number) {
    try {
      const v = isClient ? localStorage.getItem(key) : null;
      if (v === null) return def;
      const n = Number(v);
      return Number.isFinite(n) ? n : def;
    } catch {
      return def;
    }
  }
  private loadStr(key: string, def: string | null) {
    try {
      const v = isClient ? localStorage.getItem(key) : null;
      return v ?? def;
    } catch {
      return def;
    }
  }

  /** ---- Subscription for hook ---- */
  subscribe(cb: () => void) {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }
  private emit() {
    this.subs.forEach((fn) => fn());
  }

  /** ---- Unlock on user gesture ---- */
  async unlock(): Promise<void> {
    if (!isClient) return;
    if (this.state.unlocked) return;
    // Safari/Chrome need a gesture before audio .play() resolves reliably
    try {
      // attempt silent play on pooled element
      const a = this.state.pools.sfx.acquire();
      a.src = "";
      a.muted = true;
      await a.play().catch(() => {});
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    } catch {}
    this.state.unlocked = true;
    this.emit();
  }

  /** ---- Registry ---- */
  registerSound(def: RegisteredSound) {
    this.state.sounds.set(def.name, def);
    if (def.preload) {
      const a = new Audio(def.src);
      a.preload = "auto";
    }
  }
  unregisterSound(name: string) {
    this.state.sounds.delete(name);
  }

  /** ---- Volume / Mute ---- */
  setMuted(muted: boolean) {
    this.state.muted = muted;
    this.save(LS_KEYS.MUTED, muted ? "1" : "0");
    // If muting while ringtone active, stop it
    if (muted) this.stopRingtone();
    this.emit();
  }

  setVolume(channel: AudioChannel, volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    this.state.volume[channel] = v;
    const key =
      channel === "sfx"
        ? LS_KEYS.VOL_SFX
        : channel === "ringtone"
        ? LS_KEYS.VOL_RING
        : LS_KEYS.VOL_MEDIA;
    this.save(key, String(v));
    // update currently playing ring
    if (channel === "ringtone" && this.state.ring?.el) {
      this.state.ring.el.volume = this.effectiveVolume("ringtone", v);
    }
    this.emit();
  }

  private effectiveVolume(channel: AudioChannel, base: number) {
    return this.state.muted ? 0 : Math.max(0, Math.min(1, base));
  }

  /** ---- Output sink selection (where supported) ---- */
  async setOutputDevice(deviceId: string | null) {
    this.state.outputDeviceId = deviceId;
    this.save(LS_KEYS.OUTPUT_DEVICE, deviceId ?? "");
    // Try to apply on active audios
    const apply = async (a: HTMLAudioElement) => {
      const sinkId = (a as any).setSinkId;
      if (typeof sinkId === "function" && deviceId) {
        try {
          await (a as any).setSinkId(deviceId);
        } catch {
          /* ignore */
        }
      }
    };
    this.state.pools.sfx.all().forEach(apply);
    if (this.state.ring?.el) apply(this.state.ring.el);
    this.emit();
  }

  /** ---- SFX Playback ---- */
  async play(name: string, opts?: PlayOptions) {
    if (!isClient) return;
    const def = this.state.sounds.get(name);
    if (!def) return;

    if (!this.state.unlocked) {
      // Do not auto-unlock here to respect autoplay policies;
      // consumer should call `unlock()` on first user gesture.
      return;
    }

    if (this.state.muted) return;

    const pool =
      def.channel === "ringtone" ? this.state.pools.ringtone : this.state.pools.sfx;

    const a = pool.acquire();
    a.loop = false;
    a.src = def.src;
    a.volume = this.effectiveVolume(
      "sfx",
      opts?.volume ?? this.state.volume.sfx
    );
    a.playbackRate = opts?.rate ?? 1.0;

    // Try to set sink if chosen and supported
    if (this.state.outputDeviceId && typeof (a as any).setSinkId === "function") {
      try {
        await (a as any).setSinkId(this.state.outputDeviceId);
      } catch {}
    }

    try {
      await a.play();
    } catch {
      // ignored; usually blocked when not unlocked
    }
  }

  /** ---- Ringtone Loop ---- */
  async startRingtone(name: string) {
    if (!isClient) return;
    const def = this.state.sounds.get(name);
    if (!def) return;

    if (!this.state.unlocked || this.state.muted) return;

    // stop any existing ring first
    this.stopRingtone();

    const a = new Audio(def.src);
    a.preload = "auto";
    a.loop = true;
    a.volume = this.effectiveVolume("ringtone", this.state.volume.ringtone);

    if (this.state.outputDeviceId && typeof (a as any).setSinkId === "function") {
      try {
        await (a as any).setSinkId(this.state.outputDeviceId);
      } catch {}
    }

    try {
      await a.play();
      this.state.ring = { name, el: a };
      this.emit();
    } catch {
      // fallback: mark unlocked false to force user gesture next time
      this.state.unlocked = false;
      this.emit();
    }
  }

  stopRingtone() {
    const ring = this.state.ring?.el;
    if (ring) {
      try {
        ring.pause();
        ring.currentTime = 0;
      } catch {}
      this.state.ring = undefined;
      this.emit();
    }
  }

  /** ---- Recording (voice notes) ---- */
  async listInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!isClient || !navigator.mediaDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "audioinput");
  }

  async setInputDevice(deviceId: string | null) {
    this.state.inputDeviceId = deviceId ?? null;
    this.save(LS_KEYS.INPUT_DEVICE, deviceId ?? "");
    this.emit();
  }

  async startRecording(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isClient || !navigator.mediaDevices) {
      return { ok: false, error: "MEDIA_UNSUPPORTED" };
    }
    if (this.state.rec.state.status === "recording") {
      return { ok: false, error: "ALREADY_RECORDING" };
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: this.state.inputDeviceId
          ? { deviceId: { exact: this.state.inputDeviceId } }
          : true,
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mimeType =
        MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported?.("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      this.state.rec.mediaStream = stream;
      this.state.rec.mr = mr;
      this.state.rec.chunks = [];
      this.state.rec.mimeType = mimeType;
      this.state.rec.state = { status: "recording", startedAt: Date.now() };

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.state.rec.chunks.push(e.data);
      };
      mr.onstop = () => {
        // no-op, finalization handled in stopRecording
      };
      mr.start();

      this.emit();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "MIC_PERMISSION_DENIED" };
    }
  }

  async stopRecording(filename = "voice-note.webm"): Promise<File | null> {
    const { mr, mediaStream, chunks, mimeType } = this.state.rec;
    if (!mr) return null;

    const stopped: Promise<void> = new Promise((resolve) => {
      mr.onstop = () => resolve();
    });

    try {
      if (mr.state !== "inactive") mr.stop();
    } catch {}
    await stopped;

    mediaStream?.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
    const file = new File([blob], filename, { type: blob.type });

    // reset
    this.state.rec = {
      state: { status: "idle" },
      mediaStream: null,
      mr: null,
      chunks: [],
      mimeType: undefined,
      onStop: undefined,
    };
    this.emit();
    return file;
  }

  async cancelRecording() {
    const { mr, mediaStream } = this.state.rec;
    try {
      if (mr && mr.state !== "inactive") mr.stop();
    } catch {}
    mediaStream?.getTracks().forEach((t) => t.stop());
    this.state.rec = {
      state: { status: "idle" },
      mediaStream: null,
      mr: null,
      chunks: [],
      mimeType: undefined,
      onStop: undefined,
    };
    this.emit();
  }
}

/** ---- Singleton instance ---- */
const manager = isClient ? new AudioManager() : (null as any);

/** ---- React Hook ---- */
export function useAudio() {
  const [, force] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (!manager) return;
    return manager.subscribe(force);
  }, []);

  return React.useMemo(() => {
    if (!manager) {
      // SSR safety — return no-ops
      return {
        unlocked: false,
        muted: false,
        volume: { sfx: 0.75, ringtone: 0.75, media: 1.0 } as Record<
          AudioChannel,
          number
        >,
        // registry
        registerSound: (_def: RegisteredSound) => {},
        unregisterSound: (_: string) => {},
        // unlock
        unlock: async () => {},
        // play/loop
        play: async (_name: string, _opts?: PlayOptions) => {},
        startRingtone: async (_name: string) => {},
        stopRingtone: () => {},
        // volumes
        setMuted: (_m: boolean) => {},
        setVolume: (_ch: AudioChannel, _v: number) => {},
        // devices
        listInputDevices: async () => [],
        setInputDevice: async (_: string | null) => {},
        setOutputDevice: async (_: string | null) => {},
        // recording
        recording: { status: "idle" } as RecordingState,
        startRecording: async () => ({ ok: false as const, error: "SSR" }),
        stopRecording: async () => null,
        cancelRecording: async () => {},
      };
    }

    return {
      // state
      unlocked: manager.state.unlocked,
      muted: manager.state.muted,
      volume: manager.state.volume,
      recording: manager.state.rec.state as RecordingState,

      // registry
      registerSound: (def: RegisteredSound) => manager.registerSound(def),
      unregisterSound: (name: string) => manager.unregisterSound(name),

      // unlock
      unlock: () => manager.unlock(),

      // playback
      play: (name: string, opts?: PlayOptions) => manager.play(name, opts),
      startRingtone: (name: string) => manager.startRingtone(name),
      stopRingtone: () => manager.stopRingtone(),

      // volumes
      setMuted: (m: boolean) => manager.setMuted(m),
      setVolume: (ch: AudioChannel, v: number) => manager.setVolume(ch, v),

      // devices
      listInputDevices: () => manager.listInputDevices(),
      setInputDevice: (id: string | null) => manager.setInputDevice(id),
      setOutputDevice: (id: string | null) => manager.setOutputDevice(id),

      // recording
      startRecording: () => manager.startRecording(),
      stopRecording: (filename?: string) => manager.stopRecording(filename),
      cancelRecording: () => manager.cancelRecording(),
    };
  }, [force]);
}

/** ---- Quick usage example (commented) ----
import { useAudio } from "@/hooks/useAudio";

function Example() {
  const {
    unlocked, unlock,
    play, startRingtone, stopRingtone,
    muted, setMuted, setVolume,
    startRecording, stopRecording, cancelRecording, recording,
    registerSound,
  } = useAudio();

  React.useEffect(() => {
    // register your sounds once (URLs in /public)
    registerSound({ name: "send", src: "/sfx/send.mp3", channel: "sfx", preload: true });
    registerSound({ name: "receive", src: "/sfx/receive.mp3", channel: "sfx" });
    registerSound({ name: "ring", src: "/sfx/ring.mp3", channel: "ringtone" });
  }, [registerSound]);

  return (
    <div>
      {!unlocked && <button onClick={unlock}>Enable Sound</button>}
      <button onClick={() => play("send")}>Send Tick</button>
      <button onClick={() => startRingtone("ring")}>Start Ring</button>
      <button onClick={() => stopRingtone()}>Stop Ring</button>
      <button onClick={() => setMuted(!muted)}>Mute</button>
      <button onClick={() => setVolume("sfx", 0.5)}>SFX 50%</button>

      {recording.status !== "recording" ? (
        <button onClick={startRecording}>Record</button>
      ) : (
        <>
          <button onClick={async () => {
            const file = await stopRecording("note.webm");
            // upload file to your server
          }}>Stop & Save</button>
          <button onClick={cancelRecording}>Cancel</button>
        </>
      )}
    </div>
  );
}
------------------------------------------- */
