// src/components/auth/IdUploadStep.tsx
"use client";

import { useRef, useState } from "react";

export type RoleType = "college" | "school" | "professional";

type Props = {
  /** Option A: let the component POST and promote */
  email?: string;                     // required if using onSuccess flow (Option B)
  role?: RoleType | null;             // required if using onSuccess flow
  orgName?: string;                   // optional free-text org name
  onSuccess?: (result: {
    ok: boolean;
    promoted?: boolean;
    userId?: string;
    error?: string;
  }) => void;

  /** Option B (legacy): parent handles upload — we just pass the File back */
  onNext?: (file: File) => void;

  /** Shared */
  initialFile?: File | null;          // preselected file
  onBack: () => void;
};

export default function IdUploadStep({
  email,
  role = null,
  orgName = "",
  onSuccess,
  onNext,
  initialFile = null,
  onBack,
}: Props) {
  const [local, setLocal] = useState<File | null>(initialFile);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pickFile(f: File) {
    const isPdf = /pdf$/i.test(f.type);
    const isImage = f.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setErr("Please upload an image or PDF (ID front preferred).");
      return;
    }
    setErr(null);
    setLocal(f);
  }

  async function submit() {
    setErr(null);
    setInfo(null);

    if (!local) {
      setErr("Choose a file first.");
      return;
    }

    // If parent wants legacy behavior, just hand the file back.
    if (onNext && !onSuccess) {
      onNext(local);
      return;
    }

    // New (recommended) behavior: this component uploads & promotes.
    if (!email || !email.includes("@")) {
      setErr("invalid_email");
      return;
    }
    const orgType =
      role === "college" || role === "school" || role === "professional" ? role : undefined;
    if (!orgType) {
      setErr("Please select your role (College/School/Professional) first.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", local);
      fd.append("email", email.trim().toLowerCase());
      fd.append("orgType", orgType);
      if (orgName) fd.append("orgName", orgName.trim());

      const res = await fetch("/api/verification/upload", {
        method: "POST",
        body: fd,
        // If your route reads cookies to authenticate, keep this:
        credentials: "include",
      });
      const j = await res.json();

      if (!res.ok || !j?.ok) {
        const reason = j?.error || "Upload failed";
        // Map a couple of common errors to friendlier text
        if (reason === "invalid_email") setErr("That email looks invalid. Please restart signup.");
        else if (reason === "not_found") setErr("Signup session expired. Please start again.");
        else setErr(reason);
        onSuccess?.({ ok: false, error: reason });
        return;
      }

      setInfo("Submitted for verification!");
      onSuccess?.({ ok: true, promoted: true, userId: j.userId });
    } catch (e: any) {
      setErr("Upload failed. Please try again.");
      onSuccess?.({ ok: false, error: "network_error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-white">
      <p className="text-sm text-white/80 mb-2">Upload your ID (college/school/company)</p>

      <div
        className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70 hover:bg-white/10 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        aria-label="Pick ID file"
      >
        {local ? (
          <div>
            <p className="mb-1 text-white">{local.name}</p>
            <p className="text-xs">Click to replace</p>
          </div>
        ) : (
          <p>Click to choose a file (PNG/JPG/PDF)</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        hidden
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) pickFile(f);
        }}
      />

      {err && (
        <p className="mt-2 text-xs text-red-300">
          {err === "invalid_email" ? "Invalid or missing email. Please restart signup." : err}
        </p>
      )}
      {info && <p className="mt-2 text-xs text-emerald-300">{info}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-white/15 text-white/90 py-2 hover:bg-white/10 disabled:opacity-50"
          disabled={busy}
        >
          Back
        </button>
        <button
          onClick={submit}
          disabled={!local || busy}
          className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white py-2"
        >
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-white/60">
        We store only what’s needed to verify you. By continuing you agree to our Privacy Policy.
      </p>
    </div>
  );
}
