"use client";

export type RoleType = "college" | "school" | "professional";

type Props = {
  value: RoleType | null;
  onBack: () => void;
  onNext: (role: RoleType) => void;
};

const roles: { key: RoleType; label: string; hint: string }[] = [
  { key: "college", label: "College Student", hint: "Use college email or ID card" },
  { key: "school", label: "School Student", hint: "Upload student ID card" },
  { key: "professional", label: "Working Professional", hint: "Use company email or ID card" },
];

export default function RoleStep({ value, onBack, onNext }: Props) {
  return (
    <div>
      <p className="text-sm text-white/80 mb-3">Who are you?</p>
      <div className="space-y-2">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => onNext(r.key)}
            className={`w-full rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-left px-4 py-3 text-white transition ${
              value === r.key ? "ring-2 ring-white/30" : ""
            }`}
          >
            <div className="font-medium">{r.label}</div>
            <div className="text-xs text-white/70">{r.hint}</div>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="mt-4 w-full rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10">
        Back
      </button>
    </div>
  );
}
