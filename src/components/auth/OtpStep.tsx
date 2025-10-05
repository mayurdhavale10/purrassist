"use client";

import { useState } from "react";

type Props = {
  email: string;
  onBack: () => void;
  onVerified: () => void;        // call when OTP verifies successfully
  onResent?: () => void;         // optional hook after resend
};

export default function OtpStep({ email, onBack, onVerified, onResent }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(`We sent a 6-digit code to ${email}`);

  async function verify() {
    if (!code || code.trim().length < 6) {
      setErr("Enter the 6-digit code");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Invalid code");
      onVerified();
    } catch (e: any) {
      setErr(e?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email-otp/start", {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Couldn’t resend yet");
      setInfo("New code sent. Check your inbox (and spam).");
      onResent?.();
    } catch (e: any) {
      setErr(e?.message || "Resend failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white text-base font-semibold">Verify your email</h3>
      {info && <p className="text-white/70 text-sm">{info}</p>}

      <input
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Enter 6-digit code"
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
      />

      {err && <p className="text-sm text-red-300">{err}</p>}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 text-white py-2"
          disabled={busy}
        >
          Back
        </button>
        <button
          onClick={verify}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 text-white py-2 disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Checking…" : "Verify"}
        </button>
      </div>

      <button
        onClick={resend}
        className="text-xs text-white/70 hover:text-white underline-offset-2 hover:underline disabled:opacity-50"
        disabled={busy}
      >
        Resend code
      </button>
    </div>
  );
}
