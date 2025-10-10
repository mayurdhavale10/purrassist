// src/components/auth/RoleStep.tsx
"use client";

import { useEffect, useState } from "react";

export type RoleType = "college" | "school" | "professional";

type Props = {
  value: RoleType | null;
  defaultOrgName?: string;                          // <-- add this
  onBack: () => void;
  onNext: (role: RoleType, orgName?: string) => void; // <-- allow orgName
};

const roles: { key: RoleType; label: string; hint: string }[] = [
  { key: "college",      label: "College Student",      hint: "Use college email or ID card" },
  { key: "school",       label: "School Student",       hint: "Upload student ID card" },
  { key: "professional", label: "Working Professional", hint: "Use company email or ID card" },
];

export default function RoleStep({ value, defaultOrgName, onBack, onNext }: Props) {
  const [role, setRole] = useState<RoleType | null>(value ?? null);
  const [orgName, setOrgName] = useState(defaultOrgName ?? "");

  // keep internal state in sync if parent changes
  useEffect(() => {
    setRole(value ?? null);
  }, [value]);

  useEffect(() => {
    setOrgName(defaultOrgName ?? "");
  }, [defaultOrgName]);

  const canContinue = !!role; // orgName is optional for now

  return (
    <div className="text-white">
      <p className="text-sm text-white/80 mb-3">Who are you?</p>

      <div className="space-y-2 mb-4">
        {roles.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRole(r.key)}
            className={`w-full rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-left px-4 py-3 transition ${
              role === r.key ? "ring-2 ring-white/30" : ""
            }`}
          >
            <div className="font-medium">{r.label}</div>
            <div className="text-xs text-white/70">{r.hint}</div>
          </button>
        ))}
      </div>

      {/* Free-text org field (optional but useful for classification) */}
      <label className="block text-xs text-white/70 mb-1">Organization (college/school/company)</label>
      <input
        type="text"
        placeholder="e.g., VIT Bhopal"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
      />

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => role && onNext(role, orgName.trim() || undefined)}
          disabled={!canContinue}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white py-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
