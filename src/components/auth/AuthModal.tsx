"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import EmailStep from "./EmailStep";
import PasswordStep from "./PasswordStep";
import ProfileNameStep from "./ProfileNameStep";
import UsernameStep from "./UsernameStep";
import RoleStep, { RoleType } from "./RoleStep";
import IdUploadStep from "./IdUploadStep";
import SuccessStep from "./SuccessStep";
import ForgotPasswordStart from "./ForgotPasswordStart";

export type SignupState = {
  email: string;
  password: string;
  profileName: string;
  username: string;
  role: RoleType | null;
  idFile: File | null;
  idUploadedUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
};

const emptySignup: SignupState = {
  email: "",
  password: "",
  profileName: "",
  username: "",
  role: null,
  idFile: null,
  idUploadedUrl: null,
};

export default function AuthModal({ open, onClose, defaultTab = "signup" }: Props) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [stepIdx, setStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<SignupState>(emptySignup);

  useEffect(() => {
    if (!open) {
      // reset when closing
      setTab(defaultTab);
      setStepIdx(0);
      setState(emptySignup);
      setErr(null);
      setBusy(false);
    }
  }, [open, defaultTab]);

  const steps = useMemo(
    () => [
      <EmailStep
        key="email"
        value={state.email}
        onNext={(email) => {
          setState((s) => ({ ...s, email }));
          setStepIdx(1);
        }}
        onGoogle={() => signIn("google")}
      />,
      <PasswordStep
        key="password"
        value={state.password}
        onBack={() => setStepIdx(0)}
        onNext={(password) => {
          setState((s) => ({ ...s, password }));
          setStepIdx(2);
        }}
      />,
      <ProfileNameStep
        key="name"
        value={state.profileName}
        onBack={() => setStepIdx(1)}
        onNext={(name) => {
          setState((s) => ({ ...s, profileName: name }));
          setStepIdx(3);
        }}
      />,
      <UsernameStep
        key="username"
        value={state.username}
        onBack={() => setStepIdx(2)}
        onNext={(u) => {
          setState((s) => ({ ...s, username: u }));
          setStepIdx(4);
        }}
      />,
      <RoleStep
        key="role"
        value={state.role}
        onBack={() => setStepIdx(3)}
        onNext={(role) => {
          setState((s) => ({ ...s, role }));
          // Only ask for ID when not clearly college-email. Keep it simple: always ask now.
          setStepIdx(5);
        }}
      />,
      <IdUploadStep
        key="id"
        file={state.idFile}
        onBack={() => setStepIdx(4)}
        onNext={async (file) => {
          setBusy(true);
          setErr(null);
          try {
            const fd = new FormData();
            fd.append("file", file);
            const r = await fetch("/api/verification/upload", { method: "POST", body: fd });
            if (!r.ok) throw new Error("Upload failed");
            const j = await r.json();
            setState((s) => ({ ...s, idFile: file, idUploadedUrl: j.url ?? null }));
            setStepIdx(6);
          } catch (e: any) {
            setErr(e.message || "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />,
      <SuccessStep
        key="done"
        email={state.email}
        onFinish={onClose}
      />,
    ],
    [state, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Glassy card */}
      <div className="relative w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Your logo */}
              <img src="/purr_assit_logo.webp" alt="PurrAssist" className="h-8 w-8 rounded" />
              <h2 className="text-white/90 text-lg font-semibold">PurrAssist</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/10 p-1">
            <button
              className={`py-2 rounded-lg text-sm transition ${
                tab === "login" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setTab("login")}
            >
              Log in
            </button>
            <button
              className={`py-2 rounded-lg text-sm transition ${
                tab === "signup" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setTab("signup")}
            >
              Sign up
            </button>
          </div>

          {/* Social row */}
          <div className="mb-5">
            <button
              onClick={() => signIn("google")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/15 py-2.5 text-white hover:bg-white/25 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.5 0 19.5-8.1 19.5-19.5 0-1.3-.1-2.2-.3-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.9 16.1 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.6-5.2l-6.3-5.2c-2.1 1.9-4.8 3-7.7 3-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C9.1 39.5 16 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.5-5.2 6-9.3 6-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-11.1 0-20 8.9-20 20s8.9 20 20 20c11.5 0 19.5-8.1 19.5-19.5 0-1.3-.1-2.2-.3-4z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-2 text-xs text-white/60 backdrop-blur">
                or with email
              </span>
            </div>
          </div>

          {/* Steps */}
          <div className="min-h-[220px]">
            {tab === "signup" ? steps[stepIdx] : (
              <EmailStep
                mode="login"
                value={state.email}
                onNext={(email) => {
                  setState((s) => ({ ...s, email }));
                  // For demo, just let them type password on next step and call credentials later.
                  setTab("signup"); // reuse steps for password etc.
                  setStepIdx(1);
                }}
                onGoogle={() => signIn("google")}
              />
            )}
          </div>

          {/* Footer / error */}
          {!!err && (
            <p className="mt-4 text-sm text-red-300">{err}</p>
          )}
          {busy && (
            <p className="mt-4 text-sm text-white/70">Working…</p>
          )}
        </div>
      </div>
    </div>
  );
}
