"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Invalid reset link
      </div>
    );
  }

  const submit = async () => {
    if (pwd.length < 8) return setErr("Minimum 8 characters");
    if (pwd !== pwd2) return setErr("Passwords do not match");
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Failed to reset password");
      setMsg("Password updated. You can now log in.");
      setTimeout(() => router.push("/"), 1500);
    } catch (e: any) {
      setErr(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6">
        <h1 className="text-white text-lg font-semibold">Set a new password</h1>
        <div className="mt-4 space-y-3">
          <input
            type="password"
            placeholder="New password (min 8)"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
          {err && <p className="text-sm text-red-300">{err}</p>}
          {msg && <p className="text-sm text-emerald-300">{msg}</p>}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-xl bg-white/20 hover:bg-white/30 text-white py-2 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save password"}
          </button>
        </div>
      </div>
    </div>
  );
}
