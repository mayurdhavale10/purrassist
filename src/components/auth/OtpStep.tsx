"use client";

import { useEffect, useState } from "react";

type Props = {
  email: string;
  onBack: () => void;
  onVerified: () => void; // call this when verify succeeds
};

function maskEmail(e: string) {
  const [user, domain] = (e || "").split("@");
  if (!user || !domain) return e || "";
  const shown = user.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(user.length - 2, 0))}@${domain}`;
}

export default function OtpStep({ email, onBack, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // resend cooldown
  const [cooldown, setCooldown] = useState(60);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function verify() {
    setErr(null);
    setInfo(null);

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setErr("Email missing for verification. Please go back and enter email again.");
      return;
    }
    const c = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(c)) {
      setErr("Enter the 6-digit code.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/auth/email-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code: c }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) {
        throw new Error(j?.error || "Verification failed");
      }
      setInfo("Verified!");
      onVerified(); // AuthModal continues (Role → ID Upload)
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg === "invalid_email") setErr("That email looks invalid. Go back and re-enter it.");
      else if (msg === "expired_or_missing") setErr("Code expired or missing. Resend a new one.");
      else if (msg === "invalid_code") setErr("That code didn’t match. Try again.");
      else if (msg === "too_many_attempts") setErr("Too many attempts. Please resend a new code after a minute.");
      else setErr("Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErr(null);
    setInfo(null);

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setErr("Email missing for resend. Please go back and re-enter it.");
      return;
    }
    if (cooldown > 0) return;

    setBusy(true);
    try {
      const r = await fetch("/api/auth/email-otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Could not resend code");
      setInfo("A new code was sent.");
      setCooldown(60);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg === "cooldown") setErr("Please wait a bit before resending.");
      else setErr("Could not resend code. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-white">
      <h3 className="text-lg font-semibold mb-2">Verify your email</h3>
      <p className="text-sm text-white/70 mb-4">
        We sent a 6-digit code to <span className="font-medium">{maskEmail(email)}</span>
      </p>

      <input
        inputMode="numeric"
        pattern="\d*"
        maxLength={6}
        placeholder="Enter 6-digit code"
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40 tracking-widest text-center"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
      />

      {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      {info && <p className="mt-3 text-sm text-emerald-300">{info}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 py-2"
          disabled={busy}
        >
          Back
        </button>
        <button
          onClick={verify}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 py-2 disabled:opacity-50"
          disabled={busy || code.length !== 6}
        >
          {busy ? "Verifying…" : "Verify"}
        </button>
      </div>

      <div className="mt-3 text-center">
        <button
          onClick={resend}
          disabled={busy || cooldown > 0}
          className="text-sm text-white/80 hover:text-white disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
