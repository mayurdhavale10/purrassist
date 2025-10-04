"use client";

import { useState } from "react";

type Props = {
  onBack: () => void;
};

export default function ForgotPasswordStart({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid email");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (e: any) {
      setErr("Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="text-white">
        <p className="text-sm">
          If an account exists for <b>{email}</b>, we’ve sent a reset link. Check your inbox.
        </p>
        <button onClick={onBack} className="mt-4 w-full rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-white/80 mb-2">Email</label>
      <input
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {err && <p className="mt-1 text-xs text-red-300">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 text-white py-2 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </div>
    </div>
  );
}
