"use client";

import { useState } from "react";

type Props = {
  value?: string;
  onNext: (email: string) => void;
  onGoogle: () => void;
  mode?: "login" | "signup";
};

export default function EmailStep({ value = "", onNext, onGoogle, mode = "signup" }: Props) {
  const [email, setEmail] = useState(value);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm text-white/80 mb-2">
        Email
      </label>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@college.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      {err && <p className="mt-1 text-xs text-red-300">{err}</p>}

      <button
        onClick={() => {
          const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          if (!ok) return setErr("Please enter a valid email");
          setErr(null);
          onNext(email.trim());
        }}
        className="mt-4 w-full rounded-xl bg-white/20 hover:bg-white/30 text-white py-2 transition"
      >
        {mode === "signup" ? "Continue" : "Next"}
      </button>

      <button
        onClick={onGoogle}
        className="mt-2 w-full rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10 transition"
      >
        Continue with Google
      </button>
    </div>
  );
}
