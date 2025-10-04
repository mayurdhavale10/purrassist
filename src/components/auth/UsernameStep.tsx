"use client";

import { useEffect, useState } from "react";

type Props = {
  value?: string;
  onBack: () => void;
  onNext: (username: string) => void;
};

export default function UsernameStep({ value = "", onBack, onNext }: Props) {
  const [u, setU] = useState(value);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");

  useEffect(() => {
    if (!u) return setStatus("idle");
    const t = setTimeout(async () => {
      setStatus("checking");
      const r = await fetch(`/api/users/username/check?handle=${encodeURIComponent(u)}`);
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        setStatus(j.reason === "invalid_format" ? "invalid" : "taken");
      } else {
        setStatus(j.available ? "ok" : "taken");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [u]);

  return (
    <div>
      <label className="block text-sm text-white/80 mb-2">Choose a username</label>
      <div className="flex items-center gap-2">
        <span className="text-white/70">@</span>
        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="mayur_d"
          className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <p className="mt-2 text-xs">
        {status === "checking" && <span className="text-white/70">Checking…</span>}
        {status === "ok" && <span className="text-emerald-300">Available</span>}
        {status === "taken" && <span className="text-red-300">Taken</span>}
        {status === "invalid" && (
          <span className="text-red-300">3–20 chars, start with a letter. Use letters, numbers, . or _</span>
        )}
      </p>

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back
        </button>
        <button
          onClick={() => status === "ok" && onNext(u)}
          disabled={status !== "ok"}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white py-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
