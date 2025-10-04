"use client";

import { useState } from "react";

type Props = {
  value?: string;
  onBack: () => void;
  onNext: (name: string) => void;
};

export default function ProfileNameStep({ value = "", onBack, onNext }: Props) {
  const [name, setName] = useState(value);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm text-white/80 mb-2">Full name (profile name)</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Mayur Dhavale"
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      {err && <p className="mt-1 text-xs text-red-300">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back
        </button>
        <button
          onClick={() => {
            if (!name.trim()) return setErr("Please enter your name");
            setErr(null);
            onNext(name.trim());
          }}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 text-white py-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
