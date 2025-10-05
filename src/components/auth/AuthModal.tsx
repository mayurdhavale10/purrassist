// src/components/auth/AuthModal.tsx
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
import OtpStep from "./OtpStep"; // NEW: email OTP step

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
  /** optional: where to send lane A users after success */
  onLaneASuccessNavigate?: (href: string) => void;
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

type Lane = "A" | "B" | null;

export default function AuthModal({
  open,
  onClose,
  defaultTab = "signup",
  onLaneASuccessNavigate,
}: Props) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [stepIdx, setStepIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<SignupState>(emptySignup);
  const [lane, setLane] = useState<Lane>(null);

  // reset when closing
  useEffect(() => {
    if (!open) {
      setTab(defaultTab);
      setStepIdx(0);
      setState(emptySignup);
      setLane(null);
      setErr(null);
      setBusy(false);
    }
  }, [open, defaultTab]);

  /** Step 1: classify email → lane A/B */
  async function handleEmailNext(email: string) {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/email/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok || !j?.lane) throw new Error(j?.error || "Could not classify email");
      setLane(j.lane as Lane);
      setState((s) => ({ ...s, email }));
      setStepIdx(1);
    } catch (e: any) {
      setErr(e?.message || "Could not classify email");
    } finally {
      setBusy(false);
    }
  }

  /** After Username step → register, then sign in via Credentials */
  async function handleRegisterThenLogin() {
    setErr(null);
    setBusy(true);
    try {
      // 1) Register (send lane we just determined)
      const reg = await fetch("/api/auth/email/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          profileName: state.profileName,
          username: state.username,
          lane, // IMPORTANT
        }),
      });
      const rj = await reg.json();
      if (!reg.ok || !rj?.ok) throw new Error(rj?.error || "Registration failed");

      // 2) Issue session cookie with NextAuth (credentials)
      const sres = await signIn("credentials", {
        email: state.email,
        password: state.password,
        redirect: false,
      });
      if (sres?.error) throw new Error(sres.error);

      // 3) Branch by lane
      if (lane === "A") {
        // Fast path: done!
        setStepIdx(7); // Success index
        onLaneASuccessNavigate?.("/connections");
      } else {
        // Lane B: kick off email OTP and show OTP step
        await fetch("/api/auth/email-otp/start", { method: "POST", credentials: "include" });
        setStepIdx(4); // OTP step index
      }
    } catch (e: any) {
      setErr(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  /** Login path (tab = login): call credentials directly */
  async function handleLoginPasswordNext(password: string) {
    setState((s) => ({ ...s, password }));
    setErr(null);
    setBusy(true);
    try {
      const sres = await signIn("credentials", { email: state.email, password, redirect: false });
      if (sres?.error) throw new Error(sres.error);
      // login successful
      setStepIdx(7); // Success
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  /** Lane B → ID upload (with cookies) */
  async function handleIdUpload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (state.role) fd.append("role", state.role);

      const r = await fetch("/api/verification/upload", {
        method: "POST",
        body: fd,
        credentials: "include", // IMPORTANT for session cookie
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Upload failed");
      setState((s) => ({ ...s, idFile: file, idUploadedUrl: j.url ?? null }));
      setStepIdx(7); // Success
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const steps = useMemo(
    () => [
      // 0) Email
      <EmailStep
        key="email"
        value={state.email}
        onNext={handleEmailNext}
        onGoogle={() => signIn("google")}
      />,

      // 1) Password
      <PasswordStep
        key="password"
        value={state.password}
        onBack={() => setStepIdx(0)}
        onNext={(password) => {
          if (tab === "login") {
            handleLoginPasswordNext(password);
          } else {
            setState((s) => ({ ...s, password }));
            setStepIdx(2);
          }
        }}
      />,

      // 2) Profile name
      <ProfileNameStep
        key="name"
        value={state.profileName}
        onBack={() => setStepIdx(1)}
        onNext={(name) => {
          setState((s) => ({ ...s, profileName: name }));
          setStepIdx(3);
        }}
      />,

      // 3) Username
      <UsernameStep
        key="username"
        value={state.username}
        onBack={() => setStepIdx(2)}
        onNext={async (u) => {
          setState((s) => ({ ...s, username: u }));
          if (tab === "signup") await handleRegisterThenLogin();
          else setStepIdx(4);
        }}
      />,

      // 4) OTP (Lane B)
      <OtpStep
        key="otp"
        email={state.email}
        onBack={() => setStepIdx(3)}
        onVerified={() => setStepIdx(5)} // proceed to Role after OTP passes
      />,

      // 5) Role (Lane B)
      <RoleStep
        key="role"
        value={state.role}
        onBack={() => setStepIdx(4)}
        onNext={(role) => {
          setState((s) => ({ ...s, role }));
          setStepIdx(6); // go to ID upload
        }}
      />,

      // 6) ID Upload (Lane B)
      <IdUploadStep
        key="id"
        file={state.idFile}
        onBack={() => setStepIdx(5)}
        onNext={handleIdUpload}
      />,

      // 7) Success
      <SuccessStep key="done" email={state.email} onFinish={onClose} />,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, tab, lane, onClose]
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
              onClick={() => {
                setTab("login");
                setStepIdx(0);
                setErr(null);
              }}
            >
              Log in
            </button>
            <button
              className={`py-2 rounded-lg text-sm transition ${
                tab === "signup" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => {
                setTab("signup");
                setStepIdx(0);
                setErr(null);
              }}
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
              {/* Google icon omitted for brevity */}
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
          <div className="min-h-[240px]">
            {tab === "signup" ? (
              steps[stepIdx]
            ) : stepIdx === 0 ? (
              <EmailStep
                mode="login"
                value={state.email}
                onNext={(email) => {
                  setState((s) => ({ ...s, email }));
                  setStepIdx(1);
                }}
                onGoogle={() => signIn("google")}
              />
            ) : (
              steps[1] // password (login path)
            )}
          </div>

          {/* Footer / error */}
          {!!err && <p className="mt-4 text-sm text-red-300">{err}</p>}
          {busy && <p className="mt-4 text-sm text-white/70">Working…</p>}
        </div>
      </div>
    </div>
  );
}
