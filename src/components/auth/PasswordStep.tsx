"use client";

import { useState } from "react";

type Props = {
  value?: string;
  onBack: () => void;
  onNext: (password: string) => void;
};

export default function PasswordStep({ value = "", onBack, onNext }: Props) {
  const [pwd, setPwd] = useState(value);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm text-white/80 mb-2">Create a password</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 pr-10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 px-3 text-white/60 hover:text-white"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-red-300">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
          Back
        </button>
        <button
          onClick={() => {
            if (pwd.length < 8) return setErr("Minimum 8 characters");
            setErr(null);
            onNext(pwd);
          }}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 text-white py-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
